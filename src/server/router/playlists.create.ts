/// <reference types="spotify-api">
import { TRPCError } from '@trpc/server';
import type { AxiosResponse } from 'axios';
import axios, { AxiosError } from 'axios';
import { z } from 'zod';
import { customNanoId } from '../../utils/nanoid';
import { createProtectedRouter } from './protected-router';

export const playlistsCreateRouter = createProtectedRouter().mutation(
	'playlists.create',
	{
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
			let response: AxiosResponse<{
				owner: Pick<SpotifyApi.SinglePlaylistResponse['owner'], 'id'>;
			}> | null = null;

			try {
				response = await axios.get(
					`https://api.spotify.com/v1/playlists/${input.id}`,
					{
						headers: {
							Accept: 'application/json',
							'Content-Type': 'application/json',
							Authorization: `Bearer ${ctx.session.accessToken}`
						},
						params: {
							fields: 'owner.id'
						}
					}
				);
			} catch (e: unknown) {
				if (e instanceof AxiosError && e.response?.status === 404) {
					throw new TRPCError({ code: 'NOT_FOUND' });
				}

				console.error('Failed to submit playlist. Exception:', e);
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
			}

			if (response && response.data.owner.id !== ctx.session.user.id) {
				throw new TRPCError({ code: 'FORBIDDEN' });
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
				console.error('Failed to submit playlist. Exception:', e);
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
			}
		}
	}
);
