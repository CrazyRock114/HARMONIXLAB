/**
 * i18n.js - Harmonix Lab Multilingual Core Manager
 * Supports: en, de, fr, it, ja, ko, zh-CN, zh-TW
 */
import en from './locales/en.js';
import de from './locales/de.js';
import fr from './locales/fr.js';
import it from './locales/it.js';
import ja from './locales/ja.js';
import ko from './locales/ko.js';
import zhCN from './locales/zh-CN.js';
import zhTW from './locales/zh-TW.js';

class I18nManager {
  constructor() {
    this.locales = {
      'en': { name: 'English', flag: '🇺🇸', dict: en },
      'de': { name: 'Deutsch', flag: '🇩🇪', dict: de },
      'fr': { name: 'Français', flag: '🇫🇷', dict: fr },
      'it': { name: 'Italiano', flag: '🇮🇹', dict: it },
      'ja': { name: '日本語', flag: '🇯🇵', dict: ja },
      'ko': { name: '한국어', flag: '🇰🇷', dict: ko },
      'zh-CN': { name: '简体中文', flag: '🇨🇳', dict: zhCN },
      'zh-TW': { name: '繁體中文', flag: '🇹🇼', dict: zhTW }
    };

    this.listeners = [];
    this.currentLang = this.detectInitialLanguage();
  }

  detectInitialLanguage() {
    // 1. Check saved user preference
    try {
      const saved = localStorage.getItem('harmonix_lang');
      if (saved && this.locales[saved]) {
        return saved;
      }
    } catch (e) {
      // localStorage may be disabled in some sandboxes
    }

    // 2. Check browser navigator language
    if (typeof navigator !== 'undefined' && navigator.language) {
      const navLang = navigator.language.toLowerCase();
      if (navLang.includes('zh-tw') || navLang.includes('zh-hk') || navLang.includes('zh-mo')) {
        return 'zh-TW';
      }
      if (navLang.startsWith('zh')) {
        return 'zh-CN';
      }
      if (navLang.startsWith('de')) return 'de';
      if (navLang.startsWith('fr')) return 'fr';
      if (navLang.startsWith('it')) return 'it';
      if (navLang.startsWith('ja')) return 'ja';
      if (navLang.startsWith('ko')) return 'ko';
    }

    return 'en';
  }

  getSupportedLanguages() {
    return Object.entries(this.locales).map(([code, data]) => ({
      code,
      name: data.name,
      flag: data.flag
    }));
  }

  getLanguage() {
    return this.currentLang;
  }

  setLanguage(lang) {
    if (!this.locales[lang]) {
      console.warn(`[i18n] Language "${lang}" is not supported. Falling back to "en".`);
      lang = 'en';
    }

    this.currentLang = lang;

    try {
      localStorage.setItem('harmonix_lang', lang);
    } catch (e) {}

    // Update document language tag
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }

    // Apply translations to DOM elements
    this.applyDomTranslations();

    // Notify registered component subscribers
    this.notifyListeners();
  }

  onLanguageChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notifyListeners() {
    for (const cb of this.listeners) {
      try {
        cb(this.currentLang);
      } catch (err) {
        console.error('[i18n] Error in language change listener:', err);
      }
    }
  }

  /**
   * Look up translation string by dot path (e.g. "physics.standingTitle")
   */
  t(path, fallback = '') {
    const currentDict = this.locales[this.currentLang]?.dict;
    const enDict = this.locales['en']?.dict;

    let val = this.resolvePath(currentDict, path);
    if (val === undefined) {
      // Fallback to English dictionary
      val = this.resolvePath(enDict, path);
    }

    return val !== undefined ? val : (fallback || path);
  }

  resolvePath(obj, path) {
    if (!obj || !path) return undefined;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    return current;
  }

  /**
   * Scan DOM for data-i18n attributes and translate them in-place
   */
  applyDomTranslations(root = (typeof document !== 'undefined' ? document : null)) {
    if (!root || typeof root.querySelectorAll !== 'function') return;

    const elements = root.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (!key) return;

      const translation = this.t(key);
      const targetAttr = el.getAttribute('data-i18n-attr');

      if (targetAttr) {
        el.setAttribute(targetAttr, translation);
      } else if (el.hasAttribute('data-i18n-html') || /<[a-z][\s\S]*>/i.test(translation)) {
        el.innerHTML = translation;
      } else {
        el.textContent = translation;
      }
    });

    // Also handle placeholder translations
    const placeholderEls = root.querySelectorAll('[data-i18n-placeholder]');
    placeholderEls.forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (key) {
        el.setAttribute('placeholder', this.t(key));
      }
    });

    // Also handle title translations
    const titleEls = root.querySelectorAll('[data-i18n-title]');
    titleEls.forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (key) {
        el.setAttribute('title', this.t(key));
      }
    });
  }
}

export const i18n = new I18nManager();
export default i18n;
