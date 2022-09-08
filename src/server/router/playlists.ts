import { TRPCError } from '@trpc/server';
import axios, { AxiosResponse } from 'axios';
import { Session } from 'next-auth';
import { Paging, SimplifiedPlaylist } from 'spotify-types';
import { z } from 'zod';
import { createRouter } from './context';

const input = z.object({
	limit: z.number().min(1).max(5),
	cursor: z.number().nullish()
});

type RequestInput = z.infer<typeof input>;

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
>;

export const playlistsRouter = createRouter().query('getAll', {
	input,
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

		const data: ResponseData[] = [];
		let cursor: string | null = null;

		while (data.length < input.limit) {
			const get_owned_playlists_response = await get_owned_playlists(
				get_owned_playlists_params
			);

			const items = get_owned_playlists_response.data.items;
			const next = get_owned_playlists_response.data.next;

			if (!items.length && !next) {
				break;
			}

			data.push(
				...get_owned_playlists_response.data.items
					.slice(undefined, input.limit - data.length)
					.map(({ id, name, description, images }) => ({
						id,
						name,
						description,
						images
					}))
			);

			if (next) {
				cursor = new URL(next).searchParams.get('offset');
			}
		}

		return {
			data,
			cursor: cursor ? parseInt(cursor) : null
		};
	}
});
