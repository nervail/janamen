import dayjs from 'dayjs';

// Язык месяцев берётся из текущей локали dayjs, её переключает i18n
export const formatDate = (value: string) => dayjs(value).format('D MMMM YYYY');
export const formatDateTime = (value: string) =>
	dayjs(value).format('D MMMM YYYY, HH:mm');
// Календарные дни включительно: со 2 по 15 ноября — 14 дней
export const countDays = (start: string, end: string) =>
	dayjs(end).diff(dayjs(start), 'day') + 1;
