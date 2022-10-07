/// <reference types="spotify-api">
import type { Prisma } from '@prisma/client';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { z } from 'zod';
import { createPlaylistSelect } from '../../utils/prisma';
import { getAccessToken } from '../../utils/spotify';
import { createRouter } from './context';

const select = createPlaylistSelect({
	id: true,
	tags: {
		select: {
			tag: {
				select: {
					name: true
				}
			}
		}
	}
});

type SpotifyPlaylistData = Pick<
	SpotifyApi.SinglePlaylistResponse,
	'id' | 'name' | 'description' | 'images' | 'owner'
>;

type ResponseData = (SpotifyPlaylistData &
	Pick<Prisma.PlaylistGetPayload<{ select: typeof select }>, 'tags'>)[];

export const playlistsAll = createRouter().query('playlists.all', {
	input: z.object({
		limit: z.number().min(1).max(10),
		cursor: z.string().nullish(),
		tags: z.array(z.string()).nullish()
	}),
	async resolve({ ctx, input }) {
		let playlists = await ctx.prisma.playlist.findMany({
			take: input.limit + 1,
			select,
			where: {
				deletedAt: null,
				tags: {
					some: {
						tag: {
							name: {
								in: input.tags?.length ? input.tags : undefined
							}
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

		const data: ResponseData = [];

		if (!playlists.length) {
			return { data, cursor: null };
		}

		let cursor = null;
		if (playlists.length > input.limit) {
			playlists = playlists.slice(0, -1);
			cursor = playlists[playlists.length - 1]?.id ?? null;
		}

		const getAccessTokenData = await getAccessToken();

		const spotifyPlaylistPromises = playlists.map(async playlist => {
			const spotifyResponse: AxiosResponse<SpotifyPlaylistData> =
				await axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}`, {
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Bearer ${getAccessTokenData.access_token}`
					},
					params: {
						fields: 'id,name,description,images,owner'
					}
				});

			return spotifyResponse.data;
		});

		for await (const spotifyPlaylist of spotifyPlaylistPromises) {
			const relatedPlaylist = playlists.find(
				playlist => playlist.id === spotifyPlaylist.id
			);

			if (relatedPlaylist) {
				data.push({
					...spotifyPlaylist,
					tags: relatedPlaylist.tags
				});
			}
		}

		return { data, cursor };
	}
});
