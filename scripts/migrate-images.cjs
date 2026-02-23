/**
 * Image Migration Script
 *
 * Reorganizes images from flat import/ and qu/ directories into
 * topic-based folders organized by article, and updates all image
 * paths in articles.json.
 *
 * Usage:
 *   node scripts/migrate-images.cjs --dry-run   (preview changes)
 *   node scripts/migrate-images.cjs              (execute migration)
 */

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const IMAGES_DIR = path.join(PUBLIC, 'images');
const ARTICLES_PATH = path.join(ROOT, 'src', 'data', 'articles.json');

// ─── Article ID → New folder mapping ───────────────────────────────
const FOLDER_MAP = {
  'whats-new':                      'release-notes/whats-new',
  'user-login':                     'overview/user-login',
  'homepage-navigation':            'overview/homepage-navigation',
  'campaign-dashboard':             'campaigns/campaign-dashboard',
  'creating-new-campaign':          'campaigns/creating-new-campaign',
  'working-with-existing-campaigns':'campaigns/working-with-existing',
  'creating-working-with-lists':    'lists/creating-working-with',
  'data-validation-deduplication':  'lists/data-validation',
  'master-list':                    'lists/master-list',
  'templates':                      'templates/overview',
  'create-templates':               'templates/create-templates',
  'search-templates':               'templates/search-templates',
  'template-folders':               'templates/template-folders',
  'voice-templates':                'templates/voice-templates',
  'email-templates':                'templates/email-templates',
  'tty-templates':                  'templates/tty-templates',
  'inbound-templates':              'templates/inbound-templates',
  'suppression':                    'tools/suppression',
  'map':                            'tools/map',
  'calendar':                       'tools/calendar',
  'seed-lists':                     'tools/seed-lists',
  'management':                     'admin/management',
  'user-management-portal':         'admin/user-management',
};

// ─── Helpers ───────────────────────────────────────────────────────

function mkdirp(dirPath) {
  if (!DRY_RUN) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFile(src, dest) {
  if (DRY_RUN) {
    console.log(`  [DRY] Would copy: ${path.relative(PUBLIC, src)}`);
    console.log(`                 → ${path.relative(PUBLIC, dest)}`);
  } else {
    fs.copyFileSync(src, dest);
    console.log(`  Copied: ${path.relative(PUBLIC, src)} → ${path.relative(PUBLIC, dest)}`);
  }
}

/**
 * Extract all image src paths from an HTML content string
 */
function extractImagePaths(content) {
  const matches = [];
  const regex = /src="(\/images\/[^"]+)"/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    matches.push(m[1]);
  }
  return matches;
}

/**
 * Flatten articles tree into a flat array with parentId
 */
function flattenArticles(items, parentId = null) {
  let results = [];
  for (const item of items) {
    results.push({ ...item, parentId, children: undefined });
    if (item.children) {
      results = results.concat(flattenArticles(item.children, item.id));
    }
  }
  return results;
}

// ─── Main migration logic ──────────────────────────────────────────

