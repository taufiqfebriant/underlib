import { Combobox, Dialog, Popover } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { NextPage } from 'next';
import Image from 'next/image';
import { Fragment, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { FaEdit, FaEllipsisH, FaTrash } from 'react-icons/fa';
import { z } from 'zod';
import { Playlist } from '../../server/router/me';
import { trpc } from '../../utils/trpc';

type DialogContentProps = {
	playlist: Playlist | undefined;
};

const schema = z.object({
	tags: z
		.array(z.string())
		.min(1, { message: 'You must include at least one tag' })
});

type Schema = z.infer<typeof schema>;

const tags = [
	'Love',
	'Deadline',
	'Heartbreak',
	'Growing Up',
	'Chill',
	'Midnight',
	'Move On',
	'Tired',
	'Hard Work',
	'Comeback',
	'Young',
	'Free'
];

const DialogContent = ({ playlist }: DialogContentProps) => {
	const getTags = trpc.useQuery(['tags.all', { q: undefined }]);
	const [selectedTags, setSelectedTags] = useState<typeof tags>([]);
	const tagsInputRef = useRef<HTMLInputElement>(null);
	const form = useForm<Schema>({ resolver: zodResolver(schema) });

	const [query, setQuery] = useState('');

	const filteredTags =
		query === '' && !selectedTags.length
			? tags
			: tags.filter(tag => {
					const selectedIds = selectedTags.length
						? selectedTags.map(selectedTag => selectedTag)
						: [];

					return (
						tag.toLowerCase().includes(query.toLowerCase()) &&
						!selectedIds.includes(tag)
					);
			  });

	const isNew =
		query.length > 0 &&
		!filteredTags.length &&
		!selectedTags
			.map(selectedTag => selectedTag.toLowerCase())
			.includes(query.toLowerCase());

	// TODO: pakek komponen "Spinner"
	if (getTags.isLoading) {
		return <p>Loading...</p>;
	}

	if (getTags.error) {
		return <p>Something went wrong</p>;
	}

	return (
		<div className="flex mt-4 gap-x-4 max-h-[240px] overflow-hidden">
			{playlist?.images[0] ? (
				<div className="w-[280px] h-[240px] relative">
					<Image
						src={playlist?.images[0].url}
						className="object-cover rounded-md"
						alt="Playlist image"
						layout="fill"
					/>
				</div>
			) : null}
			<div className="flex flex-col">
				<h3 className="text-xl font-bold">{playlist?.name}</h3>
				<p className="mt-1 text-gray-400 text-sm">{playlist?.description}</p>
				<Controller
					control={form.control}
					name="tags"
					render={({ field, formState }) => (
						<>
							<Combobox
								value={selectedTags}
								onChange={selectedTags => {
									field.onChange(selectedTags);
									setSelectedTags(selectedTags);

									if (tagsInputRef.current) {
										tagsInputRef.current.value = '';
										tagsInputRef.current.focus();
									}
								}}
								multiple
							>
								<Combobox.Input
									onChange={e => setQuery(e.target.value)}
									className="w-full bg-gray-800 px-4 h-10 rounded-md flex items-center justify-between focus:outline-none mt-2"
									ref={tagsInputRef}
									placeholder="Chill, Happy, Young, etc."
								/>
								<Combobox.Options className="mt-1 rounded-md divide-y divide-gray-800 max-h-  overflow-y-scroll">
									{isNew ? (
										<Combobox.Option
											value={{ id: null, name: query }}
											className="px-4 hover:bg-gray-700 cursor-pointer flex items-center gap-x-4 h-10 bg-gray-900 transition-all"
										>
											Create &quot;{query}&quot;
										</Combobox.Option>
									) : null}
									{filteredTags.map(tag => (
										<Combobox.Option
											key={tag}
											value={tag}
											className="px-4 hover:bg-gray-700 cursor-pointer flex items-center gap-x-4 h-10 bg-gray-800 transition-all"
										>
											{tag}
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
		</div>
	);
};

const MyPlaylists: NextPage = () => {
	const getPlaylists = trpc.useInfiniteQuery(['me.playlists', { limit: 8 }]);
	const [id, setId] = useState<string | null>(null);
	const [open, setOpen] = useState(false);
	const [title, setTitle] = useState('');

	const selectedPlaylist = getPlaylists.data?.pages
		.flatMap(page => page.data)
		.find(playlist => playlist.id === id);

	if (getPlaylists.isLoading) {
		return <p>Loading...</p>;
	}

	if (getPlaylists.error) {
		return <p>Something went wrong</p>;
	}

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
													setTitle('Edit tags');
													setId(playlist.id);
													setOpen(true);
												}}
											>
												<FaEdit />
												<span>Edit tags</span>
											</Popover.Button>
											<Popover.Button className="bg-gray-900 px-4 py-2 text-xs text-left hover:bg-gray-800 transition-all flex items-center gap-x-2 text-red-500">
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
						<Dialog.Title className="font-bold text-2xl">{title}</Dialog.Title>
						<DialogContent playlist={selectedPlaylist} />
					</Dialog.Panel>
				</div>
			</Dialog>
		</>
	);
};

export default MyPlaylists;
