import { customAlphabet } from 'nanoid';

export const customNanoId = customAlphabet(
	'0123456789abcdefghijklmnopqrstuvwxyz',
	20
);
