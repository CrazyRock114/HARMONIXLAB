/**
 * test_i18n.js - Verification of all 8 locales key parity
 */
import en from './js/i18n/locales/en.js';
import de from './js/i18n/locales/de.js';
import fr from './js/i18n/locales/fr.js';
import it from './js/i18n/locales/it.js';
import ja from './js/i18n/locales/ja.js';
import ko from './js/i18n/locales/ko.js';
import zhCN from './js/i18n/locales/zh-CN.js';
import zhTW from './js/i18n/locales/zh-TW.js';
import { i18n } from './js/i18n/i18n.js';

const locales = {
  'en': en,
  'de': de,
  'fr': fr,
  'it': it,
  'ja': ja,
  'ko': ko,
  'zh-CN': zhCN,
  'zh-TW': zhTW
};

function getAllKeys(obj, prefix = '') {
  let keys = [];
  for (const k in obj) {
    const fullPath = prefix ? `${prefix}.${k}` : k;
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      keys = keys.concat(getAllKeys(obj[k], fullPath));
    } else {
      keys.push(fullPath);
    }
  }
  return keys;
}

const enKeys = getAllKeys(en);
console.log(`Total keys in English dictionary: ${enKeys.length}`);

let totalErrors = 0;

for (const [lang, dict] of Object.entries(locales)) {
  if (lang === 'en') continue;
  const targetKeys = new Set(getAllKeys(dict));
  const missingKeys = enKeys.filter(k => !targetKeys.has(k));
  
  if (missingKeys.length > 0) {
    console.error(`❌ [${lang}] Missing ${missingKeys.length} keys:`, missingKeys);
    totalErrors += missingKeys.length;
  } else {
    console.log(`✅ [${lang}] 100% Key Parity! (${targetKeys.size}/${enKeys.length} keys)`);
  }
}

// Test i18n manager functions
console.log('\nTesting I18nManager:');
console.log('Supported languages:', i18n.getSupportedLanguages().map(l => `${l.flag} ${l.code}`).join(', '));

for (const lang of Object.keys(locales)) {
  i18n.setLanguage(lang);
  const title = i18n.t('app.title');
  const standing = i18n.t('physics.standingTitle');
  const chameleon = i18n.t('games.chameleonTitle');
  console.log(`[${lang}] -> Title: "${title}", Standing: "${standing}", Game: "${chameleon}"`);
  if (!standing || !chameleon) {
    totalErrors++;
  }
}

if (totalErrors === 0) {
  console.log('\n🎉 ALL 8 LOCALES PASSED VALIDATION WITH ZERO ERRORS!');
  process.exit(0);
} else {
  console.error(`\n❌ Failed with ${totalErrors} errors.`);
  process.exit(1);
}
