import { Listbox } from '@headlessui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import clsx from 'clsx';
import type { NextPage } from 'next';
import Image from 'next/image';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaChevronDown } from 'react-icons/fa';
import { SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { trpc } from '../utils/trpc';

const schema = z.object({
	id: z.string().min(1, { message: 'You must select one of your playlist' }),
	tags: z
		.array(z.string())
		.min(1, { message: 'You must include at least one tag' })
});

type Schema = z.infer<typeof schema>;

const Submit: NextPage = () => {
	const { data, isLoading, error } = trpc.useQuery(['playlists.getAll']);
	const form = useForm<Schema>({ resolver: zodResolver(schema) });
	const [selectedPlaylist, setSelectedPlaylist] =
		useState<SimplifiedPlaylist | null>(null);

	const onSubmit = () => {
		console.log('submitted');
	};

	if (isLoading) {
		return <p>Loading...</p>;
	}

	if (error) {
		return <p>Something went wrong</p>;
	}

	return (
		<main className="max-w-2xl mx-auto">
			<h1 className="text-white text-4xl font-bold mt-14 text-center">
				Submit your playlist
			</h1>
			<p className="mt-4 text-gray-400 font-medium text-center">
				Choose one of your public playlists and give it some tags to help folks
				finding it
			</p>
			<form onSubmit={form.handleSubmit(onSubmit)} className="mt-10">
				<div>
					<label htmlFor="playlist" className="text-lg">
						Playlist
					</label>
					<p className="text-gray-500 text-sm mt-1">Choose a playlist</p>
					<Listbox value={selectedPlaylist} onChange={setSelectedPlaylist}>
						<Listbox.Button className="w-full mt-2 bg-gray-900 px-4 h-10 rounded-md flex items-center justify-between">
							<span>{selectedPlaylist?.name}</span>
							<FaChevronDown />
						</Listbox.Button>
						<Listbox.Options className="mt-1 rounded-md overflow-hidden divide-y divide-gray-800">
							{data?.items.length
								? data.items.map(playlist => (
										<Listbox.Option
											key={playlist.id}
											value={playlist}
											as={Fragment}
										>
											{({ selected }) => (
												<li
													className={clsx(
														'px-4 h-20 hover:bg-gray-800 cursor-pointer flex items-center gap-x-4',
														{ 'bg-gray-800': selected },
														{ 'bg-gray-900': !selected }
													)}
												>
													{playlist.images.length && playlist.images[0]?.url ? (
														<Image
															src={playlist.images[0].url}
															alt="Playlist image"
															width={48}
															height={48}
															className="object-cover rounded-md"
														/>
													) : null}
													<div>
														<h1 className="block">{playlist.name}</h1>
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
								  ))
								: null}
						</Listbox.Options>
					</Listbox>

					{/* <Combobox value={selectedPerson} onChange={setSelectedPerson}>
						<Combobox.Button as="div">
							<Combobox.Input
								onChange={event => setQuery(event.target.value)}
								className="w-full mt-2 h-10 bg-gray-900 px-4 rounded-md"
							/>
						</Combobox.Button>
						<Combobox.Options className="bg-gray-900 mt-3 rounded-md overflow-hidden">
							{filteredPeople.map(person => (
								<Combobox.Option
									key={person}
									value={person}
									className="px-4 py-3 hover:bg-gray-800 hover:cursor-pointer"
								>
									{person}
								</Combobox.Option>
							))}
						</Combobox.Options>
					</Combobox> */}
					{form.formState.errors.id?.message ? (
						<p className="text-red-600 mt-2">
							{form.formState.errors.id?.message}
						</p>
					) : null}
				</div>
				<div className="mt-6">
					<label htmlFor="playlist" className="text-lg">
						Tags
					</label>
					<p className="text-gray-500 text-sm mt-1">
						Add some tags that relates to your playlist
					</p>
					<input
						type="text"
						{...form.register('tags')}
						className="w-full mt-2 h-10 bg-gray-900 px-4 rounded-md"
					/>
					{form.formState.errors.tags?.message ? (
						<p className="text-red-600 mt-2">
							{form.formState.errors.tags?.message}
						</p>
					) : null}
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
		</main>
	);
};

export default Submit;
