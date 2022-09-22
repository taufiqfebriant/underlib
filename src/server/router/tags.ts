import { z } from 'zod';
import { createRouter } from './context';

export const tagsRouter = createRouter().query('all', {
	input: z.object({
		q: z.string().nullish(),
		except: z
			.array(z.string())
			.refine(array => new Set([...array]).size === array.length)
			.nullish()
	}),
	async resolve({ ctx, input }) {
		const tags = await ctx.prisma.tag.findMany({
			select: {
				name: true
			},
			where: {
				name: {
					startsWith: input.q ?? undefined,
					notIn: input.except?.length ? input.except : undefined
				}
			},
			orderBy: {
				name: 'asc'
			},
			take: 5
		});

		const data = tags.flatMap(tag => tag.name);
		return { data };
	}
});
