import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import type { Route } from 'nextjs-routes';
import type { ReactNode } from 'react';
import Nav from './Nav';
import SignInDialog, { useSignInDialogStore } from './SignInDialog';

type Props = {
	children: ReactNode;
};

const Layout = (props: Props) => {
	const router = useRouter();
	const session = useSession();
	const signInDialogStore = useSignInDialogStore();

	const protectedRoutes: Array<Route['pathname']> = [
		'/submit',
		'/playlists/[id]/edit',
		'/me/playlists'
	];

	let children = props.children;
	if (
		session.status === 'unauthenticated' &&
		protectedRoutes.includes(router.pathname)
	) {
		children = null;
		signInDialogStore.setIsOpen(true);
	}

	return (
		<>
			<Nav />
			<main className="mx-auto mt-32 mb-10 max-w-6xl md:mt-28">{children}</main>
			<SignInDialog />
		</>
	);
};

export const getLayout = (page: ReactNode) => <Layout>{page}</Layout>;

export default Layout;
