import { useSession } from 'next-auth/react';
import Link, { LinkProps } from 'next/link';
import type { HTMLAttributes, ReactNode } from 'react';
import { useSignInDialogStore } from './SignInDialog';

type Props = {
	children: ReactNode;
	protectedRoute?: boolean;
} & Pick<LinkProps, 'href'> &
	Pick<HTMLAttributes<HTMLOrSVGElement>, 'className'>;

const CustomLink = (props: Props) => {
	const session = useSession();
	const signInDialogStore = useSignInDialogStore();

	if (props.protectedRoute && !session.data) {
		return (
			<button
				type="button"
				onClick={() => signInDialogStore.setIsOpen(true)}
				className={props.className}
			>
				{props.children}
			</button>
		);
	}

	return (
		<Link href={props.href} passHref>
			<a className={props.className}>{props.children}</a>
		</Link>
	);
};

export default CustomLink;
