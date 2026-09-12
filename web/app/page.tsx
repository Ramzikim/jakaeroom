'use client';
import dynamic from 'next/dynamic';
const Room = dynamic(() => import('./room'), {ssr:false, loading: () => <div className="loading">작애가 방을 준비하고 있어요…</div>});
export default function Page() { return <Room/>; }
