"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLinks() {
    const pathname = usePathname();

    const links = [
        { href: '/', label: 'Home' },
        { href: '/how-it-works', label: 'How it Works' },
        { href: '/chats', label: 'Chats' }
    ];

    return (
        <nav className="hidden md:flex gap-10 text-[15px] font-semibold">
            {links.map((link) => {
                const isActive = pathname === link.href;

                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        className={`transition-colors ${isActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        {link.label}
                    </Link>
                );
            })}
        </nav>
    );
}
