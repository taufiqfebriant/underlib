import { z } from 'zod';
import { createRouter } from './context';

export const tagsRouter = createRouter().query('all', {
	input: z.object({
		q: z.string().nullish()
	}),
	async resolve({ ctx, input }) {
		const tags = await ctx.prisma.tag.findMany({
			select: {
				name: true
			},
			where: input.q
				? {
						name: {
							contains: input.q
						}
				  }
				: undefined,
			orderBy: {
				name: 'asc'
			},
			take: 5
		});

		const data = tags.flatMap(tag => tag.name);
		return { data };
	}
});
