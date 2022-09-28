import clsx from 'clsx';
import { ComponentProps } from 'react';

export const Container = (props: ComponentProps<'main'>) => {
	const restClassNames = [];
	if (props.className) {
		restClassNames.push({ [props.className]: props.className });
	}

	return (
		<main className={clsx('max-w-6xl mx-auto px-6 md:px-0', ...restClassNames)}>
			{props.children}
		</main>
	);
};
