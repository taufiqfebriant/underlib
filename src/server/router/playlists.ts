import axios from 'axios';
import { Paging, SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { createRouter } from './context';

export const playlistsRouter = createRouter().query('getAll', {
	input: z.object({
		limit: z.number().min(1).max(5).nullish(),
		cursor: z.number().nullish()
	}),
	async resolve({ ctx }) {
		const response = await axios.get<Paging<SimplifiedPlaylist>>(
			'https://api.spotify.com/v1/me/playlists',
			{
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ctx.session?.accessToken}`
				},
				params: {
					limit: 5
				}
			}
		);

		return response.data;
	}
});
