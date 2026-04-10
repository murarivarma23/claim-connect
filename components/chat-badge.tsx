"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export function ChatBadge() {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const fetchCount = async () => {
            try {
                const res = await fetch('/api/chats/count');
                if (res.ok) {
                    const data = await res.json();
                    setCount(data.count);
                }
            } catch (e) {
                console.error('Failed to fetch chat count', e);
            }
        };

        fetchCount();
        const interval = setInterval(fetchCount, 10000); // Check every 10 seconds
        return () => clearInterval(interval);
    }, []);

    return (
        <Link href="/chats" className="relative hover:text-slate-800 transition-colors flex items-center">
            Chats
            {count > 0 && (
                <span className="absolute -top-2 -right-3.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center justify-center min-w-[16px] h-[16px]">
                    {count}
                </span>
            )}
        </Link>
    );
}
