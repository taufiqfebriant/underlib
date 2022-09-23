import { Popover } from '@headlessui/react';
import clsx from 'clsx';
import { signIn, signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { DOMAttributes, ReactElement, useEffect, useState } from 'react';
import { FaSpotify } from 'react-icons/fa';
import { IconType } from 'react-icons/lib';
import {
	MdArrowDropDown,
	MdArrowDropUp,
	MdLogout,
	MdMenu,
	MdQueueMusic
} from 'react-icons/md';

type NavItemProps = {
	href: string;
	children: string;
};

const useScrollPosition = () => {
	const [scrollPosition, setScrollPosition] = useState(0);

	useEffect(() => {
		const updatePosition = () => {
			setScrollPosition(window.scrollY);
		};

		window.addEventListener('scroll', updatePosition);

		updatePosition();

		return () => window.removeEventListener('scroll', updatePosition);
	}, []);

	return scrollPosition;
};

const NavLink = ({ href, children }: NavItemProps) => {
	const router = useRouter();
	const isActive = router.asPath === href;

	return (
		<Link href={href} passHref>
			<a
				className={clsx(
					'font-medium mx-4 rounded-md transition-all text-sm hover:text-white',
					{ 'text-[#989898]': !isActive },
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
	const scrollPosition = useScrollPosition();

	return (
		<nav
			className={clsx(
				'py-4 justify-between fixed w-full bg-[#151515] transition-shadow z-10 top-0 left-0',
				{ 'shadow-sm shadow-[#3c3c3c]': scrollPosition },
				{ 'shadow-none': !scrollPosition }
			)}
		>
			<div className="flex items-center justify-between relative max-w-6xl mx-auto px-6 md:px-0">
				<div className="bg-white text-[#151515] font-bold px-4 py-2">
					diskaver
				</div>
				<div className="hidden md:flex items-center">
					<NavLink href="/">Home</NavLink>
					<NavLink href="/submit">Submit your playlist</NavLink>
					{session.data ? (
						<Popover>
							{({ open }) => (
								<>
									<Popover.Button
										className={clsx(
											'font-medium ml-2 px-4 py-2 rounded-md transition-all flex items-center gap-x-2 text-sm hover:bg-[#3c3c3c]',
											{ 'bg-[#292929]': !open },
											{ 'bg-[#3c3c3c]': open }
										)}
									>
										<span>{session.data.user.name}</span>
										{open ? (
											<MdArrowDropUp className="text-xl" />
										) : (
											<MdArrowDropDown className="text-xl" />
										)}
									</Popover.Button>

									<Popover.Panel className="absolute mt-2 rounded-md overflow-hidden w-48 bg-[#292929]">
										<div className="flex flex-col divide-y divide-[#3c3c3c]">
											<Popover.Button as={Link} href="/me/playlists" passHref>
												<a className="flex items-center py-3 px-4 gap-x-2 transition-all hover:bg-[#3c3c3c]">
													<MdQueueMusic />
													<span className="text-sm font-medium">
														My Playlists
													</span>
												</a>
											</Popover.Button>
											<Popover.Button
												onClick={async () => signOut()}
												className="flex items-center py-3 px-4 gap-x-2 transition-all hover:bg-[#3c3c3c]"
											>
												<MdLogout />
												<span className="text-sm font-medium">Sign out</span>
											</Popover.Button>
										</div>
									</Popover.Panel>
								</>
							)}
						</Popover>
					) : (
						<SignButton
							onClick={async () => await signIn('spotify')}
							icon={<FaSpotify className="text-lg" />}
						>
							Sign in with Spotify
						</SignButton>
					)}
				</div>
				<button type="button" className="block md:hidden text-3xl">
					<MdMenu />
				</button>
			</div>
		</nav>
	);
};

export default Nav;
