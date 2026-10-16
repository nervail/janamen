// "Сейткали Асель Маратовна" → "Сейткали Асель"
export function getShortName(fullName: string) {
	const [last, first] = fullName.split(' ');
	return [last, first].filter(Boolean).join(' ');
}

// "Сейткали Асель Маратовна" → "СА"
export function getInitials(fullName: string) {
	const [last, first] = fullName.split(' ');
	return `${last?.[0] ?? ''}${first?.[0] ?? ''}`.toUpperCase();
}
