import { Combobox } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Toast from '@radix-ui/react-toast';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import Image from 'next/future/image';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';
import { getLayout } from '../../../components/Layout';
import { useSignInDialogStore } from '../../../components/SignInDialog';
import Spinner from '../../../components/Spinner';
import { appName } from '../../../constants/general';
import { trpc } from '../../../utils/trpc';
import type { NextPageWithLayout } from '../../_app';

const schema = z.object({
	tags: z
		.array(z.string())
		.min(1, { message: 'You must include at least one tag' })
		.refine(array => new Set([...array]).size === array.length)
});

type Schema = z.infer<typeof schema>;

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

type ContentProps = {
	id: string;
};

const Content = (props: ContentProps) => {
	const session = useSession();

	const [query, setQuery] = useState('');
	const [debouncedQuery, setDebouncedQuery] = useState(query);
	const tagsInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handler = setTimeout(() => setDebouncedQuery(query), 1000);

		return () => clearTimeout(handler);
	}, [query]);

	const getPlaylist = trpc.useQuery(['playlists.byId', { id: props.id }]);
	const updatePlaylist = trpc.useMutation('playlists.update');

	const form = useForm<Schema>({ resolver: zodResolver(schema) });

	const updatingPlaylist =
		form.formState.isSubmitting || updatePlaylist.isLoading;

	const onSubmit = async (data: Schema) => {
		try {
			await updatePlaylist.mutateAsync({
				id: props.id,
				tags: data.tags
			});
		} catch {}
	};

	if (getPlaylist.isLoading) {
		return (
			<div className="flex justify-center">
				<Spinner className="h-6 w-6 fill-white text-[#292929] md:h-8 md:w-8" />
			</div>
		);
	}

	if (getPlaylist.error?.data?.code === 'NOT_FOUND') {
		return (
			<div className="text-center">
				<h1 className="text-2xl font-bold">Playlist not found</h1>
				<p className="mt-2 font-medium text-[#989898]">
					We can&apos;t find the playlist with the given ID.
				</p>
			</div>
		);
	}

	if (getPlaylist.isError) {
		return (
			<div className="text-center">
				<h1 className="text-2xl font-bold">Something went wrong</h1>
				<p className="mt-2 font-medium text-[#989898]">
					We&apos;re really sorry. Please try to refresh the page.
				</p>
			</div>
		);
	}

	if (getPlaylist.data?.data.owner.id !== session.data?.user.id) {
		return (
			<div className="text-center">
				<h1 className="text-2xl font-bold">Unauthorized action</h1>
			</div>
		);
	}

	const meta = {
		title: `Edit "${getPlaylist.data?.data.name}" - ${appName}`,
		description: getPlaylist.data?.data.description,
		image: getPlaylist.data?.data.images[0]?.url
	};

	return (
		<>
			<Head>
				<title>{meta.title}</title>
				<meta name="robots" content="noindex, nofollow" />
				<meta property="og:title" content={meta.title} />
				<meta name="twitter:title" content={meta.title} />

				{meta.description ? (
					<>
						<meta name="description" content={meta.description} />
						<meta property="og:description" content={meta.description} />
						<meta name="twitter:description" content={meta.description} />
					</>
				) : null}

				{meta.image ? (
					<>
						<meta property="og:image" content={meta.image} />
						<meta name="twitter:image" content={meta.image} />
					</>
				) : null}
			</Head>

			<div className="mx-auto max-w-2xl">
				<h1 className="text-center text-3xl font-bold lg:text-4xl">
					Edit playlist
				</h1>

				{getPlaylist.data?.data.images[0] ? (
					<div className="mt-10 flex justify-center">
						<div className="relative h-[200px] w-[200px] overflow-hidden rounded-md">
							<Image
								src={getPlaylist.data?.data.images[0].url}
								alt="Playlist image"
								className="h-auto w-full object-cover"
								sizes="100%"
								fill
							/>
						</div>
					</div>
				) : null}

				<h2 className="mt-4 text-center text-xl font-bold lg:text-2xl">
					{getPlaylist.data?.data.name}
				</h2>

				{getPlaylist.data?.data.description ? (
					<p
						className="mt-2 text-center text-[#989898]"
						dangerouslySetInnerHTML={{
							__html: getPlaylist.data?.data.description
						}}
					/>
				) : null}

				<form onSubmit={form.handleSubmit(onSubmit)}>
					<Controller
						control={form.control}
						name="tags"
						defaultValue={getPlaylist.data?.data.tags.flatMap(tag => tag.name)}
						render={({ field, formState }) => (
							<>
								<Combobox
									value={field.value}
									onChange={tags => {
										field.onChange(tags);
										setQuery('');
										setDebouncedQuery('');

										if (tagsInputRef.current) {
											tagsInputRef.current.value = '';
											tagsInputRef.current.focus();
										}
									}}
									multiple
								>
									<Combobox.Label className="mt-6 inline-block text-base lg:text-lg">
										Tags
									</Combobox.Label>

									{field.value.length ? (
										<div className="mt-3 flex flex-wrap gap-2">
											{field.value.map(tag => (
												<div
													key={tag}
													className="flex items-center gap-x-2 rounded-md bg-[#292929] py-1 pl-3 pr-1"
												>
													<span className="text-sm">{tag}</span>
													<button
														type="button"
														className="rounded-md bg-[#3c3c3c] p-1 transition-colors hover:bg-[#686868]"
														onClick={() =>
															field.onChange(field.value.filter(t => t !== tag))
														}
													>
														<MdClose />
													</button>
												</div>
											))}
										</div>
									) : null}

									<Combobox.Input
										onChange={e => setQuery(e.target.value)}
										className="mt-2 h-10 w-full rounded-md bg-[#292929] px-4"
										placeholder="Search tags"
										ref={tagsInputRef}
									/>

									<Combobox.Options
										className={clsx(
											'max-h-60 divide-y divide-gray-800 overflow-y-auto rounded-md',
											{
												'mt-2 border border-[#3c3c3c]': query && debouncedQuery
											}
										)}
									>
										{query && debouncedQuery ? (
											<TagOptions query={debouncedQuery} except={field.value} />
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
					<div className="mt-6 flex justify-end">
						<button
							type="submit"
							disabled={updatingPlaylist}
							className={clsx(
								'rounded-md bg-white px-6 py-2 font-bold text-[#151515] transition-colors hover:bg-gray-200 disabled:opacity-50',
								{ 'flex items-center gap-x-2': true }
							)}
						>
							{updatingPlaylist ? (
								<>
									<Spinner className="h-5 w-5 fill-[#151515] text-[#989898]" />
									<span>Saving...</span>
								</>
							) : (
								<span>Save</span>
							)}
						</button>
					</div>
				</form>
			</div>
			{!updatingPlaylist && updatePlaylist.isSuccess ? (
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
							Your playlist was successfully updated.
						</Toast.Description>
					</Toast.Root>

					<Toast.Viewport className="fixed bottom-0 right-0 w-96 max-w-[100vw] p-6" />
				</Toast.Provider>
			) : null}
		</>
	);
};

const EditPlaylist: NextPageWithLayout = () => {
	const router = useRouter<'/playlists/[id]/edit'>();
	const [id, setId] = useState<string>();
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

	useEffect(() => {
		if (router.isReady && !id) {
			setId(router.query.id);
		}
	}, [id, router.isReady, router.query.id]);

	if (session.status === 'loading') {
		return (
			<div className="flex justify-center">
				<Spinner className="h-6 w-6 fill-white text-[#292929] md:h-8 md:w-8" />
			</div>
		);
	}

	if (session.status === 'unauthenticated') {
		return null;
	}

	return id ? <Content id={id} /> : null;
};

EditPlaylist.getLayout = getLayout;

export default EditPlaylist;
