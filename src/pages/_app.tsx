// src/pages/_app.tsx
import { Dialog } from '@headlessui/react';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { withTRPC } from '@trpc/next';
import type { Session } from 'next-auth';
import { SessionProvider, signIn } from 'next-auth/react';
import type { AppType } from 'next/dist/shared/lib/utils';
import { FaSpotify } from 'react-icons/fa';
import superjson from 'superjson';
import create from 'zustand';
import Nav from '../components/Nav';
import type { AppRouter } from '../server/router';
import '../styles/globals.css';

type SignInDialogState = {
	isOpen: boolean;
	setIsOpen: (value: boolean) => void;
};

export const useSignInDialogStore = create<SignInDialogState>(set => ({
	isOpen: false,
	setIsOpen: value => set(() => ({ isOpen: value }))
}));

const MyApp: AppType<{ session: Session | null }> = ({
	Component,
	pageProps: { session, ...pageProps }
}) => {
	const signInDialogStore = useSignInDialogStore();

	return (
		<SessionProvider session={session}>
			<Nav />
			<Component {...pageProps} />
			{!session ? (
				<Dialog
					open={signInDialogStore.isOpen}
					onClose={() => signInDialogStore.setIsOpen(false)}
					className="relative z-30"
				>
					<div className="fixed inset-0 bg-white/10" aria-hidden="true" />

					<div className="fixed inset-0 flex items-center justify-center">
						<Dialog.Panel className="bg-[#151515] rounded-md w-80 h-48 text-center flex items-center justify-center p-4 md:w-96">
							{/* <div className="flex justify-between items-center">
								<Dialog.Title className="font-bold text-2xl">
									Whoops
								</Dialog.Title>
								<button
									type="button"
									onClick={() => signInDialogStore.setIsOpen(false)}
								>
									<MdClose className="text-3xl" />
								</button>
							</div> */}
							<div className="w-full">
								<Dialog.Title className="font-bold text-3xl">
									Whoops
								</Dialog.Title>
								<p className="text-[#989898]">You have to sign in first.</p>
								<button
									onClick={async () => await signIn('spotify')}
									className="bg-[#1ed760] flex items-center gap-x-2 w-full justify-center py-2 rounded-md hover:opacity-90 transition-opacity mt-6"
								>
									<FaSpotify />
									<span className="font-medium">Sign in with Spotify</span>
								</button>
							</div>
						</Dialog.Panel>
					</div>
				</Dialog>
			) : null}
		</SessionProvider>
	);
};

const getBaseUrl = () => {
	if (typeof window !== 'undefined') return ''; // browser should use relative url
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
	return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export default withTRPC<AppRouter>({
	config() {
		/**
		 * If you want to use SSR, you need to use the server's full URL
		 * @link https://trpc.io/docs/ssr
		 */
		const url = `${getBaseUrl()}/api/trpc`;

		return {
			links: [
				loggerLink({
					enabled: opts =>
						process.env.NODE_ENV === 'development' ||
						(opts.direction === 'down' && opts.result instanceof Error)
				}),
				httpBatchLink({ url })
			],
			url,
			transformer: superjson,
			/**
			 * @link https://react-query.tanstack.com/reference/QueryClient
			 */
			queryClientConfig: {
				defaultOptions: {
					queries: {
						refetchOnWindowFocus: false
					}
				}
			}
		};
	},
	/**
	 * @link https://trpc.io/docs/ssr
	 */
	ssr: false
})(MyApp);
