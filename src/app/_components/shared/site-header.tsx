'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SiteNav } from './site-nav';

const hiddenHeaderRoutes = ['/tools/edc-planner'];

export function SiteHeader() {
    const pathname = usePathname();
    const shouldHideHeader = hiddenHeaderRoutes.some(
        (route) => pathname === route || pathname.startsWith(`${route}/`),
    );

    if (shouldHideHeader) {
        return null;
    }

    return (
        <header className='sticky top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-md'>
            <nav className='mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4 sm:px-10'>
                <Link
                    href='/'
                    className='text-sm font-semibold uppercase tracking-[0.3em] text-white'>
                    Aeroc
                </Link>
                <SiteNav />
            </nav>
        </header>
    );
}
