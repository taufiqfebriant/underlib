import type { Prisma } from '@prisma/client';

type CheckSelectKeys<T, U> = {
	[K in keyof T]: K extends keyof U ? T[K] : never;
};

export const createPlaylistSelect = <T extends Prisma.PlaylistSelect>(
	arg: CheckSelectKeys<T, Prisma.PlaylistSelect>
) => arg;
