const fs = require('fs');
const path = require('path');

let errors = 0;

function validate(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  try {
    JSON.parse(content);
    console.log(`  OK  ${path.relative(process.cwd(), filePath)}`);
  } catch (e) {
    console.error(`  FAIL ${path.relative(process.cwd(), filePath)}`);
    console.error(`       ${e.message}`);
    errors++;
  }
}

console.log('Validating JSON files...\n');

// articles index
validate(path.join(__dirname, '../data/articles.json'));

// per-article files
const articlesDir = path.join(__dirname, '../data/articles');
fs.readdirSync(articlesDir)
  .filter(f => f.endsWith('.json'))
  .sort()
  .forEach(f => validate(path.join(articlesDir, f)));

// word banks
validate(path.join(__dirname, '../data/shici.json'));
validate(path.join(__dirname, '../data/xuci.json'));

console.log(errors === 0
  ? `\nAll files valid.`
  : `\n${errors} file(s) failed.`
);
process.exit(errors > 0 ? 1 : 0);
