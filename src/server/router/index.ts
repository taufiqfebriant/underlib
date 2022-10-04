// src/server/router/index.ts
import superjson from 'superjson';
import { createRouter } from './context';

import { mePlaylists } from './me.playlists';
import { meSubmittedPlaylists } from './me.submittedPlaylists';
import { playlistsAll } from './playlists.all';
import { playlistsById } from './playlists.byId';
import { playlistsCreateRouter } from './playlists.create';
import { playlistsDelete } from './playlists.delete';
import { playlistsUpdate } from './playlists.update';
import { tagsRouter } from './tags';

export const appRouter = createRouter()
	.transformer(superjson)
	.merge(playlistsCreateRouter)
	.merge(playlistsAll)
	.merge(playlistsById)
	.merge(playlistsUpdate)
	.merge(playlistsDelete)
	.merge('tags.', tagsRouter)
	.merge(mePlaylists)
	.merge(meSubmittedPlaylists);

// export type definition of API
export type AppRouter = typeof appRouter;
