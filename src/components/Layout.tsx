import { ReactElement } from 'react';
import Nav from './Nav';

type Props = {
	children: ReactElement;
};

export const Layout = (props: Props) => {
	return (
		<>
			<Nav />
			<main className="mt-32 mb-10 md:mt-28">{props.children}</main>
		</>
	);
};
