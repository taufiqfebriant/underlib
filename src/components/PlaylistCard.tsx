import Image from 'next/future/image';
import { inferQueryOutput } from '../utils/trpc';

type Props = {
	data: inferQueryOutput<'playlists.all'>['data'][number];
};

export const PlaylistCard = (props: Props) => {
	return (
		<div
			key={props.data.id}
			className="bg-[#292929] rounded-md overflow-hidden h-[6.25rem] md:w-[210px] md:h-[22rem] flex md:flex-col"
		>
			<div className="w-24 h-full md:w-full md:h-[210px] relative shrink-0">
				{props.data.images[0] ? (
					<Image
						src={props.data.images[0].url}
						alt="Playlist image"
						fill
						sizes="(max-width: 768px) 100vw,
						(max-width: 1200px) 50vw,
						33vw"
						className="object-cover"
					/>
				) : null}
			</div>
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
