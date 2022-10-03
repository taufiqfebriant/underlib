import Image from 'next/future/image';
import { useRouter } from 'next/router';
import { BiLinkExternal } from 'react-icons/bi';
import { FaSpotify } from 'react-icons/fa';
import { MdPerson } from 'react-icons/md';
import { getLayout } from '../../components/Layout';
import Spinner from '../../components/Spinner';
import { trpc } from '../../utils/trpc';
import type { NextPageWithLayout } from '../_app';

const Playlist: NextPageWithLayout = () => {
	const router = useRouter();
	const id = router.query.id as string;

	if (!id) {
		return <p>You must include a playlist ID</p>;
	}

	const getPlaylist = trpc.useQuery(['playlists.byId', { id }]);

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
			<div className="flex max-h-[225px] items-center gap-x-8">
				{getPlaylist.data?.data.images[0] ? (
					<div className="relative h-[225px] w-[225px] overflow-hidden rounded-md">
						<Image
							src={getPlaylist.data?.data.images[0].url}
							alt="Playlist image"
							className="h-auto w-full object-cover"
							sizes="(min-width: 768px) 50vw,
							100vw"
							fill={true}
						/>
					</div>
				) : null}

				<div className="flex-1">
					<h1 className="text-5xl font-bold">{getPlaylist.data?.data.name}</h1>

					{getPlaylist.data?.data.description ? (
						<p
							className="mt-2 text-[#989898]"
							dangerouslySetInnerHTML={{
								__html: getPlaylist.data?.data.description
							}}
						/>
					) : null}

					<div className="mt-4 flex gap-x-2">
						{getPlaylist.data?.data.tags.map(tag => (
							<div
								key={tag.name}
								className="whitespace-nowrap rounded-md bg-[#292929] px-2 py-1 text-sm"
							>
								{tag.name}
							</div>
						))}
					</div>

					<div className="mt-8 flex items-center gap-x-2">
						{getPlaylist.data?.data.owner.images?.length &&
						getPlaylist.data.data.owner.images[0]?.url ? (
							<Image
								src={getPlaylist.data.data.owner.images[0]?.url}
								alt={
									getPlaylist.data.data.owner.display_name ??
									getPlaylist.data.data.owner.id
								}
								width={32}
								height={32}
								className="rounded-full"
							/>
						) : (
							<div className="rounded-full bg-[#292929] p-1 text-2xl">
								<MdPerson />
							</div>
						)}
						<p>{getPlaylist.data?.data.owner.display_name}</p>
					</div>
				</div>
			</div>
			<div className="mt-6 flex items-center justify-between">
				<p>{getPlaylist.data?.data.tracks.total} songs</p>

				<a
					href={getPlaylist.data?.data.external_urls.spotify}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center justify-between gap-x-6 rounded-md bg-[#1ed760] py-2 px-4 transition-opacity hover:opacity-90"
				>
					<div className="flex items-center gap-x-2">
						<FaSpotify />
						<span className="font-medium">Open on Spotify</span>
					</div>
					<BiLinkExternal />
				</a>
			</div>
			<div className="mt-4">
				{getPlaylist.data?.data.tracks.items.map((item, index) => (
					<div
						key={item.track?.id}
						className="flex h-16 items-center gap-x-6 rounded-md px-4 transition-colors hover:bg-[#292929]"
					>
						<p className="w-4 font-medium text-[#989898]">{index + 1}</p>
						<div>
							<h1>{item.track?.name}</h1>
							<p className="text-sm text-[#989898]">
								{item.track?.artists.flatMap(artist => artist.name).join(', ')}
							</p>
						</div>
					</div>
				))}
			</div>
		</>
	);
};

Playlist.getLayout = getLayout;

export default Playlist;
