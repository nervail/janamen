import { createTheme, type MantineColorsTuple } from '@mantine/core';

// Временная зелёная палитра. Заменить на фирменную Jana Post.
const brand: MantineColorsTuple = [
	'#e6f7ee',
	'#cdeedd',
	'#9cdcba',
	'#68c995',
	'#3db975',
	'#22af61',
	'#0f9f54',
	'#008a46',
	'#007b3d',
	'#006a31',
];

export const theme = createTheme({
	primaryColor: 'brand',
	primaryShade: 7,
	colors: { brand },
	defaultRadius: 'md',
	fontFamily:
		'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
});
