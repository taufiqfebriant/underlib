/// <reference types="spotify-api">
import { TRPCError } from '@trpc/server';
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { z } from 'zod';
import { getAccessToken } from '../../utils/spotify';
import { createRouter } from './context';

export const playlistsById = createRouter().query('playlists.byId', {
	input: z.object({
		id: z
			.string({ required_error: 'ID must be included' })
			.min(1, 'ID must be included')
	}),
	async resolve({ ctx, input }) {
		const playlist = await ctx.prisma.playlist.findUnique({
			where: {
				id: input.id
			},
			select: {
				tags: {
					select: {
						tag: {
							select: {
								name: true
							}
						}
					}
				}
			}
		});

		if (!playlist) {
			throw new TRPCError({ code: 'NOT_FOUND' });
		}

		const getAccessTokenData = await getAccessToken();

		type SpotifyPlaylistData = Pick<
			SpotifyApi.SinglePlaylistResponse,
			'name' | 'description' | 'external_urls' | 'images'
		> & {
			owner: Pick<
				SpotifyApi.SinglePlaylistResponse['owner'],
				'display_name' | 'id'
			>;
			tracks: Pick<SpotifyApi.SinglePlaylistResponse['tracks'], 'total'> & {
				items: Array<{
					track:
						| (Pick<SpotifyApi.TrackObjectFull, 'id' | 'name'> & {
								artists: Array<Pick<SpotifyApi.ArtistObjectSimplified, 'name'>>;
						  })
						| null;
				}>;
			};
		};

		const response: AxiosResponse<SpotifyPlaylistData> = await axios.get(
			`https://api.spotify.com/v1/playlists/${input.id}`,
			{
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					Authorization: `Bearer ${getAccessTokenData.access_token}`
				},
				params: {
					fields:
						'name,description,external_urls,images,owner.display_name,owner.id,tracks.total,tracks.items(track(id,name,artists(name)))'
				}
			}
		);

		const getUserProfileResponse: AxiosResponse<SpotifyApi.UserObjectPublic> =
			await axios.get(
				`https://api.spotify.com/v1/users/${response.data.owner.id}`,
				{
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						Authorization: `Bearer ${getAccessTokenData.access_token}`
					}
				}
			);

		const data = {
			...response.data,
			tags: playlist.tags,
			owner: {
				...response.data.owner,
				images: getUserProfileResponse.data.images
			}
		};

		return { data };
	}
});
