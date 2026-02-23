const fs = require('fs');
const path = require('path');

const articles = require('../src/data/articles.json');
console.log('✓ articles.json is valid JSON');
console.log('  Top-level articles:', articles.length);

function flatten(items) {
  let r = [];
  for (const i of items) {
    r.push(i);
    if (i.children) r = r.concat(flatten(i.children));
  }
  return r;
}

const all = flatten(articles);
console.log('  Total articles (incl children):', all.length);

let totalImages = 0;
let missing = 0;
let oldPaths = 0;

for (const a of all) {
  const imgs = (a.content || '').match(/src="([^"]*\/images\/[^"]*)"/g) || [];
  for (const m of imgs) {
    totalImages++;
    const src = m.match(/src="([^"]*)"/)[1];
    const filePath = path.join(__dirname, '..', 'public', src.replace(/^\//, ''));

    if (!fs.existsSync(filePath)) {
      console.log('  ✗ MISSING:', src, '(in article:', a.id + ')');
      missing++;
    }

    if (src.includes('/images/import/') || src.includes('/images/qu/')) {
      console.log('  ⚠ OLD PATH:', src, '(in article:', a.id + ')');
      oldPaths++;
    }
  }
}

const homepage = all.find(a => a.id === 'homepage-navigation');
const hasImg = homepage && homepage.content.includes('img');

console.log('');
console.log('  Total image references:', totalImages);
console.log('  Missing files:', missing);
console.log('  Old paths remaining:', oldPaths);
console.log('  Homepage-navigation has image:', hasImg ? 'YES ✓' : 'NO ✗');
console.log('');
if (missing === 0 && oldPaths === 0 && hasImg) {
  console.log('✓ ALL CHECKS PASSED!');
} else {
  console.log('✗ SOME CHECKS FAILED');
}
