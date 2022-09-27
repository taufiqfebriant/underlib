import { Combobox, Dialog } from '@headlessui/react';
import { NextPage } from 'next';
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { MdClose, MdFilterAlt, MdOutlineArrowDownward } from 'react-icons/md';
import Typed from 'typed.js';
import { PlaylistCard } from '../components/PlaylistCard';
import Spinner from '../components/Spinner';
import { useDebounce } from '../hooks/use-debounce';
import { trpc } from '../utils/trpc';

const TagOptions = ({ query, except }: { query: string; except: string[] }) => {
	const getTags = trpc.useQuery(['tags.all', { q: query, except }]);
	const defaultClasses =
		'px-4 cursor-pointer h-10 bg-[#292929] flex items-center';

	if (getTags.error) {
		return <div className={defaultClasses}>Something went wrong</div>;
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
		['playlists.all', { limit: 8, tags: props.tags }],
		{
			getNextPageParam: lastPage => lastPage.cursor ?? undefined
		}
	);

	const isLoading = getPlaylists.isLoading || getPlaylists.isFetchingNextPage;

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
			<div className="grid grid-cols-1 md:grid-cols-[repeat(4,_minmax(0,_210px))] w-full justify-between gap-y-4 md:gap-y-6 mt-4">
				{getPlaylists.data?.pages.map((group, i) => (
					<Fragment key={i}>
						{group.data.map(playlist => (
							<PlaylistCard key={playlist.id} data={playlist} />
						))}
					</Fragment>
				))}
			</div>

			{getPlaylists.hasNextPage && !isLoading ? (
				<div className="flex justify-center mt-4">
					<button
						type="button"
						onClick={async () => await getPlaylists.fetchNextPage()}
						className="bg-[#292929] px-4 py-2 rounded-md"
					>
						Load more
					</button>
				</div>
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
	const typeElementRef = useRef<HTMLSpanElement>(null);
	const playlistsSectionRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const debouncedQuery: string = useDebounce<string>(query, 1000);
	const [isOpen, setIsOpen] = useState(false);

	useEffect(() => {
		if (!typeElementRef.current) return;

		const typed = new Typed(typeElementRef.current, {
			strings: [
				'you have a crush.',
				"it's midnight.",
				"you're on a deadline.",
				"it's raining outside.",
				"you're young and free.",
				"you're chilling at the park.",
				"you're growing up."
			],
			typeSpeed: 70,
			backSpeed: 50,
			backDelay: 2500,
			loop: true
		});

		return () => {
			typed.destroy();
		};
	}, []);

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
			<main className="px-6 md:px-0">
				<div className="mt-36 mb-20">
					<h1 className="font-bold text-3xl md:text-5xl text-left h-[10ex] leading-[2.5ex]">
						Find a perfect Spotify playlist when <span ref={typeElementRef} />
					</h1>
					<p className="max-w-2xl mx-auto mt-2 text-[#989898] text-left md:text-center">
						Most of the playlists have cool names which make them hard to find.
						Tags allow you to discover them easily based on your current mood or
						moment.
					</p>
					<div className="flex justify-start md:justify-center mt-6 md:mt-10">
						<button
							type="button"
							className="bg-white px-4 py-2 text-[#151515] rounded-md hover:bg-gray-200 transition-colors flex items-center gap-x-1 font-bold"
							onClick={() => {
								playlistsSectionRef.current?.scrollIntoView({
									behavior: 'smooth'
								});
							}}
						>
							<span>Discover now</span>
							<MdOutlineArrowDownward className="text-lg" />
						</button>
					</div>
				</div>

				<div
					className="max-w-6xl mx-auto scroll-mt-24 mb-10"
					ref={playlistsSectionRef}
				>
					<div
						className="flex items-center justify-between bg-[#151515]"
						ref={playlistsHeaderRef}
					>
						<h1 className="font-bold text-2xl md:text-3xl">All playlists</h1>
						<button
							type="button"
							className="bg-[#292929] px-3 py-2 rounded-md flex items-center gap-x-1"
							onClick={() => setIsOpen(true)}
						>
							<MdFilterAlt className="text-lg" />
							<span className="text-sm">Filter</span>
						</button>
					</div>

					<Playlists tags={selectedTags} />
				</div>
			</main>
			{isPassingPlaylistsHeader ? (
				<div className="fixed top-0 left-0 w-full bg-[#151515] pt-20 px-6 shadow-sm shadow-[#3c3c3c] pb-2 md:hidden">
					<button
						type="button"
						className="bg-[#292929] px-3 py-2 rounded-md flex items-center gap-x-1 w-full justify-center"
						onClick={() => setIsOpen(true)}
					>
						<MdFilterAlt className="text-lg" />
						<span className="text-sm">Filter</span>
					</button>
				</div>
			) : null}
			<Dialog open={isOpen} onClose={() => setIsOpen(false)}>
				<Dialog.Panel className="fixed inset-0 bg-[#151515] z-30 px-6">
					<div className="flex justify-between items-center pt-4">
						<Dialog.Title className="font-bold text-2xl">Filter</Dialog.Title>
						<button type="button" onClick={() => setIsOpen(false)}>
							<MdClose className="text-3xl" />
						</button>
					</div>
					<Combobox
						value={selectedTags}
						onChange={tags => setSelectedTags(tags)}
						multiple
						as="div"
						className="w-full mt-4"
					>
						<Combobox.Label>Tags</Combobox.Label>
						<Combobox.Input
							onChange={e => setQuery(e.target.value)}
							className="bg-[#292929] h-10 rounded-md px-4 w-full mt-2"
							placeholder="Search tags"
						/>
						<Combobox.Options className="mt-2 rounded-md divide-y divide-gray-800 overflow-y-auto max-h-60">
							{debouncedQuery ? (
								<TagOptions query={debouncedQuery} except={selectedTags} />
							) : null}
						</Combobox.Options>
					</Combobox>
					{selectedTags.length ? (
						<div className="flex gap-2 flex-wrap mt-4">
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
			</Dialog>
		</>
	);
};

export default Home;
