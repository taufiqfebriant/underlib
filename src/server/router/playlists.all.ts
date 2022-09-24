import { Prisma } from '@prisma/client';
import axios, { AxiosResponse } from 'axios';
import { AccessToken, SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { env } from '../../env/server.mjs';
import { createRouter } from './context';

const select = Prisma.validator<Prisma.PlaylistSelect>()({
	id: true,
	tags: {
		select: {
			name: true
		}
	}
});

export const playlistsAll = createRouter().query('playlists.all', {
	input: z.object({
		limit: z.number().min(1).max(8),
		cursor: z.number().nullish(),
		tags: z.array(z.string()).nullish()
	}),
	async resolve({ ctx, input }) {
		const data: (Pick<
			SimplifiedPlaylist,
			'id' | 'name' | 'description' | 'images' | 'owner'
		> &
			Pick<Prisma.PlaylistGetPayload<{ select: typeof select }>, 'tags'>)[] =
			[];

		const playlists = await ctx.prisma.playlist.findMany({
			take: input.limit,
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
			}
		});

		if (!playlists.length) {
			return { data };
		}

		const encodedString = Buffer.from(
			`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
		).toString('base64');

		const getAccessTokenParams = new URLSearchParams({
			grant_type: 'refresh_token',
			refresh_token: env.SPOTIFY_REFRESH_TOKEN
		}).toString();

		const getAccessToken = await axios.post<AccessToken>(
			'https://accounts.spotify.com/api/token',
			getAccessTokenParams,
			{
				headers: {
					Authorization: `Basic ${encodedString}`,
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			}
		);

		const accessToken = getAccessToken.data.access_token;

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

		return { data };
	}
});
