import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: "작애의 방 · JAKAE'S ROOM",
  description: '작애와 놀고, 편지와 사진을 모아보세요.',
  metadataBase: new URL('https://jakaeroom.vercel.app'),
  openGraph: {
    title: "작애의 방 · JAKAE'S ROOM",
    description: '작애와 놀고, 편지와 사진을 모아보세요.',
    images: ['/jakae-room-og-v2.png'],
    type: 'website',
    url: 'https://jakaeroom.vercel.app/',
  },
  twitter: {
    card: 'summary_large_image',
    title: "작애의 방 · JAKAE'S ROOM",
    description: '작애와 놀고, 편지와 사진을 모아보세요.',
    images: ['/jakae-room-og-v2.png'],
  },
};
export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="ko"><body>{children}</body></html>;
}
