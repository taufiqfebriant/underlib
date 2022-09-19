import { Combobox } from '@headlessui/react';
import clsx from 'clsx';
import { NextPage } from 'next';
import Image from 'next/image';
import { Fragment, useEffect, useRef, useState } from 'react';
import { MdClose, MdOutlineArrowDownward } from 'react-icons/md';
import Typed from 'typed.js';
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
	const get_playlists = trpc.useInfiniteQuery([
		'playlists.all',
		{ limit: 8, tags: props.tags }
	]);

	if (get_playlists.isLoading) {
		return <p>Loading...</p>;
	}

	if (get_playlists.error) {
		return <p>Something went wrong</p>;
	}

	return (
		<div className="grid grid-cols-[repeat(4,_minmax(0,_220px))] w-full justify-between gap-y-6">
			{get_playlists.data?.pages.map((group, i) => (
				<Fragment key={i}>
					{group.data.map(playlist => (
						<div
							key={playlist.id}
							className="bg-[#292929] rounded-md overflow-hidden w-[220px] h-[22rem] flex flex-col"
						>
							{playlist.images[0] ? (
								<Image
									src={playlist.images[0].url}
									width={220}
									height={220}
									className="object-cover"
									alt="Playlist image"
								/>
							) : null}
							<div className="px-3 pt-2 pb-4 flex flex-col justify-between flex-1">
								<h1 className="font-semibold flex-1">{playlist.name}</h1>
								<p className="text-sm text-[#989898] line-clamp-2 flex-auto">
									{playlist.owner.display_name}
								</p>
								<div className="flex gap-x-2">
									{playlist.tags.map(tag => (
										<div
											key={tag.name}
											className="bg-[#3c3c3c] rounded-md px-2 py-1 text-xs"
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
			<div className="h-screen flex flex-col justify-center">
				<div>
					<div className="flex flex-col font-bold text-5xl gap-y-4 text-center">
						<h1>Find a perfect Spotify playlist</h1>
						<h1>
							when <span ref={typeElementRef}></span>
						</h1>
					</div>
					<p className="max-w-2xl mx-auto mt-6 text-lg text-[#989898] font-medium text-center">
						Most of the playlists have cool names. That&apos;s why it&apos;s
						hard to find. With tags, we help you discover awesome Spotify
						playlists easier for your current moment or mood.
					</p>
					<div className="flex justify-center mt-10">
						<button
							type="button"
							className="bg-white px-6 py-2 text-[#151515] rounded-md hover:bg-gray-200 transition-colors flex items-center gap-x-2"
							onClick={() => {
								playlistsSectionRef.current?.scrollIntoView({
									behavior: 'smooth'
								});
							}}
						>
							<span className="font-semibold">Discover now</span>
							<MdOutlineArrowDownward className="text-lg" />
						</button>
					</div>
				</div>
			</div>
			<div
				className="mb-10 max-w-6xl mx-auto scroll-mt-24"
				ref={playlistsSectionRef}
			>
				<h1 className="font-bold text-3xl">All playlists</h1>
				<div className="flex gap-x-6 mt-6">
					<div className="sticky top-20 block w-64">
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
						<label
							className={clsx(
								'inline-block',
								{ 'mt-4': selectedTags.length },
								{ 'mt-0': !selectedTags.length }
							)}
						>
							Tags
						</label>
						<Combobox
							value={selectedTags}
							onChange={tags => setSelectedTags(tags)}
							multiple
							as="div"
							className="mt-2"
						>
							<Combobox.Input
								onChange={e => setQuery(e.target.value)}
								className="bg-[#292929] h-10 rounded-md px-4 w-full"
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
