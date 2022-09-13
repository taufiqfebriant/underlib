import { NextPage } from 'next';
import Image from 'next/image';
import { Fragment, useEffect, useRef } from 'react';
import Typed from 'typed.js';
import { trpc } from '../utils/trpc';

const Playlists = () => {
	const get_playlists = trpc.useInfiniteQuery(['playlists.all', { limit: 5 }]);

	if (get_playlists.isLoading) {
		return <p>Loading...</p>;
	}

	if (get_playlists.error) {
		return <p>Something went wrong</p>;
	}

	return (
		<div className="my-10 flex">
			{get_playlists.data?.pages.map((group, i) => (
				<Fragment key={i}>
					{group.data.map(playlist => (
						<div
							key={playlist.id}
							className="bg-gray-900 rounded-md overflow-hidden"
						>
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
											key={tag.name}
											className="bg-gray-800 hover:bg-gray-700 transition-all rounded-md px-2 py-1 text-xs"
										>
											{tag.name}
										</div>
									))}
								</div>
							</div>
						</div>
					))}
				</Fragment>
			))}
		</div>
	);
};

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
			backSpeed: 50,
			backDelay: 2500,
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
			{/*TODO: Tambah kata-kata lagi yang berkaitan dengan playlist susah ditemukan */}
			<p className="max-w-xl mx-auto mt-8 text-xl text-gray-400 font-medium text-center">
				By using tags, we helps you discover awesome Spotify playlists easier
				for your current moment or mood.
			</p>
			<input
				type="text"
				name="tags"
				placeholder="Type &#34;Chill&#34;, &#34;Deadline&#34;, &#34;Wedding&#34;, etc"
				className="bg-gray-900 w-full h-10 rounded-md px-4 mt-6"
			/>
			<Playlists />
		</main>
	);
};

export default Home;
