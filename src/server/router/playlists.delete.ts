import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createProtectedRouter } from './protected-router';

export const playlistsDelete = createProtectedRouter().mutation(
	'playlists.delete',
	{
		input: z.object({
			id: z
				.string({ required_error: 'You must select one of your playlist' })
				.min(1, { message: 'You must select one of your playlist' })
		}),
		async resolve({ ctx, input }) {
			const playlist = await ctx.prisma.playlist.findFirst({
				where: {
					deletedAt: null,
					id: input.id
				},
				select: {
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
						deletedAt: new Date().toISOString()
					}
				});
			} catch (e) {
				console.error('Failed to delete playlist. Exception:', e);
				throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
			}
		}
	}
);
