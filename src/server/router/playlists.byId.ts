import { TRPCError } from '@trpc/server';
import axios, { AxiosResponse } from 'axios';
import { SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { getAccessToken } from '../utils/spotify';
import { createRouter } from './context';

export const playlistsById = createRouter().query('playlists.byId', {
	input: z.object({
		id: z
			.string({ required_error: 'ID must be included' })
			.min(1, 'ID must be included')
	}),
	async resolve({ ctx, input }) {
		const playlist = await ctx.prisma.playlist.findUnique({
			where: {
				id: input.id
			},
			select: {
				id: true
			}
		});

		if (!playlist) {
			throw new TRPCError({ code: 'NOT_FOUND' });
		}

		const accessToken = await getAccessToken();

		const response: AxiosResponse<SimplifiedPlaylist> = await axios.get(
			`https://api.spotify.com/v1/playlists/${input.id}`,
			{
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`
				}
			}
		);

		return { data: response.data };
	}
});
