import axios from 'axios';
import { AccessToken } from 'spotify-types';
import { env } from '../../env/server.mjs';

export const getAccessToken = async () => {
	const encodedString = Buffer.from(
		`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
	).toString('base64');

	const params = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: env.SPOTIFY_REFRESH_TOKEN
	}).toString();

	const response = await axios.post<AccessToken>(
		'https://accounts.spotify.com/api/token',
		params,
		{
			headers: {
				Authorization: `Basic ${encodedString}`,
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		}
	);

	return response.data.access_token;
};
