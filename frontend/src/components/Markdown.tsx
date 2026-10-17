import { Typography } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Материалы курсов и база знаний. Typography даёт заголовкам, спискам и таблицам стили Mantine
export function Markdown({ children }: { children: string }) {
	return (
		<Typography>
			<ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
		</Typography>
	);
}
