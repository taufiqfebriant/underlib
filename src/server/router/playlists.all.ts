import { Prisma } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import { SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { getAccessToken } from '../utils/spotify';
import { createRouter } from './context';

export const playlistsAll = createRouter().query('playlists.all', {
	input: z.object({
		limit: z.number().min(1).max(10),
		cursor: z.string().nullish(),
		tags: z.array(z.string()).nullish()
	}),
	async resolve({ ctx, input }) {
		const select = Prisma.validator<Prisma.PlaylistSelect>()({
			id: true,
			tags: {
				select: {
					name: true
				}
			}
		});

		let playlists = await ctx.prisma.playlist.findMany({
			take: input.limit + 1,
			select,
			where: {
				deletedAt: null,
				tags: {
					some: {
						name: {
							in: input.tags?.length ? input.tags : undefined
						}
					}
				}
			},
			orderBy: [
				{
					updatedAt: 'desc'
				},
				{
					id: 'asc'
				}
			],
			cursor: input.cursor
				? {
						id: input.cursor
				  }
				: undefined,
			skip: input.cursor ? 1 : undefined
		});

		const data: (Pick<
			SimplifiedPlaylist,
			'id' | 'name' | 'description' | 'images' | 'owner'
		> &
			Pick<Prisma.PlaylistGetPayload<{ select: typeof select }>, 'tags'>)[] =
			[];

		if (!playlists.length) {
			return { data, cursor: null };
		}

		let cursor = null;
		if (playlists.length > input.limit) {
			playlists = playlists.slice(0, -1);
			cursor = playlists[playlists.length - 1]?.id ?? null;
		}

		const accessToken = await getAccessToken();

		const spotifyPlaylistPromises = playlists.map(async playlist => {
			const spotifyResponse: AxiosResponse<
				Pick<
					SimplifiedPlaylist,
					'id' | 'name' | 'description' | 'images' | 'owner'
				>
			> = await axios.get(
				`https://api.spotify.com/v1/playlists/${playlist.id}`,
				{
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Bearer ${accessToken}`
					},
					params: {
						fields: 'id,name,description,images,owner'
					}
				}
			);

			return spotifyResponse.data;
		});

		for await (const spotifyPlaylist of spotifyPlaylistPromises) {
			const relatedPlaylist = playlists.find(
				playlist => playlist.id === spotifyPlaylist.id
			);

			data.push({
				...spotifyPlaylist,
				tags: relatedPlaylist ? relatedPlaylist.tags : []
			});
		}

		return { data, cursor };
	}
});
