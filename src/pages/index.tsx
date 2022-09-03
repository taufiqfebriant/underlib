import type { NextPage } from 'next';
import { useEffect, useRef } from 'react';
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
		<main>
			<div className="flex flex-col font-bold text-5xl mt-24 gap-y-4 text-center">
				<h1>Find a perfect Spotify playlist</h1>
				<h1>
					when <span className="text-green-500" ref={ref}></span>
				</h1>
			</div>
			<p className="max-w-xl mx-auto mt-8 text-xl text-gray-400 font-medium text-center">
				By using tags, we helps you discover Spotify playlists easier for your
				current moment or mood.
			</p>
		</main>
	);
};

export default Home;
