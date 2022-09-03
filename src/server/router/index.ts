// src/server/router/index.ts
import superjson from 'superjson';
import { createRouter } from './context';

import { exampleRouter } from './example';
import { playlistsRouter } from './playlists';
import { protectedExampleRouter } from './protected-example-router';

export const appRouter = createRouter()
	.transformer(superjson)
	.merge('example.', exampleRouter)
	.merge('auth.', protectedExampleRouter)
	.merge('playlists.', playlistsRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
