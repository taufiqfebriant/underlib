import { Combobox, Dialog } from '@headlessui/react';
import clsx from 'clsx';
import { NextPage } from 'next';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { MdClose, MdFilterAlt, MdOutlineArrowDownward } from 'react-icons/md';
import { useInView } from 'react-intersection-observer';
import { Container } from '../components/Container';
import { PlaylistCard } from '../components/PlaylistCard';
import Spinner from '../components/Spinner';
import { useDebounce } from '../hooks/use-debounce';
import { trpc } from '../utils/trpc';
import { useSignInDialogStore } from './_app';

const TagOptions = ({ query, except }: { query: string; except: string[] }) => {
	const getTags = trpc.useQuery(['tags.all', { q: query, except }]);
	const defaultClasses =
		'px-4 cursor-pointer h-10 bg-[#292929] flex items-center';

	if (getTags.error) {
		return <div className={defaultClasses}>Something went wrong</div>;
	}

	if (!getTags.data?.data.length && !getTags.isLoading) {
		return (
			<li className="px-4 h-10 bg-[#292929] flex items-center">
				There&apos;s no playlists with &quot;{query}&quot; tag
			</li>
		);
	}

	return (
		<>
			{getTags.data?.data.map(tag => (
				<Combobox.Option
					key={tag}
					value={tag}
					className={`${defaultClasses} hover:bg-[#3c3c3c] transition-colors`}
				>
					{tag}
				</Combobox.Option>
			))}
		</>
	);
};

type PlaylistsProps = {
	tags: string[];
};

