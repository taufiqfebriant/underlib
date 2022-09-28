import Image from 'next/future/image';
import { inferQueryOutput } from '../utils/trpc';

type Props = {
	data: inferQueryOutput<'playlists.all'>['data'][number];
};

export const PlaylistCard = (props: Props) => {
	return (
		<div
			key={props.data.id}
			className="bg-[#292929] rounded-md overflow-hidden h-[6.25rem] md:max-w-[200px] md:h-80 flex md:flex-col"
		>
			{props.data.images[0] ? (
				<div className="relative w-24 md:max-h-[200px] md:w-[unset] md:h-full">
					<Image
						src={props.data.images[0].url}
						alt="Playlist image"
						className="w-full h-auto object-cover"
						sizes="(min-width: 640px) 50vw,
						(min-width: 768px) 25vw,
						(min-width: 1024px) 20vw,
						100vw"
						fill={true}
					/>
				</div>
			) : null}
			<div className="px-3 py-2 flex flex-col justify-between flex-1 overflow-hidden">
				<h1 className="font-semibold text-sm md:text-base truncate">
					{props.data.name}
				</h1>
				<p className="text-xs md:text-sm text-[#989898] flex-1 mt-[.2rem] md:mt-1">
					{props.data.owner.display_name}
				</p>
				<div className="flex gap-x-2 overflow-y-auto">
					{props.data.tags.map(tag => (
						<div
							key={tag.name}
							className="bg-[#3c3c3c] rounded-md px-2 py-1 text-xs md:text-sm whitespace-nowrap"
						>
							{tag.name}
						</div>
					))}
				</div>
			</div>
		</div>
	);
};
