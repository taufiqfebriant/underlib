import { Combobox } from '@headlessui/react';
import clsx from 'clsx';
import { NextPage } from 'next';
import Image from 'next/future/image';
import { Fragment, useEffect, useRef, useState } from 'react';
import { MdClose, MdOutlineArrowDownward } from 'react-icons/md';
import Typed from 'typed.js';
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
	const getPlaylists = trpc.useInfiniteQuery([
		'playlists.all',
		{ limit: 8, tags: props.tags }
	]);

	if (getPlaylists.isLoading) {
		return (
			<div className="flex justify-center w-full">
				<Spinner className="text-[#292929] fill-white w-8 h-8" />
			</div>
		);
	}

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

	if (!getPlaylists.data?.pages[0]?.data.length) {
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
		<div className="grid grid-cols-[repeat(4,_minmax(0,_210px))] w-full justify-between gap-y-6">
			{getPlaylists.data?.pages.map((group, i) => (
				<Fragment key={i}>
					{group.data.map(playlist => (
						<div
							key={playlist.id}
							className="bg-[#292929] rounded-md overflow-hidden w-[210px] h-[22rem] flex flex-col"
						>
							<div className="w-full h-[210px] relative">
								{playlist.images[0] ? (
									<Image
										src={playlist.images[0].url}
										alt="Playlist image"
										fill
										className="object-cover"
									/>
								) : null}
							</div>
							<div className="px-3 pt-2 pb-3 flex flex-col justify-between flex-1">
								<h1 className="font-semibold">{playlist.name}</h1>
								<p className="text-sm text-[#989898] line-clamp-2 flex-1 mt-1">
									{playlist.owner.display_name}
								</p>
								<div className="flex gap-x-2 overflow-y-auto">
									{playlist.tags.map(tag => (
										<div
											key={tag.name}
											className="bg-[#3c3c3c] rounded-md px-2 py-1 text-xs whitespace-nowrap"
										>
											{tag.name}
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</Fragment>
			))}
		</div>
	);
};

const Home: NextPage = () => {
	const typeElementRef = useRef<HTMLSpanElement>(null);
	const playlistsSectionRef = useRef<HTMLDivElement>(null);
	const [query, setQuery] = useState('');
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const debouncedQuery: string = useDebounce<string>(query, 1000);

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

	return (
		<main>
			<div className="h-screen flex flex-col justify-center px-6 md:px-0">
				<div>
					<h1 className="font-bold text-3xl md:text-5xl text-left h-[7.5ex] leading-[2.5ex]">
						Find a perfect Spotify playlist when <span ref={typeElementRef} />
					</h1>
					<p className="max-w-2xl mx-auto mt-4 text-[#989898] text-left md:text-center">
						Most of the playlists have cool names which make them hard to find.
						Tags allow you to discover them easily based on your current mood or
						moment.
					</p>
					<div className="flex justify-start md:justify-center mt-6 md:mt-10">
						<button
							type="button"
							className="bg-white px-6 py-2 text-[#151515] rounded-md hover:bg-gray-200 transition-colors flex items-center gap-x-2 font-bold"
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
			</div>
			<div
				className="max-w-6xl mx-auto min-h-screen scroll-mt-24 mb-10"
				ref={playlistsSectionRef}
			>
				<h1 className="font-bold text-3xl">All playlists</h1>
				<div className="flex gap-x-6 mt-6 items-start">
					<div className="sticky top-24 w-56 shrink-0">
						{selectedTags.length ? (
							<div className="flex gap-2 flex-wrap">
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
						<Combobox
							value={selectedTags}
							onChange={tags => setSelectedTags(tags)}
							multiple
							as="div"
							className={clsx(
								'w-full',
								{ 'mt-4': selectedTags.length },
								{ 'mt-0': !selectedTags.length }
							)}
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
					</div>
					<Playlists tags={selectedTags} />
				</div>
			</div>
		</main>
	);
};

export default Home;
