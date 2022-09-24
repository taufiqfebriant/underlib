import { TRPCError } from '@trpc/server';
import { customAlphabet } from 'nanoid';
import { z } from 'zod';
import { createRouter } from './context';

const customNanoId = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 20);

export const playlistsRouter = createRouter()
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
