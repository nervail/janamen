import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/kk';
import 'dayjs/locale/en';

import { ru } from './locales/ru';
import { kz } from './locales/kz';
import { en } from './locales/en';

export const LANGUAGES = [
	{ code: 'ru', label: 'Русский', short: 'RU' },
	{ code: 'kz', label: 'Қазақша', short: 'KZ' },
	{ code: 'en', label: 'English', short: 'EN' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

// В API казахский — 'kz', а стандартный код — 'kk'
const toStandardCode = (lng: string) => (lng === 'kz' ? 'kk' : lng);

i18n.on('languageChanged', lng => {
	document.documentElement.lang = toStandardCode(lng);
	dayjs.locale(toStandardCode(lng));
});

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources: {
			ru: { translation: ru },
			kz: { translation: kz },
			en: { translation: en },
		},
		supportedLngs: ['ru', 'kz', 'en'],
		fallbackLng: 'ru',
		interpolation: { escapeValue: false },
		detection: {
			order: ['localStorage', 'navigator'],
			lookupLocalStorage: 'janamen.locale',
			caches: ['localStorage'],
			convertDetectedLanguage: lng => {
				const base = lng.split('-')[0];
				return base === 'kk' ? 'kz' : base;
			},
		},
	});

export default i18n;