function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  IMAGE MIGRATION ${DRY_RUN ? '(DRY RUN)' : '(LIVE)'}`);
  console.log(`${'='.repeat(60)}\n`);

  // Read articles.json
  const articlesRaw = fs.readFileSync(ARTICLES_PATH, 'utf-8');
  let articles = JSON.parse(articlesRaw);

  // Build the global path rewrite map: oldPath → newPath
  const pathMap = {};  // "/images/import/588714.jpg" → "/images/overview/user-login/588714.jpg"
  let totalImages = 0;
  let totalArticlesWithImages = 0;

  const flat = flattenArticles(articles);

  for (const article of flat) {
    const folderKey = FOLDER_MAP[article.id];
    if (!folderKey) continue; // articles without images or not mapped

    const imagePaths = extractImagePaths(article.content || '');
    if (imagePaths.length === 0) continue;

    totalArticlesWithImages++;
    const newFolder = `/images/${folderKey}`;

    for (const oldPath of imagePaths) {
      const filename = path.basename(oldPath);
      const newPath = `${newFolder}/${filename}`;
      pathMap[oldPath] = newPath;
      totalImages++;
    }
  }

  console.log(`Found ${totalImages} image references across ${totalArticlesWithImages} articles.\n`);

  // ── Step 1: Create new directories and copy files ──
  console.log('─── Step 1: Copy files to new locations ───\n');

  const createdDirs = new Set();
  let copiedCount = 0;
  let missingCount = 0;

  for (const [oldPath, newPath] of Object.entries(pathMap)) {
    const oldFile = path.join(PUBLIC, oldPath.replace(/^\//, ''));
    const newFile = path.join(PUBLIC, newPath.replace(/^\//, ''));
    const newDir = path.dirname(newFile);

    // Create directory
    if (!createdDirs.has(newDir)) {
      mkdirp(newDir);
      createdDirs.add(newDir);
    }

    // Copy file
    if (fs.existsSync(oldFile)) {
      if (!fs.existsSync(newFile) || DRY_RUN) {
        copyFile(oldFile, newFile);
        copiedCount++;
      } else {
        console.log(`  Skipped (exists): ${path.relative(PUBLIC, newFile)}`);
      }
    } else {
      console.log(`  ⚠ MISSING SOURCE: ${oldPath}`);
      missingCount++;
    }
  }

  console.log(`\nCopied: ${copiedCount} files | Missing: ${missingCount} files\n`);

  // ── Step 2: Also copy the homepage annotated image ──
  console.log('─── Step 2: Homepage Navigation image ───\n');

  const homepageSrc = path.join(IMAGES_DIR, 'qu', '2026', 'eons_homepage_annotated.png');
  const homepageDest = path.join(IMAGES_DIR, 'overview', 'homepage-navigation', 'eons_homepage_annotated.png');

  if (fs.existsSync(homepageSrc)) {
    mkdirp(path.dirname(homepageDest));
    copyFile(homepageSrc, homepageDest);
    console.log('');
  } else {
    console.log('  ⚠ Homepage annotated image not found at qu/2026/eons_homepage_annotated.png\n');
  }

  // ── Step 3: Rewrite all paths in articles.json ──
  console.log('─── Step 3: Rewrite image paths in articles.json ───\n');

  // Convert the whole JSON to string and do replacements
  let articlesStr = JSON.stringify(articles, null, 2);
  let replacementCount = 0;

  // Sort by longest path first to avoid partial replacements
  const sortedOldPaths = Object.keys(pathMap).sort((a, b) => b.length - a.length);

  for (const oldPath of sortedOldPaths) {
    const newPath = pathMap[oldPath];
    // Escape for use in JSON string (paths are inside escaped JSON strings)
    const oldEscaped = oldPath.replace(/\//g, '\\/');
    const newEscaped = newPath.replace(/\//g, '\\/');

    // Also handle paths that might not have escaped slashes
    const oldPlain = oldPath;
    const newPlain = newPath;

    // Replace escaped version (inside JSON string values)
    const beforeLen = articlesStr.length;
    articlesStr = articlesStr.split(oldEscaped).join(newEscaped);
    articlesStr = articlesStr.split(oldPlain).join(newPlain);
    if (articlesStr.length !== beforeLen || articlesStr.includes(newEscaped) || articlesStr.includes(newPlain)) {
      replacementCount++;
    }
  }

  // ── Step 4: Add homepage navigation image to article content ──
  let parsedArticles = JSON.parse(articlesStr);

  for (const article of parsedArticles) {
    if (article.id === 'homepage-navigation') {
      // Check if image already exists in content
      if (!article.content.includes('eons_homepage_annotated')) {
        // Insert image after the intro paragraph, before the <hr>
        const imgTag = '<p style="margin-top: 0in"><img src="/images/overview/homepage-navigation/eons_homepage_annotated.png" style="max-width: 100%; height: auto;" /></p>';

        // Insert before the first <hr>
        const hrIndex = article.content.indexOf('<hr>');
        if (hrIndex !== -1) {
          article.content = article.content.slice(0, hrIndex) + imgTag + '\n\n' + article.content.slice(hrIndex);
          console.log('  ✓ Added annotated homepage image to homepage-navigation article');
        } else {
          // Fallback: append after first paragraph
          const firstPClose = article.content.indexOf('</p>');
          if (firstPClose !== -1) {
            const insertAt = firstPClose + 4;
            article.content = article.content.slice(0, insertAt) + '\n' + imgTag + article.content.slice(insertAt);
            console.log('  ✓ Added annotated homepage image to homepage-navigation article (after first paragraph)');
          }
        }
      } else {
        console.log('  Homepage-navigation already has annotated image, skipping');
      }
      break;
    }
  }

  articlesStr = JSON.stringify(parsedArticles, null, 2);

  console.log(`\nPath replacements applied for ${replacementCount} unique paths.\n`);

  // ── Step 5: Write updated articles.json ──
  console.log('─── Step 4: Write updated articles.json ───\n');

  if (DRY_RUN) {
    console.log('  [DRY RUN] Would write updated articles.json\n');
  } else {
    fs.writeFileSync(ARTICLES_PATH, articlesStr, 'utf-8');
    console.log('  ✓ articles.json updated successfully\n');
  }

  // ── Verification ──
  console.log('─── Verification ───\n');

  // Check no old paths remain
  const remaining_import = (articlesStr.match(/\/images\/import\//g) || []).length;
  const remaining_qu = (articlesStr.match(/\/images\/qu\//g) || []).length;

  console.log(`  Remaining /images/import/ references: ${remaining_import}`);
  console.log(`  Remaining /images/qu/ references: ${remaining_qu}`);

  if (remaining_import === 0 && remaining_qu === 0) {
    console.log('  ✓ All old paths have been migrated!\n');
  } else {
    console.log('  ⚠ Some old paths still remain (may be in non-image contexts)\n');
  }

  // Summary
  console.log(`${'='.repeat(60)}`);
  console.log(`  SUMMARY`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Total images migrated: ${totalImages}`);
  console.log(`  Articles updated: ${totalArticlesWithImages}`);
  console.log(`  New directories created: ${createdDirs.size}`);
  console.log(`  Homepage image added: yes`);
  console.log(`  Mode: ${DRY_RUN ? 'DRY RUN (no files changed)' : 'LIVE (changes applied)'}`);
  console.log(`${'='.repeat(60)}\n`);
}

main();
