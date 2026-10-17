import { Typography } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

type Props = { children: string; breaks?: boolean };

// Материалы курсов и база знаний. Typography даёт заголовкам, спискам и таблицам стили Mantine.
// breaks — одиночный перенос строки становится <br> (так написаны разделы базы знаний)
export function Markdown({ children, breaks = false }: Props) {
	return (
		<Typography>
			<ReactMarkdown
				remarkPlugins={breaks ? [remarkGfm, remarkBreaks] : [remarkGfm]}
			>
				{children}
			</ReactMarkdown>
		</Typography>
	);
}