const Playlists = (props: PlaylistsProps) => {
	const getPlaylists = trpc.useInfiniteQuery(
		['playlists.all', { limit: 10, tags: props.tags }],
		{
			getNextPageParam: lastPage => lastPage.cursor ?? undefined
		}
	);

	const isLoading = getPlaylists.isLoading || getPlaylists.isFetchingNextPage;

	const inView = useInView({
		trackVisibility: true,
		delay: 100,
		threshold: 0.3
	});
	useEffect(() => {
		const fetchMore = async () => {
			await getPlaylists.fetchNextPage();
		};

		if (inView.entry?.isIntersecting) {
			fetchMore();
		}
	}, [inView.entry?.isIntersecting, getPlaylists]);

	if (getPlaylists.isError) {
		return (
			<div className="text-center w-full">
				<h1 className="text-2xl font-bold">Something went wrong</h1>
				<p className="text-[#989898] mt-2 font-medium">
					We&apos;re really sorry. Please try to refresh the page.
				</p>
			</div>
		);
	}

	if (!getPlaylists.data?.pages[0]?.data.length && !isLoading) {
		return (
			<div className="text-center w-full">
				<h1 className="text-2xl font-bold">No playlists found</h1>
				<p className="text-[#989898] mt-2 font-medium">
					We couldn&apos;t find what you searched for. Try search again.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="grid grid-cols-1 justify-between mt-6 gap-y-4 sm:grid-cols-2 sm:gap-x-4 md:grid-cols-[repeat(4,_minmax(0,_200px))] md:gap-y-6 lg:grid-cols-[repeat(5,_minmax(0,_200px))]">
				{getPlaylists.data?.pages.map((group, i) => (
					<Fragment key={i}>
						{group.data.map(playlist => (
							<PlaylistCard key={playlist.id} data={playlist} />
						))}
					</Fragment>
				))}
			</div>

			{getPlaylists.hasNextPage && !isLoading ? (
				<div className="mt-4 w-full" ref={inView.ref} />
			) : null}

			{isLoading ? (
				<div className="flex justify-center w-full mt-4">
					<Spinner className="text-[#292929] fill-white w-6 h-6 md:w-8 md:h-8" />
				</div>
			) : null}
		</>
	);
};

const Home: NextPage = () => {
	const playlistsSectionRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const debouncedQuery: string = useDebounce<string>(query, 1000);
	const [isOpen, setIsOpen] = useState(false);
	const tagsInputRef = useRef<HTMLInputElement>(null);
	const session = useSession();
	const signInDialogStore = useSignInDialogStore();

	const [isPassingPlaylistsHeader, setIsPassingPlaylistsHeader] =
		useState(false);
	const playlistsHeaderRef = useRef<HTMLDivElement>(null);

	const handleScroll = useCallback(() => {
		if (!playlistsHeaderRef.current) return;

		const passed =
			window.scrollY >
			playlistsHeaderRef.current?.offsetTop +
				playlistsHeaderRef.current?.offsetHeight;

		if (passed && !isPassingPlaylistsHeader) {
			setIsPassingPlaylistsHeader(true);
		}

		if (!passed && isPassingPlaylistsHeader) {
			setIsPassingPlaylistsHeader(false);
		}
	}, [isPassingPlaylistsHeader]);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);

		return () => {
			window.removeEventListener('scroll', handleScroll);
		};
	}, [handleScroll]);

	return (
		<>
			<Container as="main">
				<div className="mt-32 mb-20 md:mt-28">
					<h1 className="font-bold text-6xl text-center h-full md:text-8xl flex flex-col gap-y-2">
						<span className="text-white">Moods.</span>
						<span className="text-white">Moments.</span>
						<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#739a77] to-[#1ed760] pb-2">
							Playlists.
						</span>
					</h1>
					<p className="max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto text-[#989898] mt-4 text-lg text-center">
						Most of the Spotify playlists have cool names which make them hard
						to find. Tags allow you to discover them easily based on your
						current mood or moment.
					</p>
					<div className="flex flex-col items-center gap-y-4 mt-8 md:flex-row md:gap-x-4 md:justify-center">
						<button
							type="button"
							className="bg-white px-4 py-2 text-[#151515] rounded-md hover:bg-gray-200 transition-colors flex items-center gap-x-2 font-medium justify-center"
							onClick={() => {
								playlistsSectionRef.current?.scrollIntoView({
									behavior: 'smooth'
								});
							}}
						>
							<span>Discover now</span>
							<MdOutlineArrowDownward />
						</button>
						{session.data ? (
							<Link href="/submit" passHref>
								<a className="bg-[#292929] px-4 py-2 rounded-md hover:bg-[#3c3c3c] transition-colors font-medium">
									Submit your playlist
								</a>
							</Link>
						) : (
							<button
								type="button"
								className="bg-[#292929] px-4 py-2 rounded-md hover:bg-[#3c3c3c] transition-colors font-medium"
								onClick={() => signInDialogStore.setIsOpen(true)}
							>
								Submit your playlist
							</button>
						)}
					</div>
				</div>

				<div className="scroll-mt-24 mb-10" ref={playlistsSectionRef}>
					<div
						className="flex items-center justify-between bg-[#151515]"
						ref={playlistsHeaderRef}
					>
						<h1 className="font-bold text-2xl sm:text-3xl">All playlists</h1>
						<button
							type="button"
							className="bg-[#292929] px-4 py-2 rounded-md flex items-center gap-x-2 hover:bg-[#3c3c3c] transition-colors"
							onClick={() => setIsOpen(true)}
						>
							<span className="text-sm font-medium">Filter</span>
							<MdFilterAlt />
						</button>
					</div>

					<Playlists tags={selectedTags} />
				</div>
			</Container>
			{isPassingPlaylistsHeader ? (
				<div className="fixed top-0 left-0 w-full bg-[#151515] pt-[4.5rem] shadow-sm shadow-[#3c3c3c]">
					<Container className="flex items-center justify-between py-3">
						<h1 className="font-bold text-2xl sm:text-3xl">All playlists</h1>
						<button
							type="button"
							className="bg-[#292929] px-4 py-2 rounded-md flex items-center gap-x-2 hover:bg-[#3c3c3c] transition-colors"
							onClick={() => setIsOpen(true)}
						>
							<span className="text-sm font-medium">Filter</span>
							<MdFilterAlt />
						</button>
					</Container>
				</div>
			) : null}
			<Dialog
				open={isOpen}
				onClose={() => setIsOpen(false)}
				className="relative z-30"
			>
				<div className="fixed inset-0 bg-black/70" aria-hidden="true" />

				<div className="fixed inset-0 flex items-center justify-center">
					<Dialog.Panel className="bg-[#151515] p-4 h-2/3 w-4/5 rounded-md border border-[#3c3c3c] md:w-1/2 md:h-1/2">
						<div className="flex justify-between items-center">
							<Dialog.Title className="font-bold text-2xl">Filter</Dialog.Title>
							<button type="button" onClick={() => setIsOpen(false)}>
								<MdClose className="text-3xl" />
							</button>
						</div>
						<Combobox
							value={selectedTags}
							onChange={tags => {
								setSelectedTags(tags);
								setQuery('');

								if (tagsInputRef.current) {
									tagsInputRef.current.value = '';
									tagsInputRef.current.focus();
								}
							}}
							multiple
							as="div"
							className="w-full mt-4"
						>
							<Combobox.Label>Tags</Combobox.Label>
							<Combobox.Input
								onChange={e => setQuery(e.target.value)}
								className="bg-[#292929] h-10 rounded-md px-4 w-full mt-2"
								placeholder="Search tags"
								ref={tagsInputRef}
							/>
							<Combobox.Options
								className={clsx(
									'rounded-md divide-y divide-gray-800 overflow-y-auto max-h-60',
									{ 'mt-2': query && debouncedQuery }
								)}
							>
								{query && debouncedQuery ? (
									<TagOptions query={debouncedQuery} except={selectedTags} />
								) : null}
							</Combobox.Options>
						</Combobox>
						{selectedTags.length ? (
							<div className="flex gap-2 flex-wrap mt-2">
								{selectedTags.map(tag => (
									<div
										key={tag}
										className="bg-[#292929] pl-3 pr-1 py-1 rounded-md flex items-center gap-x-2"
									>
										<span className="text-sm">{tag}</span>
										<button
											type="button"
											className="bg-[#3c3c3c] hover:bg-[#686868] transition-colors rounded-md p-1"
											onClick={() =>
												setSelectedTags(prev => prev.filter(t => t !== tag))
											}
										>
											<MdClose className="text-sm" />
										</button>
									</div>
								))}
							</div>
						) : null}
					</Dialog.Panel>
				</div>
			</Dialog>
		</>
	);
};

export default Home;
