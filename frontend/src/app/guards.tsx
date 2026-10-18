import { Navigate, Outlet, useLocation } from 'react-router';
import { getPreviousUserId } from '../api/auth';
import { FullPageLoader } from '../components/FullPageLoader';
import { useMe } from '../hooks/useAuth';
import { ForbiddenPage } from '../pages/ForbiddenPage';
import type { Me } from '../types/api';
import { redirectAfterLogin } from './redirect';

// Пускает только вошедших, остальных отправляет на /login
export function RequireAuth() {
	const { data: me, isPending } = useMe();
	const location = useLocation();

	if (isPending) return <FullPageLoader />;
	if (!me) {
		return (
			<Navigate
				to='/login'
				replace
				// Запоминаем страницу и того, кто на ней был: вернём туда только его же
				state={{
					from: location.pathname + location.search,
					userId: getPreviousUserId(),
				}}
			/>
		);
	}
	return <Outlet />;
}

// Страница входа — только для невошедших
export function GuestOnly() {
	const { data: me, isPending } = useMe();
	const location = useLocation();

	if (isPending) return <FullPageLoader />;
	if (me)
		return <Navigate to={redirectAfterLogin(location.state, me)} replace />;
	return <Outlet />;
}

// Раздел только для тех, у кого есть право (team — руководитель, hr — HR)
export function RequireAbility({
	ability,
}: {
	ability: keyof Me['abilities'];
}) {
	const { data: me } = useMe();

	if (!me?.abilities[ability]) return <ForbiddenPage />;
	return <Outlet />;
}
