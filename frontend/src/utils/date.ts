import dayjs from 'dayjs';

// Язык месяцев берётся из текущей локали dayjs, её переключает i18n
export const formatDate = (value: string) => dayjs(value).format('D MMMM YYYY');
export const formatDateTime = (value: string) =>
	dayjs(value).format('D MMMM YYYY, HH:mm');
// Календарные дни включительно: со 2 по 15 ноября — 14 дней
export const countDays = (start: string, end: string) =>
	dayjs(end).diff(dayjs(start), 'day') + 1;
export const formatShortDate = (value: string) =>
	dayjs(value).format('D MMM YYYY');

// "2 нояб. 2026 — 15 нояб. 2026" или одна дата, если отпуск на один день
export const formatPeriod = (start: string, end: string) =>
	start === end
		? formatShortDate(start)
		: `${formatShortDate(start)} — ${formatShortDate(end)}`;
// "5 минут назад", "2 часа назад"
export const fromNow = (value: string) => dayjs(value).fromNow();
