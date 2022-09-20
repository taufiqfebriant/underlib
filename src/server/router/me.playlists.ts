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

type Input = z.infer<typeof input>;

type GetSpotifyPlaylistsParams = {
	userId: string;
	accessToken: NonNullable<Session['accessToken']>;
	limit: Input['limit'];
	offset?: Input['cursor'];
};

const getSpotifyPlaylists = async (params: GetSpotifyPlaylistsParams) => {
	const requestParams: Pick<GetSpotifyPlaylistsParams, 'limit' | 'offset'> = {
		limit: params.limit
	};

	if (params.offset) {
		requestParams.offset = params.offset;
	}

	const response: AxiosResponse<Paging<SimplifiedPlaylist>> = await axios.get(
		'https://api.spotify.com/v1/me/playlists',
		{
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${params.accessToken}`
			},
			params: requestParams
		}
	);

	// response.data.items = response.data.items.filter(
	// 	playlist => playlist.owner.id === params.user_id
	// );

	return response;
};

export type ResponseData = Pick<
	SimplifiedPlaylist,
	'id' | 'name' | 'description' | 'images'
>[];

// TODO: Ngembalikan playlist buatan user yang login aja & yang belum disubmit
export const mePlaylists = createRouter().query('me.playlists', {
	input: z.object({
		limit: z.number().min(1).max(5),
		cursor: z.number().nullish()
	}),
	async resolve({ ctx, input }) {
		if (!ctx.session) {
			throw new TRPCError({ code: 'UNAUTHORIZED' });
		}

		const submittedPlaylists = await ctx.prisma.playlist.findMany({
			where: {
				userId: ctx.session.user.id,
				deletedAt: null
			},
			select: {
				id: true
			}
		});

		const submittedPlaylistIds = submittedPlaylists.flatMap(
			playlist => playlist.id
		);

		const getSpotifyPlaylistsParams: GetSpotifyPlaylistsParams = {
			userId: ctx.session.user.id,
			accessToken: ctx.session.accessToken,
			limit: input.limit
		};

		if (input.cursor) {
			getSpotifyPlaylistsParams.offset = input.cursor;
		}

		const data: ResponseData = [];
		let cursor: number | null = null;

		while (data.length < input.limit) {
			const getSpotifyPlaylistsResponse = await getSpotifyPlaylists(
				getSpotifyPlaylistsParams
			);

			const items = getSpotifyPlaylistsResponse.data.items
				.slice(undefined, input.limit - data.length)
				.filter(playlist => !submittedPlaylistIds.includes(playlist.id))
				.map(({ id, name, description, images }) => ({
					id,
					name,
					description,
					images
				}));

			data.push(...items);

			const next = getSpotifyPlaylistsResponse.data.next;
			if (!next) {
				cursor = null;
				break;
			}

			cursor = parseInt(new URL(next).searchParams.get('offset') as string);

			getSpotifyPlaylistsParams.offset = cursor;
		}

		return { data, cursor };
	}
});
