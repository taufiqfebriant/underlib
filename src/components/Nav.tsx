import { Dialog, Popover } from '@headlessui/react';
import clsx from 'clsx';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/future/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FaSpotify } from 'react-icons/fa';
import {
	MdArrowDropDown,
	MdArrowDropUp,
	MdClose,
	MdLogout,
	MdMenu,
	MdPerson,
	MdQueueMusic
} from 'react-icons/md';

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

type NavLinkProps = {
	href: string;
	children: string;
	className?: string;
};

const NavLink = ({ href, children, className }: NavLinkProps) => {
	const router = useRouter();
	const isActive = router.asPath === href;

	return (
		<Link href={href} passHref>
			<a
				className={clsx(
					`transition-colors hover:text-white ${className}`,
					{ 'text-[#989898]': !isActive },
					{ 'text-white': isActive }
				)}
			>
				{children}
			</a>
		</Link>
	);
};

const Nav = () => {
	const session = useSession();
	const scrollPosition = useScrollPosition();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<nav
				className={clsx(
					'py-4 justify-between fixed w-full bg-[#151515] transition-shadow top-0 left-0 z-20',
					{ 'shadow-sm shadow-[#3c3c3c]': scrollPosition || isOpen },
					{ 'shadow-none': !scrollPosition && !isOpen }
				)}
			>
				<div className="flex items-center justify-between relative max-w-6xl mx-auto px-6 md:px-0">
					<div className="bg-white text-[#151515] font-bold px-4 py-2">
						diskaver
					</div>
					<div className="hidden md:flex items-center">
						<NavLink href="/" className="font-medium mx-4 text-sm">
							Home
						</NavLink>
						<NavLink href="/submit" className="font-medium mx-4 text-sm">
							Submit your playlist
						</NavLink>
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
							<button
								onClick={async () => await signIn('spotify')}
								className="bg-[#1ed760]"
							>
								<FaSpotify className="text-lg" />
								<span>Sign in with Spotify</span>
							</button>
						)}
					</div>
					<button
						type="button"
						onClick={() => setIsOpen(prev => !prev)}
						className="md:hidden"
					>
						{isOpen ? (
							<MdClose className="text-3xl" />
						) : (
							<MdMenu className="text-3xl" />
						)}
					</button>
				</div>
			</nav>
			<Dialog open={isOpen} onClose={() => setIsOpen(false)}>
				<Dialog.Panel className="fixed top-0 left-0 bg-[#151515] w-full h-full px-6 z-10 pt-28">
					{!session.data ? (
						<button
							onClick={async () => await signIn('spotify')}
							className="bg-[#1ed760] flex items-center gap-x-2 w-full justify-center py-2 rounded-md hover:opacity-90 transition-opacity"
						>
							<FaSpotify className="text-lg" />
							<span className="font-bold">Sign in with Spotify</span>
						</button>
					) : null}
					<div
						className={clsx('flex flex-col divide-y divide-[#292929]', {
							'mt-8': !session.data
						})}
					>
						<NavLink href="/" className="text-xl py-3">
							Home
						</NavLink>
						<NavLink href="/submit" className="text-xl py-3">
							Submit your playlist
						</NavLink>
					</div>
					{session.data ? (
						<>
							<div className="mt-10 flex items-center gap-x-2">
								{session.data.user.image ? (
									<Image
										src={session.data.user.image}
										alt={session.data.user.name ?? session.data.user.id}
										width={32}
										height={32}
										className="rounded-full"
									/>
								) : (
									<div className="bg-[#292929]">
										<MdPerson />
									</div>
								)}
								<p>{session.data.user.name}</p>
							</div>
							<div className="flex flex-col divide-y divide-[#292929] mt-2">
								<NavLink href="/me/playlists" className="text-xl py-3">
									My playlists
								</NavLink>
								<button
									type="button"
									onClick={async () => await signOut()}
									className="text-left text-xl py-3 text-[#989898] hover:text-white"
								>
									Sign out
								</button>
							</div>
						</>
					) : null}
				</Dialog.Panel>
			</Dialog>
		</>
	);
};

export default Nav;
