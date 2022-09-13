import { Popover } from '@headlessui/react';
import clsx from 'clsx';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { DOMAttributes, ReactElement } from 'react';
import { FaSpotify } from 'react-icons/fa';
import { IconType } from 'react-icons/lib';

type NavItemProps = {
	href: string;
	children: string;
};

const NavLink = ({ href, children }: NavItemProps) => {
	const router = useRouter();
	const isActive = router.asPath === href;

	return (
		<Link href={href} passHref>
			<a
				className={clsx(
					'font-medium hover:bg-gray-900 px-4 py-2 rounded-md transition-all',
					{ 'text-gray-500': !isActive },
					{ 'text-white': isActive }
				)}
			>
				{children}
			</a>
		</Link>
	);
};

interface SignButtonProps {
	onClick: DOMAttributes<HTMLButtonElement>['onClick'];
	icon: ReactElement<IconType>;
	children: string;
}

const SignButton = ({ onClick, icon, children }: SignButtonProps) => {
	return (
		<button
			onClick={onClick}
			className="bg-green-500 px-4 py-2 text-sm rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-4 focus:ring-offset-black focus:bg-green-600 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-4 focus-visible:ring-offset-black focus-visible:bg-green-600 hover:bg-green-600 flex items-center gap-x-2 ml-4 transition-all"
		>
			{icon}
			<span>{children}</span>
		</button>
	);
};

const Nav = () => {
	const session = useSession();

	return (
		<nav className="flex py-4 items-center justify-between">
			<div className="bg-white text-black font-bold px-4 py-2 text-xl">
				diskaver
			</div>
			<div className="flex items-center">
				<NavLink href="/">Home</NavLink>
				<NavLink href="/submit">Submit your playlist</NavLink>
				{session.data ? (
					<Popover className="relative">
						<Popover.Button>{session.data.user.name}</Popover.Button>

						<Popover.Panel className="absolute z-10">
							<div className="flex flex-col">
								<Popover.Button
									className="bg-gray-900 px-2 py-2"
									as={Link}
									href="/me/playlists"
								>
									My Playlists
								</Popover.Button>
								<Popover.Button
									className="bg-gray-900 px-2 py-2"
									onClick={async () => signOut()}
								>
									Sign out
								</Popover.Button>
							</div>
						</Popover.Panel>
					</Popover>
				) : (
					// <SignButton
					// 	onClick={async () => await signOut()}
					// 	icon={<FaSignOutAlt className="text-lg" />}
					// >
					// 	Sign out
					// </SignButton>
					<SignButton
						onClick={async () => await signIn('spotify')}
						icon={<FaSpotify className="text-lg" />}
					>
						Sign in with Spotify
					</SignButton>
				)}
			</div>
		</nav>
	);
};

export default Nav;
