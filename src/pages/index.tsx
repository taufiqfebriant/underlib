import type { NextPage } from 'next';
import { signIn, signOut, useSession } from 'next-auth/react';

const Home: NextPage = () => {
	const { data } = useSession();

	return (
		<main>
			{data ? (
				<button
					className="px-4 py-2 border border-black"
					onClick={() => signOut()}
				>
					Sign Out
				</button>
			) : (
				<button
					className="px-4 py-2 border border-black"
					onClick={() => signIn('spotify')}
				>
					Sign In
				</button>
			)}
		</main>
	);
};

export default Home;
