import { Dialog } from '@headlessui/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { MdClose } from 'react-icons/md';
import { twMerge } from 'tailwind-merge';
import type { ExtractProps } from '../types/helpers';

type DialogProps = ExtractProps<typeof Dialog>;

export type CustomDialogProps = {
	title?: string;
	children: ReactNode;
	isOpen: NonNullable<DialogProps['open']>;
	setIsOpen: (value: boolean) => void;
} & Pick<HTMLAttributes<HTMLOrSVGElement>, 'className'>;

const CustomDialog = (props: CustomDialogProps) => {
	const className = twMerge(
		'mx-auto max-h-full w-full max-w-lg rounded bg-[#151515] px-4',
		props.className
	);

	return (
		<Dialog
			open={props.isOpen}
			onClose={() => props.setIsOpen(false)}
			className="relative z-50"
		>
			<div
				className="fixed inset-0 bg-[rgba(91,_112,_131,_0.4)]"
				aria-hidden="true"
			/>

			<div className="fixed inset-0 flex items-center justify-center p-4">
				<Dialog.Panel className={className}>
					<div className="flex h-12 items-center justify-between">
						<Dialog.Title className="text-xl font-bold">
							{props.title ?? ''}
						</Dialog.Title>
						<button
							type="button"
							onClick={() => props.setIsOpen(false)}
							className="text-2xl"
						>
							<MdClose />
						</button>
					</div>

					{props.children}
				</Dialog.Panel>
			</div>
		</Dialog>
	);
};

export default CustomDialog;

// type SignInDialogState = {
// 	isOpen: boolean;
// 	setIsOpen: (value: boolean) => void;
// };

// export const useSignInDialogStore = create<SignInDialogState>(set => ({
// 	isOpen: false,
// 	setIsOpen: value => set(() => ({ isOpen: value }))
// }));
