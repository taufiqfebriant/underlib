import { ReactElement } from 'react';
import Nav from './Nav';
import SignInDialog from './SignInDialog';

type Props = {
	children: ReactElement;
};

const Layout = (props: Props) => {
	return (
		<>
			<Nav />
			<main className="mt-32 mb-10 md:mt-28">{props.children}</main>
			<SignInDialog />
		</>
	);
};

export const getLayout = (page: ReactElement) => <Layout>{page}</Layout>;

export default Layout;
