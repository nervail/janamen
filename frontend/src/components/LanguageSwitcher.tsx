import { Button, Menu } from '@mantine/core';
import { IconCheck, IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMe, useUpdateLocale } from '../hooks/useAuth';
import { LANGUAGES, markExplicitLocaleChoice, type Language } from '../i18n';

export function LanguageSwitcher() {
	const { t, i18n } = useTranslation();
	const { data: me } = useMe();
	const updateLocale = useUpdateLocale();

	const current =
		LANGUAGES.find(l => l.code === i18n.resolvedLanguage) ?? LANGUAGES[0];

	const handleChange = (code: Language) => {
		void i18n.changeLanguage(code);
		if (me) {
			updateLocale.mutate(code);
		} else {
			markExplicitLocaleChoice();
		}
	};

	return (
		<Menu position='bottom-end' width={160}>
			<Menu.Target>
				<Button
					variant='subtle'
					color='gray'
					size='compact-sm'
					leftSection={<IconLanguage size={16} />}
					aria-label={t('header.language')}
				>
					{current.short}
				</Button>
			</Menu.Target>
			<Menu.Dropdown>
				{LANGUAGES.map(lang => (
					<Menu.Item
						key={lang.code}
						onClick={() => handleChange(lang.code)}
						rightSection={
							lang.code === current.code ? <IconCheck size={14} /> : null
						}
					>
						{lang.label}
					</Menu.Item>
				))}
			</Menu.Dropdown>
		</Menu>
	);
}
