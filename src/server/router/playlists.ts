import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createRouter } from './context';

export const playlistsRouter = createRouter().mutation('create', {
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
});
