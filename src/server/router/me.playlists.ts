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

	return response;
};

export type ResponseData = Pick<
	SimplifiedPlaylist,
	'id' | 'name' | 'description' | 'images'
>[];

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

		let totalRequests = 1;
		let cursor: number | null = null;

		const data: ResponseData = [];
		while (data.length < input.limit) {
			const getSpotifyPlaylistsResponse = await getSpotifyPlaylists(
				getSpotifyPlaylistsParams
			);

			const items = getSpotifyPlaylistsResponse.data.items;

			let playlists = items
				.filter(playlist => {
					if (submittedPlaylistIds.includes(playlist.id)) {
						return false;
					}

					if (playlist.owner.id !== ctx.session?.user.id) {
						return false;
					}

					return true;
				})
				.map(({ id, name, description, images }) => ({
					id,
					name,
					description,
					images
				}));

			const next = getSpotifyPlaylistsResponse.data.next as string | null;
			if (!next && totalRequests == 1) {
				data.push(...playlists);
				break;
			}

			if (
				!next &&
				totalRequests > 1 &&
				data.length + playlists.length > input.limit
			) {
				playlists = playlists.slice(undefined, input.limit - data.length);

				playlists.forEach((playlist, index) => {
					if (playlist.id === playlists[playlists.length - 1]?.id) {
						cursor = index + 1;
						if (totalRequests > 1) {
							cursor += input.limit;
						}
					}
				});
			}

			data.push(...playlists);

			if (next) {
				getSpotifyPlaylistsParams.offset = parseInt(
					new URL(next).searchParams.get('offset') as string
				);
			}

			totalRequests++;
		}

		return { data, cursor };
	}
});
