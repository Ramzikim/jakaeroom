import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: "작애의 방 · JAKAE’S ROOM", description: '딸기를 좋아하는 작애의 작은 방에 놀러 오세요.' };
export default function Layout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="ko"><body>{children}</body></html>;
}
