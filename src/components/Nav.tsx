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
import { Container } from './Container';
import CustomLink from './CustomLink';

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

const Nav = () => {
	const session = useSession();
	const scrollPosition = useScrollPosition();
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

	return (
		<>
			<nav
				className={clsx(
					'fixed top-0 left-0 z-20 w-full justify-between bg-[#151515] py-4 transition-shadow',
					{ 'shadow-sm shadow-[#3c3c3c]': scrollPosition || isOpen },
					{ 'shadow-none': !scrollPosition && !isOpen }
				)}
			>
				<Container className="relative flex items-center justify-between">
					<div className="bg-white px-4 py-2 font-bold text-[#151515]">
						diskaver
					</div>
					<div className="hidden items-center md:flex">
						<Link href="/" passHref scroll={false}>
							<a
								className={clsx(
									`mx-4 text-sm font-medium transition-colors hover:text-white`,
									{ 'text-[#989898]': router.asPath !== '/' },
									{ 'text-white': router.asPath === '/' }
								)}
							>
								Home
							</a>
						</Link>
						<CustomLink
							href="/submit"
							protectedRoute
							className={clsx(
								`mx-4 text-sm font-medium transition-colors hover:text-white`,
								{ 'text-[#989898]': router.asPath !== '/submit' },
								{ 'text-white': router.asPath === '/submit' }
							)}
						>
							Submit your playlist
						</CustomLink>
						{session.data ? (
							<Popover>
								{({ open }) => (
									<>
										<Popover.Button
											className={clsx(
												'ml-2 flex items-center gap-x-2 rounded-md px-4 py-2 text-sm font-medium transition-all hover:bg-[#3c3c3c]',
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

										<Popover.Panel className="absolute mt-2 w-48 overflow-hidden rounded-md bg-[#292929]">
											<div className="flex flex-col divide-y divide-[#3c3c3c]">
												<Popover.Button as={Link} href="/me/playlists" passHref>
													<a className="flex items-center gap-x-2 py-3 px-4 transition-all hover:bg-[#3c3c3c]">
														<MdQueueMusic />
														<span className="text-sm font-medium">
															My Playlists
														</span>
													</a>
												</Popover.Button>
												<Popover.Button
													onClick={async () => signOut()}
													className="flex items-center gap-x-2 py-3 px-4 transition-all hover:bg-[#3c3c3c]"
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
								className="ml-3 flex items-center gap-x-2 rounded-md bg-[#1ed760] py-2 px-4 transition-opacity hover:opacity-90"
							>
								<FaSpotify />
								<span className="text-sm font-medium">
									Sign in with Spotify
								</span>
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
				</Container>
			</nav>
			<Dialog open={isOpen} onClose={() => setIsOpen(false)}>
				<Dialog.Panel className="fixed top-0 left-0 z-10 h-full w-full bg-[#151515] px-6 pt-28 md:hidden">
					{!session.data ? (
						<button
							onClick={async () => await signIn('spotify')}
							className="flex w-full items-center justify-center gap-x-2 rounded-md bg-[#1ed760] py-2 transition-opacity hover:opacity-90"
						>
							<FaSpotify />
							<span className="font-medium">Sign in with Spotify</span>
						</button>
					) : null}
					<div
						className={clsx('flex flex-col divide-y divide-[#292929]', {
							'mt-8': !session.data
						})}
					>
						<Link href="/" passHref>
							<a
								className={clsx(
									`py-3 text-xl transition-colors hover:text-white`,
									{ 'text-[#989898]': router.asPath !== '/' },
									{ 'text-white': router.asPath === '/' }
								)}
								onClick={() => setIsOpen(false)}
							>
								Home
							</a>
						</Link>
						<CustomLink
							href="/submit"
							protectedRoute
							className={clsx(
								`py-3 text-left text-xl transition-colors hover:text-white`,
								{ 'text-[#989898]': router.asPath !== '/submit' },
								{ 'text-white': router.asPath === '/submit' }
							)}
						>
							Submit your playlist
						</CustomLink>
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
							<div className="mt-2 flex flex-col divide-y divide-[#292929]">
								<Link href="/me/playlists" passHref>
									<a
										className={clsx(
											`py-3 text-xl transition-colors hover:text-white`,
											{ 'text-[#989898]': router.asPath !== '/me/playlists' },
											{ 'text-white': router.asPath === '/me/playlists' }
										)}
										onClick={() => setIsOpen(false)}
									>
										My playlists
									</a>
								</Link>
								<button
									type="button"
									onClick={async () => await signOut()}
									className="py-3 text-left text-xl text-[#989898] hover:text-white"
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
