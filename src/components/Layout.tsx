import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import type { Route } from 'nextjs-routes';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import Nav from './Nav';
import SignInDialog, { useSignInDialogStore } from './SignInDialog';

type Props = {
	children: ReactNode;
};

const Layout = (props: Props) => {
	const router = useRouter();
	const session = useSession();
	const signInDialogStore = useSignInDialogStore();

	useEffect(() => {
		const protectedRoutes: Array<Route['pathname']> = [
			'/submit',
			'/playlists/[id]/edit',
			'/me/playlists'
		];

		if (
			session.status === 'unauthenticated' &&
			protectedRoutes.includes(router.pathname)
		) {
			signInDialogStore.setIsOpen(true);
		}
	}, [router.pathname, session.status, signInDialogStore]);

	return (
		<>
			<Nav />
			<main className="mx-auto mt-32 mb-10 max-w-6xl md:mt-28">
				{session.status === 'unauthenticated' ? null : props.children}
			</main>
			<SignInDialog />
		</>
	);
};

export const getLayout = (page: ReactNode) => <Layout>{page}</Layout>;

export default Layout;
