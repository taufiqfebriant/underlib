import { Combobox, Dialog, Popover } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { NextPage } from 'next';
import Image from 'next/image';
import { Fragment, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaEdit, FaEllipsisH, FaTrash } from 'react-icons/fa';
import { MdClose } from 'react-icons/md';
import { z } from 'zod';
import type { Playlist } from '../../server/router/me';
import { trpc } from '../../utils/trpc';

const schema = z.object({
	tags: z
		.array(z.string())
		.min(1, { message: 'You must include at least one tag' })
		.refine(array => new Set([...array]).size === array.length)
});

type Schema = z.infer<typeof schema>;

const TagOptions = ({ query, except }: { query: string; except: string[] }) => {
	const getTags = trpc.useQuery(['tags.all', { q: query, except }]);

	// TODO: pakek komponen "Spinner"
	if (getTags.isLoading) {
		return <p>Loading...</p>;
	}

	if (getTags.error) {
		return <p>Something went wrong</p>;
	}

	return (
		<>
			{getTags.data?.data.map(tag => (
				<Combobox.Option
					key={tag}
					value={tag}
					className="px-4 hover:bg-gray-700 cursor-pointer flex items-center gap-x-4 h-10 bg-gray-800 transition-all"
				>
					{tag}
				</Combobox.Option>
			))}
		</>
	);
};

enum Action {
	EditTags = 'EditTags',
	DeletePlaylist = 'DeletePlaylist'
}

