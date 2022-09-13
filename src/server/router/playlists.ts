import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import axios, { AxiosResponse } from 'axios';
import { customAlphabet } from 'nanoid';
import { Session } from 'next-auth';
import { Paging, SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { mutation_create_input } from '../../pages/submit';
import { createRouter } from './context';

const query_all_input = z.object({
	limit: z.number().min(1).max(5),
	cursor: z.number().nullish()
});

type RequestInput = z.infer<typeof query_all_input>;

type GetOwnedPlaylistsParams = {
	user_id: string;
	access_token: NonNullable<Session['accessToken']>;
	limit: RequestInput['limit'];
	offset?: RequestInput['cursor'];
};

const get_owned_playlists = async (params: GetOwnedPlaylistsParams) => {
	const spotify_request_params: Pick<
		GetOwnedPlaylistsParams,
		'limit' | 'offset'
	> = {
		limit: params.limit
	};

	if (params.offset) {
		spotify_request_params.offset = params.offset;
	}

	const spotify_response: AxiosResponse<Paging<SimplifiedPlaylist>> =
		await axios.get('https://api.spotify.com/v1/me/playlists', {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${params.access_token}`
			},
			params: spotify_request_params
		});

	spotify_response.data.items = spotify_response.data.items.filter(
		playlist => playlist.owner.id === params.user_id
	);

	return spotify_response;
};

export type ResponseData = Pick<
	SimplifiedPlaylist,
	'id' | 'name' | 'description' | 'images'
>[];

const customNanoId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 20);

export const playlistsRouter = createRouter()
	.query('all-from-spotify', {
		// TODO: pindah ke me.tsx
		input: query_all_input,
		async resolve({ ctx, input }) {
			if (!ctx.session) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			const get_owned_playlists_params: GetOwnedPlaylistsParams = {
				user_id: ctx.session.user.id,
				access_token: ctx.session.accessToken,
				limit: input.limit
			};

			if (input.cursor) {
				get_owned_playlists_params.offset = input.cursor;
			}

			const data: ResponseData = [];
			let cursor: string | null = null;

			while (data.length < input.limit) {
				const get_owned_playlists_response = await get_owned_playlists(
					get_owned_playlists_params
				);

				const items = get_owned_playlists_response.data.items;
				const next = get_owned_playlists_response.data.next;

				data.push(
					...items
						.slice(undefined, input.limit - data.length)
						.map(({ id, name, description, images }) => ({
							id,
							name,
							description,
							images
						}))
				);

				if (!next) {
					break;
				}

				cursor = new URL(next).searchParams.get('offset');
			}

			return {
				data,
				cursor: cursor ? parseInt(cursor) : null
			};
		}
	})
	.query('all', {
		input: z.object({
			limit: z.number().min(1).max(5),
			cursor: z.number().nullish()
		}),
		async resolve({ ctx, input }) {
			const playlists_select = Prisma.validator<Prisma.PlaylistSelect>()({
				id: true,
				tags: {
					select: {
						name: true
					}
				}
			});

			const playlists = await ctx.prisma.playlist.findMany({
				take: input.limit,
				select: playlists_select
			});

			const spotify_playlist_promises = playlists.map(async playlist => {
				const spotify_response: AxiosResponse<
					Pick<
						SimplifiedPlaylist,
						'id' | 'name' | 'description' | 'images' | 'owner'
					>
				> = await axios.get(
					`https://api.spotify.com/v1/playlists/${playlist.id}`,
					{
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
							Authorization: `Bearer ${ctx.session?.accessToken}`
						},
						params: {
							fields: 'id,name,description,images,owner'
						}
					}
				);

				return spotify_response.data;
			});

			const data: (Pick<
				SimplifiedPlaylist,
				'id' | 'name' | 'description' | 'images' | 'owner'
			> &
				Pick<
					Prisma.PlaylistGetPayload<{ select: typeof playlists_select }>,
					'tags'
				>)[] = [];
			for await (const spotify_playlist of spotify_playlist_promises) {
				const related_playlist = playlists.find(
					playlist => playlist.id === spotify_playlist.id
				);

				data.push({
					...spotify_playlist,
					tags: related_playlist ? related_playlist.tags : []
				});
			}

			return { data };
		}
	})
	.mutation('create', {
		input: mutation_create_input,
		async resolve({ ctx, input }) {
			if (!ctx.session) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			try {
				await prisma?.playlist.upsert({
					create: {
						id: input.id,
						userId: ctx.session.user.id,
						tags: {
							connectOrCreate: input.tags.map(tag => {
								return {
									create: {
										id: customNanoId(),
										name: tag
									},
									where: {
										name: tag
									}
								};
							})
						}
					},
					update: {
						deletedAt: null,
						tags: {
							connectOrCreate: input.tags.map(tag => {
								return {
									create: {
										id: customNanoId(),
										name: tag
									},
									where: {
										name: tag
									}
								};
							})
						}
					},
					where: {
						id: input.id
					}
				});
			} catch (e) {
				return console.log('Failed to create playlist. Exception:', e);
			}
		}
	});
