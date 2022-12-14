import { Menu } from '@headlessui/react';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import Image from 'next/future/image';
import Head from 'next/head';
import type { LinkProps } from 'next/link';
import Link from 'next/link';
import { useRouter } from 'next/router';
import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { BiLinkExternal } from 'react-icons/bi';
import { FaEllipsisH, FaSpotify } from 'react-icons/fa';
import { MdPerson } from 'react-icons/md';
import CustomDialog from '../../../components/CustomDialog';
import { getLayout } from '../../../components/Layout';
import Spinner from '../../../components/Spinner';
import { appName } from '../../../constants/general';
import { trpc } from '../../../utils/trpc';
import type { NextPageWithLayout } from '../../_app';

type CustomLinkProps = Pick<LinkProps, 'href'> &
	Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
		children?: ReactNode;
	};

const CustomLink = forwardRef<HTMLAnchorElement, CustomLinkProps>(
	(props, ref) => {
		const { href, children, ...rest } = props;

		return (
			<Link href={href} passHref>
				<a ref={ref} {...rest}>
					{children}
				</a>
			</Link>
		);
	}
);

CustomLink.displayName = 'CustomLink';

type ContentProps = {
	id: string;
};

const Content = (props: ContentProps) => {
	const [isOpen, setIsOpen] = useState(false);
	const session = useSession();
	const router = useRouter();

	const deletePlaylistMutation = trpc.useMutation(['playlists.delete']);
	const utils = trpc.useContext();

	const deletePlaylist = async () => {
		try {
			await deletePlaylistMutation.mutateAsync({ id: props.id });

			await utils.invalidateQueries(['playlists.byId', { id: props.id }]);
			await utils.invalidateQueries(['playlists.all']);
			await utils.invalidateQueries(['me.submittedPlaylists']);
			await utils.invalidateQueries(['me.playlists']);

			setIsOpen(false);
			router.push({ pathname: '/' });
		} catch {}
	};

	const getPlaylist = trpc.useQuery(['playlists.byId', { id: props.id }]);

	if (getPlaylist.isLoading) {
		return (
			<div className="flex justify-center">
				<Spinner className="h-6 w-6 fill-white text-[#292929] md:h-8 md:w-8" />
			</div>
		);
	}

	if (getPlaylist.error?.data?.code === 'NOT_FOUND') {
		return (
			<div className="text-center">
				<h1 className="text-2xl font-bold">Playlist not found</h1>
				<p className="mt-2 font-medium text-[#989898]">
					We can&apos;t find the playlist with the given ID.
				</p>
			</div>
		);
	}

	if (getPlaylist.isError) {
		return (
			<div className="text-center">
				<h1 className="text-2xl font-bold">Something went wrong</h1>
				<p className="mt-2 font-medium text-[#989898]">
					We&apos;re really sorry. Please try to refresh the page.
				</p>
			</div>
		);
	}

	const meta = {
		title: `${getPlaylist.data?.data.name} - ${appName}`,
		description: getPlaylist.data?.data.description,
		image: getPlaylist.data?.data.images[0]?.url
	};

	return (
		<>
			<Head>
				<title>{meta.title}</title>
				<meta property="og:title" content={meta.title} />
				<meta name="twitter:title" content={meta.title} />

				{meta.description ? (
					<>
						<meta name="description" content={meta.description} />
						<meta property="og:description" content={meta.description} />
						<meta name="twitter:description" content={meta.description} />
					</>
				) : null}

				{meta.image ? (
					<>
						<meta property="og:image" content={meta.image} />
						<meta name="twitter:image" content={meta.image} />
					</>
				) : null}
			</Head>

			<div className="flex flex-col lg:max-h-[225px] lg:flex-row lg:items-center lg:gap-x-8">
				{getPlaylist.data?.data.images[0] ? (
					<div className="relative h-[200px] w-[200px] self-center overflow-hidden rounded-md lg:h-[225px] lg:w-[225px]">
						<Image
							src={getPlaylist.data?.data.images[0].url}
							alt="Playlist image"
							className="h-auto w-full object-cover"
							sizes="100%"
							fill
						/>
					</div>
				) : null}

				<div className="flex-1">
					<h1 className="mt-4 text-center text-2xl font-bold lg:text-left lg:text-5xl">
						{getPlaylist.data?.data.name}
					</h1>

					{getPlaylist.data?.data.description ? (
						<p
							className="mt-2 text-sm text-[#989898] lg:text-base"
							dangerouslySetInnerHTML={{
								__html: getPlaylist.data?.data.description
							}}
						/>
					) : null}

					<div className="mt-4 flex gap-x-2 overflow-x-auto">
						{getPlaylist.data?.data.tags.map(tag => (
							<div
								key={tag.tag.name}
								className="whitespace-nowrap rounded-md bg-[#292929] px-2 py-1 text-xs lg:text-sm"
							>
								{tag.tag.name}
							</div>
						))}
					</div>

					<div className="mt-6 flex items-center justify-between lg:mt-8">
						<div className="flex items-center gap-x-2">
							{getPlaylist.data?.data.owner.images?.length &&
							getPlaylist.data.data.owner.images[0]?.url ? (
								<Image
									src={getPlaylist.data.data.owner.images[0]?.url}
									alt={
										getPlaylist.data.data.owner.display_name ??
										getPlaylist.data.data.owner.id
									}
									width={32}
									height={32}
									className="rounded-full"
								/>
							) : (
								<div className="rounded-full bg-[#292929] p-1 text-2xl">
									<MdPerson />
								</div>
							)}
							<p className="text-sm lg:text-base">
								{getPlaylist.data?.data.owner.display_name}
							</p>
						</div>

						{session.data?.user.id === getPlaylist.data?.data.owner.id ? (
							<Menu as="div" className="relative lg:hidden">
								{({ open }) => (
									<>
										<Menu.Button
											className={clsx(
												'rounded-md p-2 text-lg transition-colors hover:bg-[#292929] lg:text-2xl',
												{ 'bg-[#292929]': open }
											)}
										>
											<FaEllipsisH />
										</Menu.Button>
										<Menu.Items className="absolute top-12 right-0 flex w-40 flex-col divide-y divide-[#3c3c3c] overflow-hidden rounded-md border border-[#3c3c3c] text-sm lg:text-base">
											<Menu.Item>
												{({ active }) => (
													<CustomLink
														href={{
															pathname: '/playlists/[id]/edit',
															query: { id: props.id }
														}}
														className={clsx(
															'px-4 py-2',
															{ 'bg-[#3c3c3c]': active },
															{ 'bg-[#292929]': !active }
														)}
													>
														Edit playlist
													</CustomLink>
												)}
											</Menu.Item>
											<Menu.Item>
												{({ active }) => (
													<button
														type="button"
														onClick={() => setIsOpen(true)}
														className={clsx(
															'px-4 py-2 text-left text-red-500',
															{ 'bg-[#3c3c3c]': active },
															{ 'bg-[#292929]': !active }
														)}
													>
														Delete
													</button>
												)}
											</Menu.Item>
										</Menu.Items>
									</>
								)}
							</Menu>
						) : null}
					</div>
				</div>
			</div>

			<div className="mt-6 flex items-center justify-center gap-x-6">
				<p className="hidden flex-1 lg:block">
					{getPlaylist.data?.data.tracks.total} songs
				</p>

				{session.data?.user.id === getPlaylist.data?.data.owner.id ? (
					<Menu as="div" className="relative hidden lg:block">
						{({ open }) => (
							<>
								<Menu.Button
									className={clsx(
										'rounded-md p-2 text-2xl transition-colors hover:bg-[#292929]',
										{ 'bg-[#292929]': open }
									)}
								>
									<FaEllipsisH />
								</Menu.Button>
								<Menu.Items className="absolute top-12 right-0 flex w-40 flex-col divide-y divide-[#3c3c3c] overflow-hidden rounded-md border border-[#3c3c3c]">
									<Menu.Item>
										{({ active }) => (
											<CustomLink
												href={{
													pathname: '/playlists/[id]/edit',
													query: { id: props.id }
												}}
												className={clsx(
													'px-4 py-2',
													{ 'bg-[#3c3c3c]': active },
													{ 'bg-[#292929]': !active }
												)}
											>
												Edit playlist
											</CustomLink>
										)}
									</Menu.Item>
									<Menu.Item>
										{({ active }) => (
											<button
												type="button"
												onClick={() => setIsOpen(true)}
												className={clsx(
													'px-4 py-2 text-left text-red-500',
													{ 'bg-[#3c3c3c]': active },
													{ 'bg-[#292929]': !active }
												)}
											>
												Delete
											</button>
										)}
									</Menu.Item>
								</Menu.Items>
							</>
						)}
					</Menu>
				) : null}

				<a
					href={getPlaylist.data?.data.external_urls.spotify}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center justify-between gap-x-6 rounded-md bg-[#1ed760] py-2 px-4 transition-opacity hover:opacity-90"
				>
					<div className="flex items-center gap-x-2">
						<FaSpotify />
						<span className="font-medium">Open on Spotify</span>
					</div>
					<BiLinkExternal />
				</a>
			</div>

			<div className="mt-4">
				{getPlaylist.data?.data.tracks.items.map((item, index) => (
					<div
						key={item.track?.id}
						className="flex h-[4.5rem] items-center gap-x-6 rounded-md px-0 transition-colors lg:h-16 lg:px-4 lg:hover:bg-[#292929]"
					>
						<p className="hidden w-4 font-medium text-[#989898] lg:block">
							{index + 1}
						</p>
						<div>
							<h1 className="text-sm lg:text-base">{item.track?.name}</h1>
							<p className="text-xs text-[#989898] lg:text-sm">
								{item.track?.artists.flatMap(artist => artist.name).join(', ')}
							</p>
						</div>
					</div>
				))}
			</div>

			<CustomDialog
				title="Delete playlist"
				isOpen={isOpen}
				setIsOpen={setIsOpen}
			>
				<p className="text-sm md:text-base">
					Are you sure want to delete the playlist from this site?{' '}
					<span className="text-[#989898]">
						(Don&apos;t worry, your original playlist will not be deleted)
					</span>
				</p>
				<div className="mt-8 mb-2 flex justify-end gap-x-2">
					<button
						type="button"
						className="flex items-center gap-x-2 rounded-md bg-red-500 px-8 py-2 transition-colors hover:opacity-80 disabled:opacity-50"
						onClick={deletePlaylist}
						disabled={deletePlaylistMutation.isLoading}
					>
						{deletePlaylistMutation.isLoading ? (
							<>
								<Spinner className="h-5 w-5 fill-[#292929] text-white" />
								<span>Deleting...</span>
							</>
						) : (
							<span>Yes</span>
						)}
					</button>
					<button
						type="button"
						className="rounded-md bg-[#292929] px-8 py-2 transition-colors hover:bg-[#3c3c3c]"
						onClick={() => setIsOpen(false)}
					>
						No
					</button>
				</div>
			</CustomDialog>
		</>
	);
};

const Playlist: NextPageWithLayout = () => {
	const router = useRouter<'/playlists/[id]'>();
	const [id, setId] = useState<string>();

	useEffect(() => {
		if (router.isReady && !id) {
			setId(router.query.id);
		}
	}, [id, router.isReady, router.query.id]);

	return id ? <Content id={id} /> : null;
};

Playlist.getLayout = getLayout;

export default Playlist;
