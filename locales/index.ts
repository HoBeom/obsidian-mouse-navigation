import { en } from './en';
import { ko } from './ko';

export type Locale = 'en' | 'ko';

export const locales = { en, ko } as const;

export const getStrings = (locale: Locale) => locales[locale] ?? locales.en;
