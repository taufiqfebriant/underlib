import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

type Props = {
	as?: keyof JSX.IntrinsicElements;
} & HTMLAttributes<HTMLOrSVGElement>;

export const Container = ({
	as: Wrapper = 'div',
	className,
	children,
	...rest
}: Props) => {
	const restClassNames = [];
	if (className) {
		restClassNames.push({ [className]: className });
	}

	return (
		<Wrapper
			className={clsx('mx-auto max-w-6xl px-6 xl:px-0', ...restClassNames)}
			{...rest}
		>
			{children}
		</Wrapper>
	);
};
