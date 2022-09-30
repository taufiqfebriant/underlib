import { Combobox, Listbox } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Toast from '@radix-ui/react-toast';
import clsx from 'clsx';
import Image from 'next/image';
import { Fragment, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaChevronDown, FaChevronUp, FaExternalLinkAlt } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';
import { getLayout } from '../components/Layout';
import Spinner from '../components/Spinner';
import { useDebounce } from '../hooks/use-debounce';
import { ResponseData } from '../server/router/me.playlists';
import { trpc } from '../utils/trpc';
import { NextPageWithLayout } from './_app';

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
				className={`${defaultClasses} transition-colors hover:bg-[#3c3c3c]`}
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
					className={`${defaultClasses} transition-colors hover:bg-[#3c3c3c]`}
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

const Submit: NextPageWithLayout = () => {
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
			<main className="flex min-h-screen items-center justify-center">
				<Spinner className="h-8 w-8 fill-white text-[#292929]" />
			</main>
		);
	}

	if (getPlaylists.error) {
		return <p>Something went wrong</p>;
	}

	if (!getPlaylists.data?.pages[0]?.data.length) {
		return (
			<main className="mt-36 max-w-6xl px-6">
				<h1 className="mt-14 text-center text-3xl font-bold text-white">
					Oh no!
				</h1>
				<p className="mt-2 text-center text-[#989898]">
					You don&apos;t have a playlist to submit.
				</p>
				<div className="mt-4">
					<p>What should i do?</p>
					<ul className="list-inside list-disc">
						<li>
							Make sure your playlist is set to public and added to your
							profile. Tutorial:{' '}
							<a
								href="https://allthings.how/how-to-add-playlists-to-your-spotify-profile"
								rel="noreferrer"
								target="_blank"
								className="flex items-center gap-x-2 text-cyan-600 hover:underline"
							>
								<span>
									How to Add Playlists to Your Spotify Profile - All Things How
								</span>
								<FaExternalLinkAlt />
							</a>
						</li>
					</ul>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto flex min-h-screen max-w-2xl items-center">
			<div className="w-full">
				<h1 className="text-center text-4xl font-bold text-white">
					Submit your playlist
				</h1>
				<p className="mt-4 text-center font-medium text-[#989898]">
					Pick one of your public playlists and give it some tags to help others
					find it
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
												<p className="text-sm text-[#989898]">
													Pick a playlist
												</p>
												<Listbox.Button className="mt-2 flex h-10 w-full items-center justify-between rounded-md bg-[#292929] px-4">
													<span>{selectedPlaylist?.name}</span>
													{open ? <FaChevronUp /> : <FaChevronDown />}
												</Listbox.Button>
												<Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full divide-y divide-[#3c3c3c] overflow-y-auto rounded-md border border-[#3c3c3c]">
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
																				`flex h-20 cursor-pointer items-center gap-x-4 px-4 transition-colors hover:bg-[#3c3c3c]`,
																				{
																					'bg-[#3c3c3c]': selected || active
																				},
																				{
																					'bg-[#292929]': !selected && !active
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
																					className="rounded-md object-cover"
																				/>
																			) : null}
																			<div>
																				<h1 className="block">
																					{playlist.name}
																				</h1>
																				{playlist.description ? (
																					<p
																						className="truncate text-sm text-[#989898]"
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
														<li className="flex h-20 items-center justify-center bg-[#292929]">
															{getPlaylists.isFetchingNextPage ? (
																<Spinner className="h-5 w-5 fill-white text-[#3c3c3c]" />
															) : null}

															{getPlaylists.hasNextPage &&
															!getPlaylists.isFetchingNextPage ? (
																<>
																	<button
																		type="button"
																		className="rounded-md bg-[#3c3c3c] px-4 py-2 transition-colors hover:bg-[#686868]"
																		onClick={async () =>
																			await getPlaylists.fetchNextPage()
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
										<p className="mt-2 text-red-600">
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
											<Combobox.Label className="text-lg">Tags</Combobox.Label>

											<p className="text-sm text-[#989898]">
												Add some tags that relate to the playlist
											</p>

											{field.value.length ? (
												<div className="mt-2 flex flex-wrap gap-2">
													{field.value.map(tag => (
														<div
															key={tag}
															className="flex items-center gap-x-2 rounded-md bg-[#292929] py-1 pl-3 pr-1"
														>
															<span className="text-sm">{tag}</span>
															<button
																type="button"
																className="rounded-md bg-[#3c3c3c] p-1 transition-colors hover:bg-[#686868]"
																onClick={() => {
																	const currentTags = form.getValues('tags');
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
												className="mt-2 flex h-10 w-full items-center justify-between rounded-md bg-[#292929] px-4 focus:outline-none"
												ref={tagsInputRef}
												placeholder="Chill, Happy, Young, etc."
											/>

											<Combobox.Options
												className={clsx(
													'absolute mt-1 max-h-60 w-full divide-y divide-gray-800 overflow-y-auto rounded-md',
													{
														'border border-[#3c3c3c]': query && debouncedQuery
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
											<p className="mt-2 text-red-600">
												{form.formState.errors.tags?.message}
											</p>
										) : null}
									</>
								)}
							/>
						</div>
						<div className="mt-6 flex justify-end">
							<button
								type="submit"
								disabled={createPlaylistLoading}
								className={clsx(
									'rounded-md bg-white px-6 py-2 font-bold text-[#151515] transition-colors hover:bg-gray-200 disabled:opacity-50',
									{ 'flex items-center gap-x-2': true }
								)}
							>
								{createPlaylistLoading ? (
									<>
										<Spinner className="h-5 w-5 fill-[#151515] text-[#989898]" />
										<span>Submitting...</span>
									</>
								) : (
									<span>Submit</span>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>

			{/* TODO: Tambah transisi */}
			{!createPlaylistLoading && createPlaylist.isSuccess ? (
				<Toast.Provider duration={4000}>
					<Toast.Root className="rounded-md bg-white px-4 py-3 text-[#151515]">
						<Toast.Title className="font-medium">Awesome!</Toast.Title>
						<Toast.Close
							aria-label="Close"
							className="absolute top-2 right-2 rounded-md border border-gray-500 p-[0.1rem] hover:bg-gray-200"
						>
							<MdClose aria-hidden />
						</Toast.Close>
						<Toast.Description className="text-sm text-gray-600">
							Your playlist was successfully submitted.
						</Toast.Description>
					</Toast.Root>

					<Toast.Viewport className="fixed bottom-5 right-4" />
				</Toast.Provider>
			) : null}
		</main>
	);
};

Submit.getLayout = getLayout;

export default Submit;
