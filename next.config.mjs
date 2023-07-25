/**
 * Don't be scared of the generics here.
 * All they do is to give us autocompletion when using this.
 *
 * @template {import('next').NextConfig} T
 * @param {T} config - A generic parameter that flows through to the return type
 * @constraint {{import('next').NextConfig}}
 */
function defineNextConfig(config) {
	return config;
}

import withRoutes from 'nextjs-routes/config';

export default withRoutes()(
	defineNextConfig({
		reactStrictMode: true,
		swcMinify: true,
		images: {
			domains: ['i.scdn.co', 'mosaic.scdn.co', 'images-ak.spotifycdn.com']
		}
	})
);
