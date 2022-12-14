import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { Fragment, useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
import { getLayout } from '../../components/Layout';
import { PlaylistCard } from '../../components/PlaylistCard';
import { useSignInDialogStore } from '../../components/SignInDialog';
import Spinner from '../../components/Spinner';
import { appName } from '../../constants/general';
import { trpc } from '../../utils/trpc';
import type { NextPageWithLayout } from '../_app';

const Content = () => {
	const getPlaylists = trpc.useInfiniteQuery(
		['me.submittedPlaylists', { limit: 10 }],
		{
			getNextPageParam: lastPage => lastPage.cursor ?? undefined
		}
	);

	const isLoading = getPlaylists.isLoading || getPlaylists.isFetchingNextPage;

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

	if (getPlaylists.isError) {
		return (
			<div className="w-full text-center">
				<h1 className="text-2xl font-bold">Something went wrong</h1>
				<p className="mt-2 font-medium text-[#989898]">
					We&apos;re really sorry. Please try to refresh the page.
				</p>
			</div>
		);
	}

	if (!getPlaylists.data?.pages[0]?.data.length && !isLoading) {
		return (
			<div className="w-full text-center">
				<h1 className="text-2xl font-bold">No playlists found</h1>
				<p className="mt-2 font-medium text-[#989898]">
					You haven&apos;t submit any playlist yet.
				</p>
			</div>
		);
	}

	return (
		<>
			<Head>
				<title>My Playlists - {appName}</title>
				<meta name="robots" content="noindex, nofollow" />
			</Head>

			<h1 className="text-3xl font-bold lg:text-4xl">My playlists</h1>

			<div className="mt-8 grid grid-cols-1 justify-between gap-y-4 sm:grid-cols-2 sm:gap-x-4 md:grid-cols-[repeat(4,_minmax(0,_200px))] md:gap-y-6 lg:grid-cols-[repeat(5,_minmax(0,_200px))]">
				{getPlaylists.data?.pages.map((group, i) => (
					<Fragment key={i}>
						{group.data.map(playlist => (
							<PlaylistCard key={playlist.id} data={playlist} />
						))}
					</Fragment>
				))}
			</div>

			{getPlaylists.hasNextPage && !isLoading ? (
				<div className="mt-4 w-full" ref={inView.ref} />
			) : null}

			{isLoading ? (
				<div className="mt-4 flex w-full justify-center">
					<Spinner className="h-6 w-6 fill-white text-[#3c3c3c] md:h-8 md:w-8" />
				</div>
			) : null}
		</>
	);
};

const MyPlaylists: NextPageWithLayout = () => {
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

	return <Content />;
};

MyPlaylists.getLayout = getLayout;

export default MyPlaylists;
