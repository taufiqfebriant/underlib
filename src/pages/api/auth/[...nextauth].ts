import type { NextAuthOptions } from 'next-auth';
import NextAuth from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';
import { env } from '../../../env/server.mjs';
import { getAccessToken } from '../../../utils/spotify';

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
					accessTokenExpires: account.expires_at * 1000,
					refreshToken: account.refresh_token
				};
			}

			if (Date.now() < token.accessTokenExpires) {
				return token;
			}

			const getAccessTokenData = await getAccessToken();
			return {
				...token,
				accessToken: getAccessTokenData.access_token,
				accessTokenExpires: getAccessTokenData.expires_in * 1000
			};
		},
		async session({ session, token }) {
			if (token.sub) {
				session.user.id = token.sub;
			}

			if (token.accessToken) {
				session.accessToken = token.accessToken;
			}

			return session;
		}
	}
};

export default NextAuth(authOptions);
