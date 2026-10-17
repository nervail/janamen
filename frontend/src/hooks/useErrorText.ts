import { useTranslation } from 'react-i18next';

// Переводит код ошибки API в текст на текущем языке
export function useErrorText() {
	const { t } = useTranslation();
	return (code?: string) =>
		code
			? t(`errors.${code}`, { defaultValue: t('errors.unknown') })
			: undefined;
}
