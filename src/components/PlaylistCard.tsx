import Image from 'next/future/image';
import Link from 'next/link';
import type { ComponentPropsWithoutRef } from 'react';
import type { inferQueryOutput } from '../utils/trpc';

interface Props extends ComponentPropsWithoutRef<'a'> {
	data: inferQueryOutput<'playlists.all'>['data'][number];
}

export const PlaylistCard = (props: Props) => {
	const { data, className, ...rest } = props;

	return (
		<Link
			href={{ pathname: '/playlists/[id]', query: { id: data.id } }}
			passHref
		>
			<a
				key={data.id}
				className={`flex h-[6.25rem] overflow-hidden rounded-md bg-[#292929] hover:outline hover:outline-[#3c3c3c] md:h-[19.5rem] md:max-w-[200px] md:flex-col ${
					className || ''
				}`}
				{...rest}
			>
				{data.images[0] ? (
					<div className="relative w-24 shrink-0 md:h-full md:max-h-[200px] md:w-[unset]">
						<Image
							src={data.images[0].url}
							alt="Playlist image"
							className="h-auto w-full object-cover"
							sizes="(min-width: 640px) 50vw,
						(min-width: 768px) 25vw,
						(min-width: 1024px) 20vw,
						100vw"
							fill={true}
						/>
					</div>
				) : null}
				<div className="flex flex-1 flex-col justify-between overflow-hidden px-3 py-2">
					<h1 className="truncate text-sm font-semibold md:text-base">
						{data.name}
					</h1>
					<p className="mt-[.2rem] flex-1 text-xs text-[#989898] md:mt-1 md:text-sm">
						{data.owner.display_name}
					</p>
					<div className="flex gap-x-2 overflow-y-auto">
						{data.tags.map(tag => (
							<div
								key={tag.name}
								className="whitespace-nowrap rounded-md bg-[#3c3c3c] px-2 py-1 text-xs"
							>
								{tag.name}
							</div>
						))}
					</div>
				</div>
			</a>
		</Link>
	);
};
