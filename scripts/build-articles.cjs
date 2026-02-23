/**
 * Build script: parses the HTML knowledgebase files and produces a JSON data file
 * that the React app consumes. Run with: node scripts/build-articles.cjs
 */
const fs = require('fs');
const path = require('path');

const BACKUP_DIR = path.resolve(__dirname, '../../help_site_backup');

// Define the article structure: which files to include, hierarchy, and ordering
const articleDefs = [
  {
    id: 'whats-new',
    title: "What's New",
    file: 'Whats_New.html',
    icon: 'sparkles',
    category: 'release-notes',
  },
  {
    id: 'getting-started',
    title: 'Getting Started with EONS',
    file: 'Getting_Started_with_EONS.html',
    icon: 'rocket',
    category: 'overview',
  },
  {
    id: 'user-login',
    title: 'User Login',
    file: 'User_Login.html',
    icon: 'login',
    category: 'overview',
  },
  {
    id: 'homepage-navigation',
    title: 'Homepage Navigation',
    file: 'Homepage_Navigation.html',
    icon: 'home',
    category: 'overview',
  },
  {
    id: 'campaigns',
    title: 'Campaigns',
    file: 'Campaigns.html',
    icon: 'campaign',
    category: 'campaigns',
    children: [
      {
        id: 'campaign-dashboard',
        title: 'Campaign Dashboard',
        file: 'Campaign_Dashboard.html',
      },
      {
        id: 'creating-new-campaign',
        title: 'Creating a New Campaign',
        file: 'Creating_a_New_Campaign.html',
      },
      {
        id: 'working-with-existing-campaigns',
        title: 'Working with Existing Campaigns',
        file: 'Working_with_Existing_Campaigns.html',
      },
    ],
  },
  {
    id: 'lists',
    title: 'Lists',
    file: 'Lists.html',
    icon: 'list',
    category: 'lists',
    children: [
      {
        id: 'creating-working-with-lists',
        title: 'Creating and Working with Lists',
        file: 'Creating_and_Working_with_Lists.html',
      },
      {
        id: 'data-validation-deduplication',
        title: 'Data Validation and Deduplication',
        file: 'Data_Validation_and_Deduplication.html',
      },
    ],
  },
  {
    id: 'master-list',
    title: 'Master List',
    file: 'MasterList.html',
    icon: 'database',
    category: 'lists',
  },
  {
    id: 'templates',
    title: 'Templates',
    file: 'Templates.html',
    icon: 'template',
    category: 'templates',
    children: [
      {
        id: 'create-templates',
        title: 'Create Templates',
        file: 'CreateTemplates.html',
      },
      {
        id: 'search-templates',
        title: 'Search Templates',
        file: 'SearchTemplates.html',
      },
      {
        id: 'organize-template-folders',
        title: 'Organize Templates with Folders',
        file: 'OrganizeTemplateswithTemplateFolders__Copy.html',
      },
      {
        id: 'voice-templates',
        title: 'Voice Templates',
        file: 'VoiceTemplates__Copy.html',
      },
      {
        id: 'sms-templates',
        title: 'SMS Templates',
        file: 'EmailTemplates__Copy.html', // misleading filename, check content
      },
      {
        id: 'email-templates',
        title: 'Email Templates',
        file: 'EmailTemplates__Copy.html',
      },
      {
        id: 'tty-templates',
        title: 'TTY Templates',
        file: 'TTYTemplates__Copy.html',
      },
      {
        id: 'inbound-templates',
        title: 'Inbound Templates',
        file: 'InboundTemplates__Copy.html',
      },
    ],
  },
  {
    id: 'suppression',
    title: 'Suppression',
    file: 'Suppression.html',
    icon: 'block',
    category: 'tools',
  },
  {
    id: 'map',
    title: 'Map',
    file: 'Map.html',
    icon: 'map',
    category: 'tools',
  },
  {
    id: 'calendar',
    title: 'Calendar',
    file: 'Calendar.html',
    icon: 'calendar',
    category: 'tools',
  },
  {
    id: 'seed-lists',
    title: 'Seed Lists',
    file: 'SeedLists.html',
    icon: 'seed',
    category: 'tools',
  },
  {
    id: 'management',
    title: 'Management',
    file: 'Management.html',
    icon: 'settings',
    category: 'admin',
  },
  {
    id: 'user-management-portal',
    title: 'User Management Portal',
    file: 'UserManagementPortal.html',
    icon: 'users',
    category: 'admin',
  },
];

function extractBodyContent(html) {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return '';
  let content = bodyMatch[1].trim();

  // Fix image paths: images/import/... → /images/import/...
  // and images/qu/... → /images/qu/...
  content = content.replace(/src="images\//g, 'src="/images/');

  // Remove external links that point to knowledgebase.messagebroadcast.com (dead)
  content = content.replace(
    /<a\s+href="https?:\/\/knowledgebase\.messagebroadcast\.com[^"]*"[^>]*>([\s\S]*?)<\/a>/gi,
    '$1'
  );

  return content;
}

function extractPlainText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function processArticle(def) {
  const filePath = path.join(BACKUP_DIR, def.file);
  let htmlContent = '';
  let bodyContent = '';
  let plainText = '';

  if (fs.existsSync(filePath)) {
    htmlContent = fs.readFileSync(filePath, 'utf-8');
    bodyContent = extractBodyContent(htmlContent);
    plainText = extractPlainText(bodyContent);
  }

  const article = {
    id: def.id,
    title: def.title,
    content: bodyContent,
    searchText: plainText,
    icon: def.icon || null,
    category: def.category || null,
    children: [],
  };

  if (def.children) {
    for (const child of def.children) {
      const childFilePath = path.join(BACKUP_DIR, child.file);
      let childHtml = '';
      let childBody = '';
      let childPlain = '';

      if (fs.existsSync(childFilePath)) {
        childHtml = fs.readFileSync(childFilePath, 'utf-8');
        childBody = extractBodyContent(childHtml);
        childPlain = extractPlainText(childBody);
      }

      article.children.push({
        id: child.id,
        title: child.title,
        content: childBody,
        searchText: childPlain,
        parentId: def.id,
      });
    }
  }

  return article;
}

// Since the Templates.html already contains ALL template content (Voice, SMS, Email, TTY, Inbound),
// we should NOT duplicate it with the __Copy files. The __Copy files appear to have the same content
// but with different image paths (861xxx vs 5887xxx). The main Templates.html has the canonical content.
// Let's simplify the templates children to just the overview ones.

const simplifiedArticleDefs = articleDefs.map((def) => {
  if (def.id === 'templates') {
    return {
      ...def,
      children: [
        {
          id: 'create-templates',
          title: 'Create Templates',
          file: 'CreateTemplates.html',
        },
        {
          id: 'search-templates',
          title: 'Search Templates',
          file: 'SearchTemplates.html',
        },
      ],
    };
  }
  return def;
});

const articles = simplifiedArticleDefs.map(processArticle);

// Write to src/data/articles.json
const outDir = path.resolve(__dirname, '../src/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}
fs.writeFileSync(path.join(outDir, 'articles.json'), JSON.stringify(articles, null, 2));
console.log(`Built ${articles.length} articles with ${articles.reduce((n, a) => n + a.children.length, 0)} children`);