const MyPlaylists: NextPage = () => {
	const getPlaylists = trpc.useInfiniteQuery(['me.playlists', { limit: 8 }]);
	const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(
		null
	);
	const [open, setOpen] = useState(false);
	const [action, setAction] = useState<Action | null>(null);
	const [query, setQuery] = useState('');
	const form = useForm<Schema>({ resolver: zodResolver(schema) });
	const updateTags = trpc.useMutation('playlists.update');
	const deletePlaylist = trpc.useMutation('playlists.delete');

	let dialogTitle = '';
	switch (action) {
		case Action.EditTags:
			dialogTitle = 'Edit Tags';
			break;
		case Action.DeletePlaylist:
			dialogTitle = 'Delete Playlist';
			break;
	}

	let selectedPlaylistPageIndex: number | null = null;

	getPlaylists.data?.pages.forEach((page, index) => {
		const relatedPlaylist = page.data.find(
			playlist => playlist.id === selectedPlaylist?.id
		);

		if (relatedPlaylist) {
			selectedPlaylistPageIndex = index;
		}
	});

	const confirmDeletePlaylist = async () => {
		try {
			if (selectedPlaylist) {
				await deletePlaylist.mutateAsync({ id: selectedPlaylist.id });
			}

			if (selectedPlaylistPageIndex !== null) {
				await getPlaylists.refetch({
					refetchPage: (_, index) => index === selectedPlaylistPageIndex
				});
			}

			setOpen(false);
		} catch {}
	};

	if (getPlaylists.isLoading) {
		return <p>Loading...</p>;
	}

	if (getPlaylists.error) {
		return <p>Something went wrong</p>;
	}

	const onSubmit = async (data: Schema) => {
		try {
			if (selectedPlaylist) {
				await updateTags.mutateAsync({
					id: selectedPlaylist.id,
					tags: data.tags
				});
			}

			if (selectedPlaylistPageIndex !== null) {
				await getPlaylists.refetch({
					refetchPage: (_, index) => index === selectedPlaylistPageIndex
				});
			}

			setOpen(false);
		} catch {}
	};

	return (
		<>
			<div className="my-10 flex">
				{getPlaylists.data?.pages.map((group, i) => (
					<Fragment key={i}>
						{group.data.map(playlist => (
							<div
								key={playlist.id}
								className="bg-gray-900 rounded-md overflow-hidden relative"
							>
								<Popover className="relative">
									<Popover.Button className="absolute top-2 right-2 z-10 bg-gray-900 p-2 rounded-md">
										<FaEllipsisH className="text-xs" />
									</Popover.Button>

									<Popover.Panel className="absolute z-10 top-10 right-2">
										<div className="flex flex-col bg-gray-900 divide-y divide-gray-800 rounded-md overflow-hidden">
											<Popover.Button
												className="px-4 py-2 text-xs text-left hover:bg-gray-800 transition-all flex items-center gap-x-2"
												onClick={() => {
													const relatedPlaylist = getPlaylists.data.pages
														.flatMap(page => page.data)
														.find(p => p.id === playlist.id);

													if (relatedPlaylist) {
														setSelectedPlaylist(relatedPlaylist);
														setAction(Action.EditTags);
														setOpen(true);
													}
												}}
											>
												<FaEdit />
												<span>Edit tags</span>
											</Popover.Button>
											<Popover.Button
												className="bg-gray-900 px-4 py-2 text-xs text-left hover:bg-gray-800 transition-all flex items-center gap-x-2 text-red-500"
												onClick={() => {
													const relatedPlaylist = getPlaylists.data.pages
														.flatMap(page => page.data)
														.find(p => p.id === playlist.id);

													if (relatedPlaylist) {
														setSelectedPlaylist(relatedPlaylist);
														setAction(Action.DeletePlaylist);
														setOpen(true);
													}
												}}
											>
												<FaTrash />
												<span>Delete</span>
											</Popover.Button>
										</div>
									</Popover.Panel>
								</Popover>
								{playlist.images[0] ? (
									<Image
										src={playlist.images[0].url}
										width={232}
										height={232}
										className="object-cover"
										alt="Playlist image"
									/>
								) : null}
								<div className="px-3 pt-2 pb-4">
									<h1 className="font-semibold">{playlist.name}</h1>
									<p className="text-sm text-gray-400">
										{playlist.owner.display_name}
									</p>
									<div className="flex gap-x-2 mt-4">
										{playlist.tags.map(tag => (
											<div
												key={tag}
												className="bg-gray-800 hover:bg-gray-700 transition-all rounded-md px-2 py-1 text-xs"
											>
												{tag}
											</div>
										))}
									</div>
								</div>
							</div>
						))}
					</Fragment>
				))}
			</div>
			<Dialog open={open} onClose={() => setOpen(false)}>
				<div className="fixed inset-0 bg-black/50" aria-hidden="true" />
				<div className="fixed inset-0 flex items-center justify-center p-4">
					<Dialog.Panel className="bg-gray-900 rounded-md px-6 py-4 max-w-2xl max-h-[42rem]">
						<Dialog.Title className="font-bold text-2xl">
							{dialogTitle}
						</Dialog.Title>
						{action === Action.EditTags ? (
							<>
								{selectedPlaylist?.images[0] ? (
									<div className="flex justify-center mt-4">
										<Image
											src={selectedPlaylist?.images[0].url}
											className="object-cover rounded-md"
											alt="Playlist image"
											width={128}
											height={128}
										/>
									</div>
								) : null}
								<h3 className="text-xl font-bold text-center mt-4">
									{selectedPlaylist?.name}
								</h3>
								<p className="mt-1 text-gray-400 text-sm">
									{selectedPlaylist?.description}
								</p>
								<form onSubmit={form.handleSubmit(onSubmit)}>
									<Controller
										control={form.control}
										name="tags"
										defaultValue={selectedPlaylist?.tags}
										render={({ field, formState }) => (
											<>
												{field.value.length ? (
													<div className="flex gap-2 mt-3 flex-wrap">
														{field.value.map(tag => (
															<div
																key={tag}
																className="bg-gray-800 pl-4 pr-1 py-1 rounded-full flex items-center gap-x-2"
															>
																<span className="text-sm">{tag}</span>
																<button
																	type="button"
																	className="bg-gray-700 hover:bg-gray-700 transition-all rounded-full p-1"
																	onClick={() =>
																		field.onChange(
																			field.value.filter(t => t !== tag)
																		)
																	}
																>
																	<MdClose />
																</button>
															</div>
														))}
													</div>
												) : null}
												<Combobox
													value={field.value}
													onChange={field.onChange}
													multiple
												>
													<Combobox.Input
														onChange={e => setQuery(e.target.value)}
														className="w-full bg-gray-800 px-4 h-10 rounded-md flex items-center justify-between focus:outline-none mt-2"
														placeholder="Chill, Happy, Young, etc."
													/>
													<Combobox.Options className="mt-1 rounded-md divide-y divide-gray-800 overflow-y-auto max-h-60">
														<TagOptions query={query} except={field.value} />
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
						) : null}

						{action === Action.DeletePlaylist ? (
							<>
								<p className="mt-4">
									Are you sure want to delete &quot;
									<span className="font-semibold">
										{selectedPlaylist?.name}
									</span>
									&quot; playlist?
								</p>
								<div className="flex gap-x-4 mt-4">
									<button
										type="submit"
										className="bg-red-500 w-1/2 rounded-md py-2"
										onClick={confirmDeletePlaylist}
									>
										Yes
									</button>
									<button
										type="button"
										className="bg-gray-800 w-1/2 rounded-md py-2"
									>
										No
									</button>
								</div>
							</>
						) : null}
					</Dialog.Panel>
				</div>
			</Dialog>
		</>
	);
};

export default MyPlaylists;
