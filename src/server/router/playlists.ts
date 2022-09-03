import axios from 'axios';
import { Paging, SimplifiedPlaylist } from 'spotify-types';
import { createRouter } from './context';

export const playlistsRouter = createRouter().query('getAll', {
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
