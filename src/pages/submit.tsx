import { Combobox, Listbox } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import type { NextPage } from 'next';
import Image from 'next/image';
import { Fragment, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaChevronDown, FaChevronUp, FaExternalLinkAlt } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';
import Spinner from '../components/Spinner';
import { ResponseData } from '../server/router/playlists';
import { trpc } from '../utils/trpc';

export const mutation_create_input = z.object({
	id: z.string().min(1, { message: 'You must select one of your playlist' }),
	tags: z
		.array(z.string())
		.min(1, { message: 'You must include at least one tag' })
});

type Schema = z.infer<typeof mutation_create_input>;

const tags = [
	{ id: '1', name: 'Love' },
	{ id: '2', name: 'Deadline' },
	{ id: '3', name: 'Heartbreak' },
	{ id: '4', name: 'Growing Up' },
	{ id: '5', name: 'Chill' },
	{ id: '6', name: 'Midnight' },
	{ id: '7', name: 'Move On' },
	{ id: '8', name: 'Tired' },
	{ id: '9', name: 'Hard Work' },
	{ id: '10', name: 'Comeback' },
	{ id: '11', name: 'Young' },
	{ id: '12', name: 'Free' }
];

const Submit: NextPage = () => {
	const limit = 5;
	const get_playlists = trpc.useInfiniteQuery(['playlists.all', { limit }], {
		getNextPageParam: lastPage => lastPage.cursor
	});

	const create_playlist = trpc.useMutation('playlists.create');

	const form = useForm<Schema>({
		resolver: zodResolver(mutation_create_input)
	});

	const [selectedPlaylist, setSelectedPlaylist] = useState<
		ResponseData[number] | null
	>(null);

	const [selectedTags, setSelectedTags] = useState<typeof tags>([]);

	const [query, setQuery] = useState('');

	const filteredTags =
		query === '' && !selectedTags.length
			? tags
			: tags.filter(tag => {
					const selectedIds = selectedTags.length
						? selectedTags.map(selectedTag => selectedTag.id)
						: [];

					return (
						tag.name.toLowerCase().includes(query.toLowerCase()) &&
						!selectedIds.includes(tag.id)
					);
			  });

	const isNew =
		query.length > 0 &&
		!filteredTags.length &&
		!selectedTags
			.map(selectedTag => selectedTag.name.toLowerCase())
			.includes(query.toLowerCase());

	const tagsInputRef = useRef<HTMLInputElement>(null);

	const onSubmit = async (data: Schema) => {
		try {
			await create_playlist.mutateAsync(data);
		} catch {}
	};

	if (get_playlists.isLoading) {
		return <p>Loading...</p>;
	}

	if (get_playlists.error) {
		return <p>Something went wrong</p>;
	}

	return (
		<main className="max-w-2xl mx-auto">
			{get_playlists.data?.pages[0]?.data.length ? (
				<>
					<h1 className="text-white text-4xl font-bold mt-14 text-center">
						Submit your playlist
					</h1>
					<p className="mt-4 text-gray-400 font-medium text-center">
						Choose one of your public playlists and give it some tags to help
						folks find it
					</p>
					<form onSubmit={form.handleSubmit(onSubmit)} className="mt-10">
						<div>
							<label htmlFor="playlist" className="text-lg">
								Playlist
							</label>
							<p className="text-gray-500 text-sm mt-1">Choose a playlist</p>
							<Controller
								control={form.control}
								name="id"
								render={({ field, formState }) => (
									<>
										<Listbox
											value={selectedPlaylist}
											onChange={selectedPlaylist => {
												setSelectedPlaylist(selectedPlaylist);
												field.onChange(selectedPlaylist?.id);
											}}
										>
											{({ open }) => (
												<>
													<Listbox.Button className="w-full mt-2 bg-gray-900 px-4 h-10 rounded-md flex items-center justify-between">
														<span>{selectedPlaylist?.name}</span>
														{open ? <FaChevronUp /> : <FaChevronDown />}
													</Listbox.Button>
													<Listbox.Options className="mt-1 rounded-md divide-y divide-gray-800 overflow-y-auto max-h-60">
														{get_playlists.data?.pages.map((group, i) => (
															<Fragment key={i}>
																{group.data.map(playlist => (
																	<Listbox.Option
																		key={playlist.id}
																		value={playlist}
																		as={Fragment}
																	>
																		{({ active, selected }) => (
																			<li
																				className={clsx(
																					`px-4 hover:bg-gray-800 cursor-pointer flex items-center gap-x-4 h-20 transition-all`,
																					{ 'bg-gray-800': selected || active },
																					{
																						'bg-gray-900': !selected && !active
																					}
																				)}
																			>
																				{playlist.images.length &&
																				playlist.images[0]?.url ? (
																					<Image
																						src={playlist.images[0].url}
																						alt="Playlist image"
																						width={48}
																						height={48}
																						className="object-cover rounded-md"
																					/>
																				) : null}
																				<div>
																					<h1 className="block">
																						{playlist.name}
																					</h1>
																					{playlist.description ? (
																						<p
																							className="text-sm text-gray-500 truncate"
																							dangerouslySetInnerHTML={{
																								__html: playlist.description
																							}}
																						/>
																					) : null}
																				</div>
																			</li>
																		)}
																	</Listbox.Option>
																))}
															</Fragment>
														))}
														{get_playlists.hasNextPage ? (
															<li className="bg-gray-900 flex items-center h-20 justify-center">
																{get_playlists.isFetchingNextPage ? (
																	<Spinner />
																) : null}

																{get_playlists.hasNextPage &&
																!get_playlists.isFetchingNextPage ? (
																	<>
																		<button
																			type="button"
																			className="bg-gray-800 px-4 py-2 rounded-md hover:bg-gray-700 transition-all"
																			onClick={() =>
																				get_playlists.fetchNextPage()
																			}
																		>
																			Load more
																		</button>
																	</>
																) : null}
															</li>
														) : null}
													</Listbox.Options>
												</>
											)}
										</Listbox>
										{formState.errors.id?.message ? (
											<p className="text-red-600 mt-2">
												{form.formState.errors.id?.message}
											</p>
										) : null}
									</>
								)}
							/>
						</div>
						<div className="mt-6">
							<label htmlFor="playlist" className="text-lg">
								Tags
							</label>
							<p className="text-gray-500 text-sm mt-1">
								Add some tags that relate to your playlist
							</p>
							{selectedTags.length ? (
								<div className="flex gap-2 mt-3 flex-wrap">
									{selectedTags.map(selectedTag => (
										<div
											key={selectedTag.id}
											className="bg-gray-900 pl-4 pr-1 py-1 rounded-full flex items-center gap-x-2"
										>
											<span className="text-sm">{selectedTag.name}</span>
											<button
												type="button"
												className="bg-gray-800 hover:bg-gray-700 transition-all rounded-full p-1"
												onClick={() =>
													setSelectedTags(prev =>
														prev.filter(tag => tag.id !== selectedTag.id)
													)
												}
											>
												<MdClose />
											</button>
										</div>
									))}
								</div>
							) : null}
							<Controller
								control={form.control}
								name="tags"
								render={({ field, formState }) => (
									<>
										<Combobox
											value={selectedTags}
											onChange={selectedTags => {
												setSelectedTags(selectedTags);
												setQuery('');

												if (tagsInputRef.current) {
													tagsInputRef.current.value = '';
													tagsInputRef.current.focus();
												}

												field.onChange(
													selectedTags.map(selectedTag => selectedTag.name)
												);
											}}
											multiple
										>
											<Combobox.Input
												onChange={e => setQuery(e.target.value)}
												className="w-full bg-gray-900 px-4 h-10 rounded-md flex items-center justify-between focus:outline-none mt-2"
												ref={tagsInputRef}
												placeholder="Chill, Happy, Young, etc."
											/>
											<Combobox.Options className="mt-1 rounded-md divide-y divide-gray-800 overflow-y-auto max-h-60">
												{isNew ? (
													<Combobox.Option
														value={{ id: null, name: query }}
														className="px-4 hover:bg-gray-800 cursor-pointer flex items-center gap-x-4 h-10 bg-gray-900 transition-all"
													>
														Create &quot;{query}&quot;
													</Combobox.Option>
												) : null}
												{filteredTags.map(tag => (
													<Combobox.Option
														key={tag.id}
														value={tag}
														className="px-4 hover:bg-gray-800 cursor-pointer flex items-center gap-x-4 h-10 bg-gray-900 transition-all"
													>
														{tag.name}
													</Combobox.Option>
												))}
											</Combobox.Options>
										</Combobox>
										{formState.errors.tags?.message ? (
											<p className="text-red-600 mt-2">
												{form.formState.errors.tags?.message}
											</p>
										) : null}
									</>
								)}
							/>
						</div>
						<div className="flex justify-end mt-6">
							<button
								type="submit"
								className="bg-green-500 rounded-md px-6 py-2 font-bold focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-4 focus:ring-offset-black focus:bg-green-600 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-4 focus-visible:ring-offset-black focus-visible:bg-green-600 hover:bg-green-600 transition-all"
							>
								Submit
							</button>
						</div>
					</form>
				</>
			) : (
				<>
					<h1 className="text-white text-4xl font-bold mt-14 text-center">
						Oh crap!
					</h1>
					<p className="mt-4 text-gray-400 font-medium text-center">
						You don&apos;t have a playlist to submit yet
					</p>
					<div className="mt-10">
						<p>What should i do?</p>
						<ul className="list-disc list-inside">
							<li>
								Make sure your playlist is set to public and added to your
								profile. Tutorial:{' '}
								<a
									href="https://allthings.how/how-to-add-playlists-to-your-spotify-profile"
									rel="noreferrer"
									target="_blank"
									className="text-cyan-600 hover:underline flex items-center gap-x-2"
								>
									<span>
										How to Add Playlists to Your Spotify Profile - All Things
										How
									</span>
									<FaExternalLinkAlt />
								</a>
							</li>
						</ul>
					</div>
				</>
			)}
		</main>
	);
};

export default Submit;
