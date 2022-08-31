import { UpstashRedisAdapter } from '@next-auth/upstash-redis-adapter';
import { Redis } from '@upstash/redis';
import NextAuth, { type NextAuthOptions } from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

import { env } from '../../../env/server.mjs';

export const authOptions: NextAuthOptions = {
	adapter: UpstashRedisAdapter(
		new Redis({
			url: env.UPSTASH_REDIS_URL,
			token: env.UPSTASH_REDIS_TOKEN,
		})
	),
	providers: [
		// Kasik beberapa role
		SpotifyProvider({
			clientId: env.SPOTIFY_CLIENT_ID,
			clientSecret: env.SPOTIFY_CLIENT_SECRET,
		}),
	],
	callbacks: {
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
			}

			return session;
		},
	},
};

export default NextAuth(authOptions);
