import { Combobox, Listbox } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import type { NextPage } from 'next';
import Image from 'next/image';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaChevronDown, FaChevronUp, FaExternalLinkAlt } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';
import Spinner from '../components/Spinner';
import { useDebounce } from '../hooks/use-debounce';
import { ResponseData } from '../server/router/playlists';
import { trpc } from '../utils/trpc';

export const mutation_create_input = z.object({
	id: z.string().min(1, { message: 'You must select one of your playlist' }),
	tags: z
		.array(z.string())
		.min(1, { message: 'You must include at least one tag' })
});

type Schema = z.infer<typeof mutation_create_input>;

type TagOptionsProps = {
	query: string;
	except: string[];
};

const TagOptions = (props: TagOptionsProps) => {
	const getTags = trpc.useQuery([
		'tags.all',
		{ q: props.query, except: props.except }
	]);

	const defaultClasses =
		'px-4 cursor-pointer h-10 bg-[#292929] flex items-center';

	if (getTags.error) {
		return <div className={defaultClasses}>Something went wrong</div>;
	}

	const isNew = props.query.length > 0 && !getTags.data?.data.length;
	if (isNew) {
		return (
			<Combobox.Option
				value={props.query}
				className={`${defaultClasses} hover:bg-[#3c3c3c] transition-colors`}
			>
				Create &quot;{props.query}&quot;
			</Combobox.Option>
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

const Submit: NextPage = () => {
	const getPlaylists = trpc.useInfiniteQuery(['me.playlists', { limit: 5 }], {
		getNextPageParam: lastPage => lastPage.cursor
	});

	const createPlaylist = trpc.useMutation('playlists.create');

	const form = useForm<Schema>({
		resolver: zodResolver(mutation_create_input)
	});

	const [selectedPlaylist, setSelectedPlaylist] = useState<
		ResponseData[number] | null
	>(null);

	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	const [query, setQuery] = useState('');
	const debouncedQuery: string = useDebounce<string>(query, 1000);

	const tagsInputRef = useRef<HTMLInputElement>(null);

	const onSubmit = async (data: Schema) => {
		try {
			await createPlaylist.mutateAsync(data);
			form.reset({ id: '', tags: [] });
		} catch {}
	};

	useEffect(() => {
		console.log('getPlaylists.data?.pages:', getPlaylists.data?.pages);
	}, [getPlaylists.data?.pages]);

	if (getPlaylists.isLoading) {
		return (
			<main className="min-h-screen flex items-center justify-center">
				<Spinner className="text-[#292929] fill-white w-8 h-8" />
			</main>
		);
	}

	if (getPlaylists.error) {
		return <p>Something went wrong</p>;
	}

	return (
		<main className="max-w-2xl mx-auto min-h-screen flex items-center">
			<div className="w-full">
				{getPlaylists.data?.pages[0]?.data.length ? (
					<>
						<h1 className="text-white text-4xl font-bold text-center">
							Submit your playlist
						</h1>
						<p className="mt-4 text-[#989898] font-medium text-center">
							Pick one of your public playlists and give it some tags to help
							others find it
						</p>
						<form onSubmit={form.handleSubmit(onSubmit)} className="mt-10">
							<div>
								<label htmlFor="playlist" className="text-lg">
									Playlist
								</label>
								<p className="text-[#989898] text-sm">Pick a playlist</p>
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
												as="div"
												className="relative"
											>
												{({ open }) => (
													<>
														<Listbox.Button className="w-full mt-2 bg-[#292929] px-4 h-10 rounded-md flex items-center justify-between">
															<span>{selectedPlaylist?.name}</span>
															{open ? <FaChevronUp /> : <FaChevronDown />}
														</Listbox.Button>
														<Listbox.Options className="mt-1 rounded-md divide-y divide-[#3c3c3c] overflow-y-auto max-h-60 absolute w-full z-10 shadow shadow-white/40">
															{getPlaylists.data?.pages.map((group, i) => (
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
																						`px-4 hover:bg-[#3c3c3c] cursor-pointer flex items-center gap-x-4 h-20 transition-colors`,
																						{
																							'bg-[#3c3c3c]': selected || active
																						},
																						{
																							'bg-[#292929]':
																								!selected && !active
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
																								className="text-sm text-[#989898] truncate"
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
															{getPlaylists.hasNextPage ? (
																<li className="bg-[#292929] flex items-center h-20 justify-center">
																	{getPlaylists.isFetchingNextPage ? (
																		<Spinner className="text-[#3c3c3c] fill-white w-4 h-4" />
																	) : null}

																	{getPlaylists.hasNextPage &&
																	!getPlaylists.isFetchingNextPage ? (
																		<>
																			<button
																				type="button"
																				className="bg-[#3c3c3c] px-4 py-2 rounded-md hover:bg-[#686868] transition-colors"
																				onClick={() =>
																					getPlaylists.fetchNextPage()
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
								<p className="text-[#989898] text-sm">
									Add some tags that relate to your playlist
								</p>
								{selectedTags.length ? (
									<div className="flex gap-2 mt-2 flex-wrap">
										{selectedTags.map(selectedTag => (
											<div
												key={selectedTag}
												className="bg-[#292929] pl-3 pr-1 py-1 rounded-md flex items-center gap-x-2"
											>
												<span className="text-sm">{selectedTag}</span>
												<button
													type="button"
													className="bg-[#3c3c3c] hover:bg-[#686868] transition-colors rounded-md p-1"
													onClick={() =>
														setSelectedTags(prev =>
															prev.filter(tag => tag !== selectedTag)
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
														selectedTags.map(selectedTag => selectedTag)
													);
												}}
												multiple
												as="div"
												className="relative"
											>
												<Combobox.Input
													onChange={e => setQuery(e.target.value)}
													className="w-full bg-[#292929] px-4 h-10 rounded-md flex items-center justify-between focus:outline-none mt-2"
													ref={tagsInputRef}
													placeholder="Chill, Happy, Young, etc."
												/>
												<Combobox.Options className="mt-1 rounded-md divide-y divide-gray-800 overflow-y-auto max-h-60 absolute w-full">
													{debouncedQuery ? (
														<TagOptions
															query={debouncedQuery}
															except={selectedTags}
														/>
													) : null}
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
									disabled={createPlaylist.isLoading}
									className={clsx(
										'bg-white px-6 py-2 text-[#151515] rounded-md hover:bg-gray-200 transition-colors font-bold disabled:opacity-50',
										{ 'flex gap-x-2 items-center': true }
									)}
								>
									{createPlaylist.isLoading ? (
										<>
											<Spinner className="text-[#989898] fill-[#151515] w-5 h-5" />
											<span>Submitting...</span>
										</>
									) : (
										<span>Submit</span>
									)}
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
			</div>
		</main>
	);
};

export default Submit;
