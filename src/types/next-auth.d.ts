import { Account, DefaultSession } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user?: {
			id: string;
		} & DefaultSession['user'];
		accessToken: Account['access_token'];
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		accessToken: Account['access_token'];
		accessTokenExpires: NonNullable<Account['expires_at']>;
		refreshToken: Account['refresh_token'];
	}
}
