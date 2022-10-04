import { signIn } from 'next-auth/react';
import { FaSpotify } from 'react-icons/fa';
import create from 'zustand';
import type { CustomDialogProps } from './CustomDialog';
import CustomDialog from './CustomDialog';

type State = Pick<CustomDialogProps, 'isOpen' | 'setIsOpen'>;

export const useSignInDialogStore = create<State>((set, get) => ({
	isOpen: false,
	setIsOpen: value => {
		if (get().isOpen !== value) {
			set({ isOpen: value });
		}
	}
}));

const SignInDialog = () => {
	const store = useSignInDialogStore();

	return (
		<CustomDialog isOpen={store.isOpen} setIsOpen={store.setIsOpen}>
			<div className="flex w-full flex-col items-center pb-12">
				<h1 className="text-2xl font-bold">Whoops</h1>
				<p className="text-[#989898]">You have to sign in first.</p>
				<button
					onClick={async () => await signIn('spotify')}
					className="mt-6 flex w-full max-w-sm items-center justify-center gap-x-2 rounded-md bg-[#1ed760] py-2 transition-opacity hover:opacity-90"
				>
					<FaSpotify />
					<span className="font-medium">Sign in with Spotify</span>
				</button>
			</div>
		</CustomDialog>
	);
};

export default SignInDialog;
