import { NextPage } from 'next';
import Image from 'next/future/image';
import { useRouter } from 'next/router';
import { Container } from '../../components/Container';
import Spinner from '../../components/Spinner';
import { trpc } from '../../utils/trpc';

const PlaylistTracksPage: NextPage = () => {
	const router = useRouter();
	const id = router.query.id as string;

	if (!id) {
		return <p>You must include a playlist ID</p>;
	}

	const getPlaylist = trpc.useQuery(['playlists.byId', { id }]);

	if (getPlaylist.isLoading) {
		return (
			<Container as="main" className="mt-32 mb-10 flex justify-center md:mt-28">
				<Spinner className="h-6 w-6 fill-white text-[#292929] md:h-8 md:w-8" />
			</Container>
		);
	}

	if (getPlaylist.isError) {
		return (
			<Container as="main" className="mt-32 mb-10 md:mt-28">
				<h1 className="text-2xl font-bold">Something went wrong</h1>
				<p className="mt-2 font-medium text-[#989898]">
					We&apos;re really sorry. Please try to refresh the page.
				</p>
			</Container>
		);
	}

	return (
		<Container as="main" className="mt-32 mb-10 md:mt-28">
			<div className="flex">
				{getPlaylist.data?.data.images[0] ? (
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
				) : null}

				<h1 className="text-4xl font-bold">{getPlaylist.data?.data.name}</h1>
			</div>
		</Container>
	);
};

export default PlaylistTracksPage;
