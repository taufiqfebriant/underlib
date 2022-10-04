import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { customNanoId } from '../../utils/nanoid';
import { createProtectedRouter } from './protected-router';

export const playlistsUpdate = createProtectedRouter().mutation(
	'playlists.update',
	{
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
			const playlist = await ctx.prisma.playlist.findFirst({
				where: {
					id: input.id,
					deletedAt: null
				},
				select: {
					tags: {
						select: {
							name: true
						}
					},
					userId: true
				}
			});

			if (!playlist) {
				throw new TRPCError({ code: 'NOT_FOUND' });
			}

			if (playlist.userId !== ctx.session.user.id) {
				throw new TRPCError({ code: 'FORBIDDEN' });
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
			} catch (e) {
				console.error('Failed to update playlist. Exception:', e);
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
			}
		}
	}
);
