'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';

import { Box, BoxRow } from '../ui';

const navItems = [
    { href: '/', label: 'Home' },
    { href: '/games', label: 'Games' },
    { href: '/job-tracker', label: 'Job Tracker' },
    { href: '/leetcode', label: 'LeetCode' },
    { href: '/tools', label: 'Tools' },
    { href: '/portfolio', label: 'Portfolio' },
    { href: '/about-me', label: 'About Me' },
];

export function SiteNav() {
    return (
        <Box className='flex flex-wrap items-center justify-end text-sm text-white/80'>
            {navItems.map((item, index) => {
                return (
                    <BoxRow
                        key={item.href}
                        className={cn('items-center gap-1 px-0.5')}>
                        {index > 0 && (
                            <Box className='border-l border-white/10 h-4 w-px' />
                        )}
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'rounded-full px-3 py-1 transition hover:bg-white/10 hover:text-white',
                            )}>
                            {item.label}
                        </Link>
                    </BoxRow>
                );
            })}
        </Box>
    );
}
