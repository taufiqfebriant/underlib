import { Combobox } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import * as Toast from '@radix-ui/react-toast';
import clsx from 'clsx';
import Image from 'next/future/image';
import { useRouter } from 'next/router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';
import { getLayout } from '../../../components/Layout';
import Spinner from '../../../components/Spinner';
import { useDebounce } from '../../../hooks/use-debounce';
import { trpc } from '../../../utils/trpc';
import type { NextPageWithLayout } from '../../_app';

const schema = z.object({
	tags: z
		.array(z.string())
		.min(1, { message: 'You must include at least one tag' })
		.refine(array => new Set([...array]).size === array.length)
});

type Schema = z.infer<typeof schema>;

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

// TODO: redirect ke beranda jika belum login atau pengguna bukan pemilik playlist
const EditPlaylist: NextPageWithLayout = () => {
	const router = useRouter();
	const id = router.query.id as string;

	const [query, setQuery] = useState('');
	const debouncedQuery: string = useDebounce<string>(query, 1000);
	const tagsInputRef = useRef<HTMLInputElement>(null);

	const getPlaylist = trpc.useQuery(['playlists.byId', { id }]);
	const updatePlaylist = trpc.useMutation('playlists.update');

	const form = useForm<Schema>({ resolver: zodResolver(schema) });

	const updatingPlaylist =
		form.formState.isSubmitting || updatePlaylist.isLoading;

	const onSubmit = async (data: Schema) => {
		try {
			await updatePlaylist.mutateAsync({
				id: id,
				tags: data.tags
			});
		} catch {}
	};

	if (!id) {
		return <p>You must include a playlist ID</p>;
	}

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

	return (
		<>
			<div className="mx-auto max-w-2xl">
				{getPlaylist.data?.data.images[0] ? (
					<div className="flex justify-center">
						<div className="relative h-[200px] w-[200px] overflow-hidden rounded-md">
							<Image
								src={getPlaylist.data?.data.images[0].url}
								alt="Playlist image"
								className="h-auto w-full object-cover"
								sizes="(min-width: 768px) 50vw,
							100vw"
								fill={true}
							/>
						</div>
					</div>
				) : null}

				<h1 className="mt-4 text-center text-3xl font-bold">
					{getPlaylist.data?.data.name}
				</h1>

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

										if (tagsInputRef.current) {
											tagsInputRef.current.value = '';
											tagsInputRef.current.focus();
										}
									}}
									multiple
								>
									<Combobox.Label className="mt-6 inline-block">
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
									/>

									<Combobox.Options className="mt-2 max-h-60 divide-y divide-gray-800 overflow-y-auto rounded-md">
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
									<span>Submitting...</span>
								</>
							) : (
								<span>Submit</span>
							)}
						</button>
					</div>
				</form>
			</div>
			{!updatingPlaylist && updatePlaylist.isSuccess ? (
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
							Your playlist was successfully updated.
						</Toast.Description>
					</Toast.Root>

					<Toast.Viewport className="fixed bottom-5 right-4" />
				</Toast.Provider>
			) : null}
		</>
	);
};

EditPlaylist.getLayout = getLayout;

export default EditPlaylist;
