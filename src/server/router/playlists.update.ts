import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { customNanoId } from '../../utils/nanoid';
import { createRouter } from './context';

export const playlistsUpdate = createRouter().mutation('playlists.update', {
	input: z.object({
		id: z.string().min(1, { message: 'You must select one of your playlist' }),
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
});
