import { Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import axios, { AxiosResponse } from 'axios';
import { customAlphabet } from 'nanoid';
import { Session } from 'next-auth';
import { Paging, SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
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
	// TODO: pindah ke me.ts
	.query('all-from-spotify', {
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
			limit: z.number().min(1).max(8),
			cursor: z.number().nullish(),
			tags: z.array(z.string()).nullish()
		}),
		async resolve({ ctx, input }) {
			const playlistsSelect = Prisma.validator<Prisma.PlaylistSelect>()({
				id: true,
				tags: {
					select: {
						name: true
					}
				}
			});

			const playlists = await ctx.prisma.playlist.findMany({
				take: input.limit,
				select: playlistsSelect,
				where: {
					deletedAt: null,
					tags: {
						some: {
							name: {
								in: input.tags?.length ? input.tags : undefined
							}
						}
					}
				}
			});

			const spotifyPlaylistPromises = playlists.map(async playlist => {
				const spotifyResponse: AxiosResponse<
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

				return spotifyResponse.data;
			});

			const data: (Pick<
				SimplifiedPlaylist,
				'id' | 'name' | 'description' | 'images' | 'owner'
			> &
				Pick<
					Prisma.PlaylistGetPayload<{ select: typeof playlistsSelect }>,
					'tags'
				>)[] = [];
			for await (const spotifyPlaylist of spotifyPlaylistPromises) {
				const relatedPlaylist = playlists.find(
					playlist => playlist.id === spotifyPlaylist.id
				);

				data.push({
					...spotifyPlaylist,
					tags: relatedPlaylist ? relatedPlaylist.tags : []
				});
			}

			return { data };
		}
	})
	.mutation('create', {
		input: z.object({
			id: z
				.string({
					required_error: 'You must select one of your playlist'
				})
				.min(1, { message: 'You must select one of your playlist' }),
			tags: z
				.array(z.string(), {
					required_error: 'You must include at least one tag'
				})
				.min(1, { message: 'You must include at least one tag' })
		}),
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
	})
	.mutation('update', {
		input: z.object({
			id: z
				.string()
				.min(1, { message: 'You must select one of your playlist' }),
			tags: z
				.array(z.string())
				.min(1, { message: 'You must include at least one tag' })
				.refine(array => new Set([...array]).size === array.length)
		}),
		async resolve({ ctx, input }) {
			if (!ctx.session) {
				throw new TRPCError({ code: 'UNAUTHORIZED' });
			}

			const playlist = await ctx.prisma.playlist.findUnique({
				where: {
					id: input.id
				},
				select: {
					tags: {
						select: {
							name: true
						}
					}
				}
			});

			if (!playlist) {
				throw new TRPCError({ code: 'NOT_FOUND' });
			}

			try {
				await ctx.prisma.playlist.update({
					where: {
						id: input.id
					},
					data: {
						tags: {
							disconnect: playlist.tags,
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
					}
				});
			} catch (error) {
				console.error(`Failed to update playlist, error:`, error);
			}
		}
	})
	.mutation('delete', {
		input: z.object({
			id: z.string().min(1, { message: 'You must select one of your playlist' })
		}),
		async resolve({ ctx, input }) {
			try {
				await ctx.prisma.playlist.update({
					where: {
						id: input.id
					},
					data: {
						deletedAt: new Date().toISOString()
					}
				});
			} catch (e) {
				console.log('Failed to delete playlist. Exception:', e);
			}
		}
	});
