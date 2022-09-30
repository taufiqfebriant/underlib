import { Combobox } from '@headlessui/react';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { MdClose, MdFilterAlt, MdOutlineArrowDownward } from 'react-icons/md';
import { useInView } from 'react-intersection-observer';
import { Container } from '../components/Container';
import CustomDialog from '../components/CustomDialog';
import CustomLink from '../components/CustomLink';
import { getLayout } from '../components/Layout';
import { PlaylistCard } from '../components/PlaylistCard';
import Spinner from '../components/Spinner';
import { useDebounce } from '../hooks/use-debounce';
import { trpc } from '../utils/trpc';
import { NextPageWithLayout } from './_app';

const TagOptions = ({ query, except }: { query: string; except: string[] }) => {
	const getTags = trpc.useQuery(['tags.all', { q: query, except }]);
	const defaultClasses =
		'px-4 cursor-pointer h-10 bg-[#292929] flex items-center';

	if (getTags.error) {
		return <div className={defaultClasses}>Something went wrong</div>;
	}

	if (!getTags.data?.data.length && !getTags.isLoading) {
		return (
			<li className="flex h-10 items-center bg-[#292929] px-4">
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
					className={`${defaultClasses} transition-colors hover:bg-[#3c3c3c]`}
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
			<div className="w-full text-center">
				<h1 className="text-2xl font-bold">Something went wrong</h1>
				<p className="mt-2 font-medium text-[#989898]">
					We&apos;re really sorry. Please try to refresh the page.
				</p>
			</div>
		);
	}

	if (!getPlaylists.data?.pages[0]?.data.length && !isLoading) {
		return (
			<div className="w-full text-center">
				<h1 className="text-2xl font-bold">No playlists found</h1>
				<p className="mt-2 font-medium text-[#989898]">
					We couldn&apos;t find what you searched for. Try search again.
				</p>
			</div>
		);
	}

	return (
		<>
			<div className="mt-6 grid grid-cols-1 justify-between gap-y-4 sm:grid-cols-2 sm:gap-x-4 md:grid-cols-[repeat(4,_minmax(0,_200px))] md:gap-y-6 lg:grid-cols-[repeat(5,_minmax(0,_200px))]">
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
				<div className="mt-4 flex w-full justify-center">
					<Spinner className="h-6 w-6 fill-white text-[#292929] md:h-8 md:w-8" />
				</div>
			) : null}
		</>
	);
};

const Home: NextPageWithLayout = () => {
	const playlistsSectionRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const debouncedQuery: string = useDebounce<string>(query, 1000);
	const [isOpen, setIsOpen] = useState(false);
	const tagsInputRef = useRef<HTMLInputElement>(null);

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
			<Container>
				<div className="mt-32 mb-20 md:mt-28">
					<h1 className="flex h-full flex-col gap-y-2 text-center text-6xl font-bold md:text-8xl">
						<span className="text-white">Moods.</span>
						<span className="text-white">Moments.</span>
						<span className="bg-gradient-to-r from-[#739a77] to-[#1ed760] bg-clip-text pb-2 text-transparent">
							Playlists.
						</span>
					</h1>
					<p className="mx-auto mt-4 max-w-lg text-center text-lg text-[#989898] md:max-w-2xl lg:max-w-3xl">
						Most of the Spotify playlists have cool names which make them hard
						to find. Tags allow you to discover them easily based on your
						current mood or moment.
					</p>
					<div className="mt-8 flex flex-col items-center gap-y-4 md:flex-row md:justify-center md:gap-x-4">
						<button
							type="button"
							className="flex items-center justify-center gap-x-2 rounded-md bg-white px-4 py-2 font-medium text-[#151515] transition-colors hover:bg-gray-200"
							onClick={() => {
								playlistsSectionRef.current?.scrollIntoView({
									behavior: 'smooth'
								});
							}}
						>
							<span>Discover now</span>
							<MdOutlineArrowDownward />
						</button>
						<CustomLink
							href="/submit"
							protectedRoute
							className="rounded-md bg-[#292929] px-4 py-2 font-medium transition-colors hover:bg-[#3c3c3c]"
						>
							Submit your playlist
						</CustomLink>
					</div>
				</div>

				<div className="mb-10 scroll-mt-24" ref={playlistsSectionRef}>
					<div
						className="flex items-center justify-between bg-[#151515]"
						ref={playlistsHeaderRef}
					>
						<h1 className="text-2xl font-bold sm:text-3xl">All playlists</h1>
						<button
							type="button"
							className="flex items-center gap-x-2 rounded-md bg-[#292929] px-4 py-2 transition-colors hover:bg-[#3c3c3c]"
							onClick={() => setIsOpen(true)}
						>
							<span className="text-sm font-medium">Filter</span>
							<MdFilterAlt />
						</button>
					</div>

					<Playlists tags={selectedTags} />
				</div>
			</Container>
			<motion.div
				className="fixed top-0 left-0 w-full bg-[#151515] shadow-sm shadow-[#3c3c3c]"
				animate={isPassingPlaylistsHeader ? 'open' : 'closed'}
				variants={{
					open: {
						display: 'block',
						paddingTop: '4.5rem'
					},
					closed: {
						paddingTop: 0,
						transitionEnd: {
							display: 'none'
						}
					}
				}}
			>
				<Container className="flex items-center justify-between py-3">
					<h1 className="text-2xl font-bold sm:text-3xl">All playlists</h1>
					<button
						type="button"
						className="flex items-center gap-x-2 rounded-md bg-[#292929] px-4 py-2 transition-colors hover:bg-[#3c3c3c]"
						onClick={() => setIsOpen(true)}
					>
						<span className="text-sm font-medium">Filter</span>
						<MdFilterAlt />
					</button>
				</Container>
			</motion.div>
			<CustomDialog
				title="Filter"
				isOpen={isOpen}
				setIsOpen={setIsOpen}
				className="min-h-[400px]"
			>
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
					className="mt-4 w-full"
				>
					<Combobox.Label>Tags</Combobox.Label>
					<Combobox.Input
						onChange={e => setQuery(e.target.value)}
						className="mt-2 h-10 w-full rounded-md bg-[#292929] px-4"
						placeholder="Search tags"
						ref={tagsInputRef}
					/>
					<Combobox.Options
						className={clsx(
							'max-h-60 divide-y divide-gray-800 overflow-y-auto rounded-md',
							{ 'mt-2': query && debouncedQuery }
						)}
					>
						{query && debouncedQuery ? (
							<TagOptions query={debouncedQuery} except={selectedTags} />
						) : null}
					</Combobox.Options>
				</Combobox>
				{selectedTags.length ? (
					<div className="mt-2 flex flex-wrap gap-2">
						{selectedTags.map(tag => (
							<div
								key={tag}
								className="flex items-center gap-x-2 rounded-md bg-[#292929] py-1 pl-3 pr-1"
							>
								<span className="text-sm">{tag}</span>
								<button
									type="button"
									className="rounded-md bg-[#3c3c3c] p-1 transition-colors hover:bg-[#686868]"
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
			</CustomDialog>
		</>
	);
};

Home.getLayout = getLayout;

export default Home;
