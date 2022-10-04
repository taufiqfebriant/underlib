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
			<Head />
			<body className="mx-auto bg-[#151515] text-white antialiased">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
