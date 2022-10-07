import { Combobox, Listbox } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Toast from '@radix-ui/react-toast';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import Image from 'next/future/image';
import Head from 'next/head';
import type { ReactNode } from 'react';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { useInView } from 'react-intersection-observer';
import type { z } from 'zod';
import { getLayout } from '../components/Layout';
import { useSignInDialogStore } from '../components/SignInDialog';
import Spinner from '../components/Spinner';
import { appName } from '../constants/general';
import { playlistsCreateSchema } from '../schema/playlists.schema';
import type { inferQueryOutput } from '../utils/trpc';
import { trpc } from '../utils/trpc';
import type { NextPageWithLayout } from './_app';

const meta = {
	title: `Submit your playlist - ${appName}`,
	description:
		'Pick one of your public playlists and give it some tags to help others find it'
};

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
			<Combobox.Options className="absolute mt-2 max-h-60 w-full divide-y divide-gray-800 overflow-y-auto rounded-md border border-[#3c3c3c]">
				<Combobox.Option
					value={props.query}
					className={`${defaultClasses} transition-colors hover:bg-[#3c3c3c]`}
				>
					Create &quot;{props.query}&quot;
				</Combobox.Option>
			</Combobox.Options>
		);
	}

	return (
		<Combobox.Options className="absolute mt-2 max-h-60 w-full divide-y divide-gray-800 overflow-y-auto rounded-md border border-[#3c3c3c]">
			{getTags.data?.data.map(tag => (
				<Combobox.Option
					key={tag}
					value={tag}
					className={`${defaultClasses} transition-colors hover:bg-[#3c3c3c]`}
				>
					{tag}
				</Combobox.Option>
			))}
		</Combobox.Options>
	);
};

type Schema = z.infer<typeof playlistsCreateSchema>;

type Playlist = inferQueryOutput<'me.playlists'>['data'][number];

