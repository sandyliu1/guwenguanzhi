const fs = require('fs');
const path = require('path');

const articlesPath = path.join(__dirname, '../data/articles.json');
const outDir = path.join(__dirname, '../data/articles');

const articles = JSON.parse(fs.readFileSync(articlesPath, 'utf-8'));

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

const INDEX_KEYS = ['title', 'author', 'period', 'group', 'category'];

const index = articles.map((a, i) => {
  const entry = {};
  INDEX_KEYS.forEach(k => { if (a[k] !== undefined) entry[k] = a[k]; });
  entry.id = a.title;

  const detail = { ...a };
  fs.writeFileSync(
    path.join(outDir, `${a.title}.json`),
    JSON.stringify(detail, null, 2),
    'utf-8'
  );

  return entry;
});

fs.writeFileSync(articlesPath, JSON.stringify(index, null, 2), 'utf-8');

console.log(`Done: ${articles.length} articles split into data/articles/`);
