export const THAI_LOCALE = 'th-TH';
export const THAI_TIMEZONE = 'Asia/Bangkok';

const THAI_DATE_OPTIONS = {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: THAI_TIMEZONE
};

const parseThaiDateValue = (value) => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value || '').trim();
  if (!raw) return null;

  const isoMatch = raw.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const slashMatch = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slashMatch) {
    const [, day, month, yearRaw] = slashMatch;
    const year = Number(yearRaw.length === 2 ? `20${yearRaw}` : yearRaw);
    return new Date(year, Number(month) - 1, Number(day));
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const toNumber = (value) => Number(value || 0);

export const formatNumber = (value, locale = THAI_LOCALE) => toNumber(value).toLocaleString(locale);

export const formatMoney = (value, locale = THAI_LOCALE) => formatNumber(value, locale);

export const formatThaiDate = (value, { fallback = '-' } = {}) => {
  const date = parseThaiDateValue(value);
  if (!date) return fallback;
  return date.toLocaleDateString(THAI_LOCALE, THAI_DATE_OPTIONS);
};

export const formatRoundLabel = (value, { fallback = '-' } = {}) => {
  const raw = String(value || '').trim();
  if (!raw) return fallback;

  const cleaned = raw.replace(/^งวด\s*:?\s*/i, '').trim();
  const formattedDate = formatThaiDate(cleaned, { fallback: '' });

  return formattedDate || cleaned || fallback;
};

export const formatDateTime = (
  value,
  {
    fallback = '-',
    locale = THAI_LOCALE,
    timeZone = THAI_TIMEZONE,
    options = { dateStyle: 'medium', timeStyle: 'short' }
  } = {}
) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleString(locale, { ...options, timeZone });
};

export const getInitial = (value, fallback = '?') => {
  const text = String(value || '').trim();
  return (text.charAt(0) || fallback).toUpperCase();
};
