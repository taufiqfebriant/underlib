import axios from 'axios';
import { Paging, SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { createRouter } from './context';

const input = z.object({
	limit: z.number().min(1).max(5),
	cursor: z.number().nullish()
});

type RequestInput = z.infer<typeof input>;
type SpotifyRequestParams = Omit<RequestInput, 'cursor'> & {
	offset?: RequestInput['cursor'];
};

export const playlistsRouter = createRouter().query('getAll', {
	input,
	async resolve({ ctx, input }) {
		const params: SpotifyRequestParams = {
			limit: input.limit
		};

		if (input.cursor) {
			params.offset = input.cursor;
		}

		const response = await axios.get<Paging<SimplifiedPlaylist>>(
			'https://api.spotify.com/v1/me/playlists',
			{
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ctx.session?.accessToken}`
				},
				params: params
			}
		);

		return response.data;
	}
});
