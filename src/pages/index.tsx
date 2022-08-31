import type { NextPage } from 'next';
import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { FaSpotify } from 'react-icons/fa';
import Typed from 'typed.js';

const Home: NextPage = () => {
	const ref = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (!ref.current) return;

		const typed = new Typed(ref.current, {
			strings: [
				'you have a crush.',
				"it's midnight.",
				"you're on a deadline.",
				"it's raining outside.",
				"you're young and free.",
				"you're chilling at the park.",
				"you're growing up."
			],
			typeSpeed: 70,
			backSpeed: 60,
			loop: true
		});

		return () => {
			typed.destroy();
		};
	}, []);

	return (
		<main className="max-w-5xl mx-auto text-white">
			<nav className="flex py-4 items-center justify-between">
				<div className="bg-white text-black font-bold px-4 py-2 text-xl">
					diskaver
				</div>
				<div className="flex gap-x-6 items-center">
					<Link href="/submit" passHref>
						<a className="font-medium hover:underline">Submit your playlists</a>
					</Link>
					<button
						onClick={() => console.log('sign in')}
						className="bg-green-500 px-4 py-2 text-sm rounded-md font-bold focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-4 focus:ring-offset-black focus:bg-green-600 focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-4 focus-visible:ring-offset-black focus-visible:bg-green-600 hover:bg-green-600 flex items-center gap-x-2"
					>
						<FaSpotify className="text-lg" />
						<span>Sign in with Spotify</span>
					</button>
				</div>
			</nav>
			<div className="text-center">
				<div className="flex flex-col font-bold text-5xl mt-24 gap-y-4">
					<h1>Find a perfect Spotify playlist</h1>
					<h1>
						when <span className="text-green-500" ref={ref}></span>
					</h1>
				</div>
				<p className="max-w-xl mx-auto mt-8 text-xl text-gray-400 font-medium">
					By using tags, we helps you discover Spotify playlists easier for your
					current moment or mood.
				</p>
			</div>
		</main>
	);
};

export default Home;
