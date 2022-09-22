import { Combobox, Listbox } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Toast from '@radix-ui/react-toast';
import clsx from 'clsx';
import type { NextPage } from 'next';
import Image from 'next/image';
import { Fragment, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaChevronDown, FaChevronUp, FaExternalLinkAlt } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';
import Spinner from '../components/Spinner';
import { useDebounce } from '../hooks/use-debounce';
import { ResponseData } from '../server/router/me.playlists';
import { trpc } from '../utils/trpc';

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

	if (getTags.isLoading) {
		return null;
	}

	if (getTags.error) {
		return <div className={defaultClasses}>Something went wrong</div>;
	}

	const isNew =
		props.query.length > 0 &&
		!getTags.data?.data.length &&
		!props.except.includes(props.query);

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

const createPlaylistInput = z.object({
	id: z
		.string({
			required_error: 'You must pick one of your playlists'
		})
		.min(1, { message: 'You must pick one of your playlists' }),
	tags: z
		.array(z.string(), {
			required_error: 'You must include at least one tag'
		})
		.min(1, { message: 'You must include at least one tag' })
});

type Schema = z.infer<typeof createPlaylistInput>;

const Submit: NextPage = () => {
	const getPlaylists = trpc.useInfiniteQuery(['me.playlists', { limit: 5 }], {
		getNextPageParam: lastPage => lastPage.cursor ?? undefined
	});

	const [selectedPlaylist, setSelectedPlaylist] = useState<
		ResponseData[number] | null
	>(null);

	const [query, setQuery] = useState('');
	const debouncedQuery: string = useDebounce<string>(query, 1000);
	const tagsInputRef = useRef<HTMLInputElement>(null);

	const createPlaylist = trpc.useMutation('playlists.create');

	const form = useForm<Schema>({
		resolver: zodResolver(createPlaylistInput)
	});

	const createPlaylistLoading =
		form.formState.isSubmitting || createPlaylist.isLoading;

	const utils = trpc.useContext();
	const onSubmit = async (data: Schema) => {
		try {
			await createPlaylist.mutateAsync(data);
			await utils.invalidateQueries(['me.playlists']);

			form.reset({ id: '', tags: [] });
			setSelectedPlaylist(null);
		} catch {}
	};

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
						<div className="mt-10">
							<form onSubmit={form.handleSubmit(onSubmit)} className="mt-4">
								<Controller
									control={form.control}
									name="id"
									defaultValue=""
									render={({ field, formState }) => (
										<>
											<Listbox
												value={field.value}
												onChange={id => {
													field.onChange(id);

													const relatedPlaylist = getPlaylists.data.pages
														.flatMap(page => page.data)
														.find(playlist => playlist.id === id);

													if (relatedPlaylist) {
														setSelectedPlaylist(relatedPlaylist);
													}
												}}
												as="div"
												className="relative"
											>
												{({ open }) => (
													<>
														<Listbox.Label className="text-lg">
															Playlist
														</Listbox.Label>
														<p className="text-[#989898] text-sm">
															Pick a playlist
														</p>
														<Listbox.Button className="w-full mt-2 bg-[#292929] px-4 h-10 rounded-md flex items-center justify-between">
															<span>{selectedPlaylist?.name}</span>
															{open ? <FaChevronUp /> : <FaChevronDown />}
														</Listbox.Button>
														<Listbox.Options className="mt-1 rounded-md divide-y divide-[#3c3c3c] overflow-y-auto max-h-60 absolute w-full z-10 border border-[#3c3c3c]">
															{getPlaylists.data?.pages.map((group, i) => (
																<Fragment key={i}>
																	{group.data.map(playlist => (
																		<Listbox.Option
																			key={playlist.id}
																			value={playlist.id}
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
																		<Spinner className="text-[#3c3c3c] fill-white w-5 h-5" />
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
								<div className="mt-6">
									<Controller
										control={form.control}
										name="tags"
										defaultValue={[]}
										render={({ field, formState }) => (
											<>
												<Combobox
													value={field.value}
													onChange={tag => {
														field.onChange(tag);
														setQuery('');

														if (tagsInputRef.current) {
															tagsInputRef.current.value = '';
															tagsInputRef.current.focus();
														}
													}}
													multiple
													as="div"
													className="relative"
												>
													<Combobox.Label className="text-lg">
														Tags
													</Combobox.Label>

													<p className="text-[#989898] text-sm">
														Add some tags that relate to the playlist
													</p>

													{field.value.length ? (
														<div className="flex gap-2 mt-2 flex-wrap">
															{field.value.map(tag => (
																<div
																	key={tag}
																	className="bg-[#292929] pl-3 pr-1 py-1 rounded-md flex items-center gap-x-2"
																>
																	<span className="text-sm">{tag}</span>
																	<button
																		type="button"
																		className="bg-[#3c3c3c] hover:bg-[#686868] transition-colors rounded-md p-1"
																		onClick={() => {
																			const currentTags =
																				form.getValues('tags');
																			form.setValue(
																				'tags',
																				currentTags.filter(
																					currentTag => currentTag !== tag
																				)
																			);
																		}}
																	>
																		<MdClose />
																	</button>
																</div>
															))}
														</div>
													) : null}

													<Combobox.Input
														onChange={e => setQuery(e.target.value)}
														className="w-full bg-[#292929] px-4 h-10 rounded-md flex items-center justify-between focus:outline-none mt-2"
														ref={tagsInputRef}
														placeholder="Chill, Happy, Young, etc."
													/>

													<Combobox.Options
														className={clsx(
															'mt-1 rounded-md divide-y divide-gray-800 overflow-y-auto max-h-60 absolute w-full',
															{
																'border border-[#3c3c3c]':
																	query && debouncedQuery
															},
															{ 'border-0': !query || !debouncedQuery }
														)}
													>
														{query && debouncedQuery ? (
															<TagOptions
																query={debouncedQuery}
																except={form.getValues('tags')}
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
										disabled={createPlaylistLoading}
										className={clsx(
											'bg-white px-6 py-2 text-[#151515] rounded-md hover:bg-gray-200 transition-colors font-bold disabled:opacity-50',
											{ 'flex gap-x-2 items-center': true }
										)}
									>
										{createPlaylistLoading ? (
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
						</div>
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

			{/* TODO: Tambah transisi */}
			{!createPlaylistLoading && createPlaylist.isSuccess ? (
				<Toast.Provider duration={4000}>
					<Toast.Root className="px-4 py-3 rounded-md bg-white text-[#151515]">
						<Toast.Title className="font-medium">Awesome!</Toast.Title>
						<Toast.Close
							aria-label="Close"
							className="absolute top-2 right-2 rounded-md border border-gray-500 hover:bg-gray-200 p-[0.1rem]"
						>
							<MdClose aria-hidden />
						</Toast.Close>
						<Toast.Description className="text-gray-600 text-sm">
							Your playlist was successfully submitted.
						</Toast.Description>
					</Toast.Root>

					<Toast.Viewport className="fixed bottom-5 right-4" />
				</Toast.Provider>
			) : null}
		</main>
	);
};

export default Submit;
