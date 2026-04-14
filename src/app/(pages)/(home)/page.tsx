import Link from 'next/link';

import { PageShell } from '../../_components/shared/page-shell';

const siteSections = [
    { href: '/games', label: 'Games' },
    { href: '/job-tracker', label: 'Job Tracker' },
    { href: '/resume', label: 'Resume' },
    { href: '/leetcode', label: 'LeetCode Stats' },
    { href: '/tools', label: 'Tools' },
    { href: '/portfolio', label: 'Portfolio' },
];

export default function HomePage() {
    return (
        <PageShell
            title="Hey! I'm Aeron"
            description='Welcome to my personal website where I share my projects, hobbies, and tools I find useful. Explore the games I play, my current job applications tracker, resume, LeetCode stats, and more as I document my journey in software development and beyond.'>
            <nav className='flex flex-wrap gap-3'>
                {siteSections.map((section) => (
                    <Link
                        key={section.href}
                        href={section.href}
                        className='rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/16'>
                        {section.label}
                    </Link>
                ))}
            </nav>
        </PageShell>
    );
}
