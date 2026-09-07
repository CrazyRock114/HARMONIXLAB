import fs from 'fs';
import path from 'path';

// Existing en.js as base
import enOriginal from './js/i18n/locales/en.js';
import deOriginal from './js/i18n/locales/de.js';
import frOriginal from './js/i18n/locales/fr.js';
import itOriginal from './js/i18n/locales/it.js';
import jaOriginal from './js/i18n/locales/ja.js';
import koOriginal from './js/i18n/locales/ko.js';
import zhCNOriginal from './js/i18n/locales/zh-CN.js';
import zhTWOriginal from './js/i18n/locales/zh-TW.js';

console.log("Original en keys count:", Object.keys(enOriginal).reduce((acc, k) => acc + Object.keys(enOriginal[k]).length, 0));
