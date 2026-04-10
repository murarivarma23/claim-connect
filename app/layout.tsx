import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Providers } from '@/components/providers';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserNav } from '@/components/user-nav';
import { NavLinks } from '@/components/nav-links';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ClaimConnect | AI-Driven Lost & Found',
  description: 'The world\'s first agentic recovery platform for lost items.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en" suppressHydrationWarning>
      <Providers>
        <body className={`${inter.className} bg-[#FCFDFE] text-slate-800 antialiased min-h-screen flex flex-col relative`} suppressHydrationWarning>
          {/* Subtle dot pattern background */}
          <div className="absolute inset-0 z-[-1] h-full w-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-40"></div>
          <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
            <div className="w-full mx-auto px-6 lg:px-16 h-[88px] flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 group">
                {/* Clean blue shield logo */}
                <div className="bg-blue-500 rounded-xl p-2 md:p-2.5 text-white shadow-sm group-hover:bg-blue-600 transition-colors">
                  <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                {/* Two tone typography for ClaimConnect */}
                <span className="font-bold text-[22px] tracking-tight text-slate-900 ml-1">
                  Claim<span className="text-blue-500">Connect</span>
                </span>
              </Link>

              <NavLinks />

              <div className="flex items-center gap-6 text-[15px] font-semibold">
                {session ? (
                  <div className="flex items-center gap-3">
                    <span className="hidden sm:inline-block text-slate-700">
                      Hi, {session.user?.name?.split(' ')[0] || 'User'}
                    </span>
                    <UserNav />
                  </div>
                ) : (
                  <>
                    <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors mr-2">
                      Log in
                    </Link>
                    <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-6 py-2.5 h-11 shadow-sm font-medium text-[15px]">
                      <Link href="/signup">Sign up</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </header>

          <main className="flex-1 flex flex-col items-center w-full">
            {children}
          </main>

          <footer className="py-12 bg-white mt-auto w-full">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center gap-6 text-sm text-slate-500 text-center">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-500 rounded-lg p-1.5 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                  </svg>
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-900">
                  Claim<span className="text-blue-500">Connect</span>
                </span>
              </div>
              <p className="max-w-md mx-auto">
                The world's first AI-driven, trust-based lost and found recovery platform. Built to automate trust.
              </p>
              <p>© {new Date().getFullYear()} ClaimConnect. All rights reserved.</p>
            </div>
          </footer>
        </body>
      </Providers>
    </html>
  );
}
