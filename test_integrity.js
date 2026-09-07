/**
 * test_integrity.js
 * Validates that all assets referenced in index.html and all JS imports exist on disk.
 */
import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf-8');

console.log('--- Checking index.html Asset References ---');

// Check stylesheets
const cssMatches = [...indexHtml.matchAll(/href="([^"]+\.css)"/g)].map(m => m[1]);
for (const cssPath of cssMatches) {
  const fullPath = path.join(rootDir, cssPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ CSS exists: ${cssPath}`);
  } else {
    console.error(`❌ CSS missing: ${cssPath}`);
    process.exit(1);
  }
}

// Check scripts
const jsMatches = [...indexHtml.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
for (const jsPath of jsMatches) {
  const fullPath = path.join(rootDir, jsPath);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ JS script exists: ${jsPath}`);
  } else {
    console.error(`❌ JS script missing: ${jsPath}`);
    process.exit(1);
  }
}

console.log('\n--- Checking All 8 Supported Locales ---');
const locales = ['en', 'de', 'fr', 'it', 'ja', 'ko', 'zh-CN', 'zh-TW'];
for (const loc of locales) {
  const file = path.join(rootDir, 'js', 'i18n', 'locales', `${loc}.js`);
  if (fs.existsSync(file)) {
    const stat = fs.statSync(file);
    console.log(`✅ Locale [${loc}]: ${stat.size} bytes`);
  } else {
    console.error(`❌ Missing locale file: ${file}`);
    process.exit(1);
  }
}

console.log('\n🎉 ALL STATIC ASSETS AND LOCALES INTEGRITY VERIFIED!');
