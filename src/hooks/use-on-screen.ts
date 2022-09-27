import { RefObject, useEffect, useState } from 'react';

type Params<T> = {
	ref: RefObject<T | undefined>;
};

export const useOnScreen = <T extends Element>(params: Params<T>): boolean => {
	const [isIntersecting, setIntersecting] = useState<boolean>(false);

	useEffect(() => {
		const observer = new IntersectionObserver(([entry]) => {
			if (entry === undefined) return;

			// Update our state when observer callback fires
			setIntersecting(entry.isIntersecting);
		});

		let observerRefValue: Element | null = null;

		if (params.ref.current) {
			observer.observe(params.ref.current);
			observerRefValue = params.ref.current;
		}

		return () => {
			if (observerRefValue) {
				observer.unobserve(observerRefValue);
			}
		};
	}, [params.ref]);

	return isIntersecting;
};