const Content = () => {
	const getPlaylists = trpc.useInfiniteQuery(['me.playlists', { limit: 5 }], {
		getNextPageParam: lastPage => lastPage.cursor ?? undefined
	});

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

	const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
		null
	);

	const [query, setQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const tagsInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedQuery(query), 1000);

		return () => clearTimeout(handler);
	}, [query]);

	const createPlaylist = trpc.useMutation('playlists.create');

	const form = useForm<Schema>({
		resolver: zodResolver(playlistsCreateSchema)
	});

	const createPlaylistLoading =
		form.formState.isSubmitting || createPlaylist.isLoading;

	const utils = trpc.useContext();
	const onSubmit = async (data: Schema) => {
		try {
			await createPlaylist.mutateAsync(data);
			await utils.invalidateQueries(['me.playlists']);
			await utils.invalidateQueries(['playlists.all']);
			await utils.invalidateQueries(['me.submittedPlaylists']);

			form.reset({ id: '', tags: [] });
			setSelectedPlaylist(null);
		} catch {}
	};

	if (getPlaylists.isLoading) {
		return (
			<div className="flex justify-center">
				<Spinner className="h-6 w-6 fill-white text-[#3c3c3c] md:h-8 md:w-8" />
			</div>
		);
	}

	if (getPlaylists.error) {
		return <p className="text-center">Something went wrong</p>;
	}

	if (!getPlaylists.data?.pages[0]?.data.length) {
		return (
			<>
				<h1 className="text-center text-5xl font-bold text-white">Oh no!</h1>
				<p className="mt-2 text-center text-[#989898]">
					You don&apos;t have a playlist to submit.
				</p>
				<div className="mx-auto mt-8 max-w-2xl">
					<p>There are several possibilities:</p>
					<ul className="ml-4 list-outside list-disc font-medium">
						<li className="mt-1">You already submit them all.</li>
						<li>You&apos;re not the owner of the playlist.</li>
						<li>
							Your playlist visibility is private or you have not added it to
							your profile yet.{' '}
							<span className="font-normal text-[#989898]">
								Make sure your playlist is set to public and{' '}
								<a
									href="https://allthings.how/how-to-add-playlists-to-your-spotify-profile"
									target="_blank"
									rel="noreferrer"
									className="font-medium underline"
								>
									added to your profile
								</a>
							</span>
						</li>
					</ul>
				</div>
			</>
		);
	}

	return (
		<>
			<div className="mx-auto max-w-2xl">
				<h1 className="text-center text-3xl font-bold text-white lg:text-4xl">
					Submit your playlist
				</h1>
				<p className="mt-4 text-center font-medium text-[#989898]">
					{meta.description}
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
									>
										{({ open }) => (
											<>
												<Listbox.Label className="text-base lg:text-lg">
													Playlist
												</Listbox.Label>
												<p className="text-sm text-[#989898]">
													Pick a playlist
												</p>
												<Listbox.Button className="mt-2 flex h-10 w-full items-center justify-between rounded-md bg-[#292929] px-4">
													<span>{selectedPlaylist?.name}</span>
													{open ? <FaChevronUp /> : <FaChevronDown />}
												</Listbox.Button>
												<Listbox.Options className="mt-1 max-h-60 divide-y divide-[#3c3c3c] overflow-y-auto rounded-md border border-[#3c3c3c]">
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
																				<div className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-md">
																					<Image
																						src={playlist.images[0].url}
																						alt="Playlist image"
																						className="object-cover"
																						fill
																						sizes="100%"
																					/>
																				</div>
																			) : null}
																			<div className="overflow-hidden">
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

													{getPlaylists.hasNextPage &&
													!getPlaylists.isFetchingNextPage ? (
														<li ref={inView.ref} />
													) : null}

													{getPlaylists.isFetchingNextPage ? (
														<li className="flex h-20 items-center justify-center bg-[#292929]">
															<Spinner className="h-5 w-5 fill-white text-[#3c3c3c]" />
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
												setDebouncedQuery('');

												if (tagsInputRef.current) {
													tagsInputRef.current.value = '';
													tagsInputRef.current.focus();
												}
											}}
											multiple
											as="div"
											className="relative"
										>
											<Combobox.Label className="text-base lg:text-lg">
												Tags
											</Combobox.Label>

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
												placeholder="Search tags"
											/>

											{query && debouncedQuery ? (
												<TagOptions
													query={debouncedQuery}
													except={form.getValues('tags')}
												/>
											) : null}
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
					<Toast.Root className="relative rounded-md bg-white px-4 py-3 text-[#151515]">
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

					<Toast.Viewport className="fixed bottom-0 right-0 w-96 max-w-[100vw] p-6" />
				</Toast.Provider>
			) : null}
		</>
	);
};

const Submit: NextPageWithLayout = () => {
	const session = useSession();
	const signInDialogStore = useSignInDialogStore();
	const [isInitialRender, setIsInitialRender] = useState(true);

	useEffect(() => {
		if (session.status === 'loading') return;

		if (session.status === 'unauthenticated' && isInitialRender) {
			setIsInitialRender(false);
			signInDialogStore.setIsOpen(true);
		}
	}, [isInitialRender, session.status, signInDialogStore]);

	let content: ReactNode = <Content />;

	if (session.status === 'loading') {
		content = (
			<div className="flex justify-center">
				<Spinner className="h-6 w-6 fill-white text-[#292929] md:h-8 md:w-8" />
			</div>
		);
	}

	if (session.status === 'unauthenticated') {
		content = null;
	}

	return (
		<>
			<Head>
				<title>{meta.title}</title>
				<meta name="description" content={meta.description} />
				<meta name="robots" content="noindex, nofollow" />

				<meta property="og:title" content={meta.title} />
				<meta property="og:description" content={meta.description} />

				<meta name="twitter:title" content={meta.title} />
				<meta name="twitter:description" content={meta.description} />
			</Head>
			{content}
		</>
	);
};

Submit.getLayout = getLayout;

export default Submit;
