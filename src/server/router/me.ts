import { Tag } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import axios, { AxiosResponse } from 'axios';
import { SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { createRouter } from './context';

type SpotifyPlaylist = Pick<
	SimplifiedPlaylist,
	'id' | 'name' | 'description' | 'images' | 'owner'
>;

export type Playlist = SpotifyPlaylist & { tags: Tag['name'][] };

export const meRouter = createRouter().query('playlists', {
	input: z.object({
		limit: z.number().min(1).max(8),
		cursor: z.number().nullish()
	}),
	async resolve({ ctx, input }) {
		if (!ctx.session) {
			throw new TRPCError({ code: 'UNAUTHORIZED' });
		}

		const playlists = await ctx.prisma.playlist.findMany({
			take: input.limit,
			select: {
				id: true,
				tags: {
					select: {
						name: true
					}
				}
			},
			where: {
				userId: ctx.session.user.id
			}
		});

		const spotifyPlaylistPromises = playlists.map(async playlist => {
			const spotifyResponse: AxiosResponse<SpotifyPlaylist> = await axios.get(
				`https://api.spotify.com/v1/playlists/${playlist.id}`,
				{
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Bearer ${ctx.session?.accessToken}`
					},
					params: {
						fields: 'id,name,description,images,owner'
					}
				}
			);

			return spotifyResponse.data;
		});

		const data: Playlist[] = [];

		for await (const spotifyPlaylist of spotifyPlaylistPromises) {
			const relatedPlaylist = playlists.find(
				playlist => playlist.id === spotifyPlaylist.id
			);

			data.push({
				...spotifyPlaylist,
				tags: relatedPlaylist
					? relatedPlaylist.tags.flatMap(tag => tag.name)
					: []
			});
		}

		return { data };
	}
});
