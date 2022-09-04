import axios from 'axios';
import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import { JWT } from 'next-auth/jwt';
import SpotifyProvider from 'next-auth/providers/spotify';
import { AccessToken } from 'spotify-types';
import { env } from '../../../env/server.mjs';

const refreshAccessToken = async (token: JWT) => {
	const basic = Buffer.from(
		`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
		'base64'
	).toString();

	const response = await axios.get<AccessToken>(
		'https://accounts.spotify.com/api/token',
		{
			headers: {
				Authorization: `Basic ${basic}`
			},
			params: {
				grant_type: 'refresh_token',
				refresh_token: token.refreshToken
			}
		}
	);

	return {
		...token,
		accessToken: response.data.access_token,
		accessTokenExpires: Date.now() + response.data.expires_in * 1000
	};
};

export const authOptions: NextAuthOptions = {
	providers: [
		SpotifyProvider({
			authorization:
				'https://accounts.spotify.com/authorize?scope=user-read-email,playlist-read-collaborative',
			clientId: env.SPOTIFY_CLIENT_ID,
			clientSecret: env.SPOTIFY_CLIENT_SECRET
		})
	],
	callbacks: {
		async jwt({ account, token, user }) {
			if (account && account.expires_at && user) {
				return {
					...token,
					accessToken: account.access_token,
					accessTokenExpires: Date.now() + account.expires_at * 1000,
					refreshToken: account.refresh_token
				};
			}

			if (Date.now() < token.accessTokenExpires) {
				return token;
			}

			// TODO: betulkan ini
			return refreshAccessToken(token);
		},
		async session({ session, token }) {
			session.accessToken = token.accessToken;
			return session;
		}
	}
};

export default NextAuth(authOptions);
