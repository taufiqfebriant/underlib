import axios from 'axios';
import { env } from '../env/server.mjs';
import type { AccessToken } from '../types/spotify';

const encodedString = Buffer.from(
	`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`
).toString('base64');

export const getAccessToken = async (token = env.SPOTIFY_REFRESH_TOKEN) => {
	const params = new URLSearchParams({
		grant_type: 'refresh_token',
		refresh_token: token
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

	return response.data;
};
