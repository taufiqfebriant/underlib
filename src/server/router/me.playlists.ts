/// <reference types="spotify-api">
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import type { Session } from 'next-auth';
import { z } from 'zod';
import { createProtectedRouter } from './protected-router';

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

	const response: AxiosResponse<SpotifyApi.ListOfCurrentUsersPlaylistsResponse> =
		await axios.get('https://api.spotify.com/v1/me/playlists', {
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				Authorization: `Bearer ${params.accessToken}`
			},
			params: requestParams
		});

	return response;
};

export const mePlaylists = createProtectedRouter().query('me.playlists', {
	input,
	async resolve({ ctx, input }) {
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

		let cursor: number | null = null;

		const data: Pick<
			SpotifyApi.PlaylistObjectSimplified,
			'id' | 'name' | 'description' | 'images'
		>[] = [];

		let totalRequests = 1;
		while (data.length < input.limit) {
			const getSpotifyPlaylistsResponse = await getSpotifyPlaylists(
				getSpotifyPlaylistsParams
			);

			const items = getSpotifyPlaylistsResponse.data.items;

			const playlists = items
				.filter(playlist => {
					if (submittedPlaylistIds.includes(playlist.id)) {
						return false;
					}

					if (playlist.owner.id !== ctx.session?.user.id) {
						return false;
					}

					return true;
				})
				.map(playlist => ({
					id: playlist.id,
					name: playlist.name,
					description: playlist.description,
					images: playlist.images
				}));

			let strOffset: string | null = null;
			const next = getSpotifyPlaylistsResponse.data.next;
			if (next) {
				strOffset = new URL(next).searchParams.get('offset');
			}

			let offset: number | null = null;
			if (strOffset) {
				offset = parseInt(strOffset);
			}

			if (offset && data.length + playlists.length < input.limit) {
				data.push(...playlists);
				getSpotifyPlaylistsParams.offset = offset;

				totalRequests++;
				continue;
			}

			const slicedPlaylists = playlists.slice(
				undefined,
				input.limit - data.length
			);

			data.push(...slicedPlaylists);

			const totalRemainingPlaylists = playlists.length - slicedPlaylists.length;
			if (!offset && !totalRemainingPlaylists) {
				break;
			}

			const lastPlaylist = slicedPlaylists[slicedPlaylists.length - 1];
			items.forEach((item, index) => {
				if (item.id !== lastPlaylist?.id) return;

				cursor = index + 1;
				if (totalRequests > 1) {
					cursor += input.limit;
				}

				if (totalRequests > 1 && input.cursor) {
					cursor += input.cursor;
				}
			});
		}

		return { data, cursor };
	}
});
