import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
	return (
		<Html>
			<link
				rel="preload"
				href={`/fonts/Inter-VariableFont_slnt,wght.woff2`}
				as="font"
				type="font/woff2"
				crossOrigin="anonymous"
			/>

			<link
				rel="apple-touch-icon"
				sizes="180x180"
				href="/apple-touch-icon.png"
			/>
			<link
				rel="icon"
				type="image/png"
				sizes="32x32"
				href="/favicon-32x32.png"
			/>
			<link
				rel="icon"
				type="image/png"
				sizes="16x16"
				href="/favicon-16x16.png"
			/>
			<link rel="manifest" href="/site.webmanifest" />
			<meta name="msapplication-config" content="/browserconfig.xml" />
			<meta name="msapplication-TileColor" content="#151515" />
			<meta name="theme-color" content="#151515" />
			<Head />
			<body className="mx-auto bg-[#151515] text-white antialiased">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
