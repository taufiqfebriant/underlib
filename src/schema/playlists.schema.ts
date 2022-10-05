import { z } from 'zod';

export const playlistsCreateSchema = z.object({
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
});
