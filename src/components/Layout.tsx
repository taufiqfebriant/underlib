import Head from 'next/head';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';
import { appName } from '../constants/general';
import { env } from '../env/client.mjs';
import Nav from './Nav';
import SignInDialog from './SignInDialog';

type Props = {
	children: ReactNode;
};

const Layout = (props: Props) => {
	const router = useRouter();

	const meta = {
		title: appName,
		description:
			'Discover Spotify playlists with tags for a better discoverability',
		image: `${env.NEXT_PUBLIC_BASE_URL}/images/underlib-banner.png`,
		url: `${env.NEXT_PUBLIC_BASE_URL}${router.asPath}`
	};

	return (
		<>
			<Head>
				<title>{meta.title}</title>
				<link rel="canonical" href={meta.url} />
				<meta name="description" content={meta.description} />
				<meta name="robots" content="follow, index" />

				<meta property="og:title" content={meta.title} />
				<meta property="og:description" content={meta.description} />
				<meta property="og:type" content="website" />
				<meta property="og:url" content={meta.url} />
				<meta property="og:site_name" content={appName} />
				<meta property="og:image" content={meta.image} />

				<meta name="twitter:card" content="summary_large_image" />
				<meta name="twitter:site" content="@taufiqfebriant" />
				<meta name="twitter:title" content={meta.title} />
				<meta name="twitter:description" content={meta.description} />
				<meta name="twitter:image" content={meta.image} />
			</Head>

			<Nav />

			<main className="mx-auto mt-32 mb-10 max-w-6xl px-6 md:mt-28 xl:px-0">
				{props.children}
			</main>

			<SignInDialog />
		</>
	);
};

export const getLayout = (page: ReactNode) => <Layout>{page}</Layout>;

export default Layout;
