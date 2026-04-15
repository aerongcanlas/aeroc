import Link from 'next/link';
import { PageShell } from '../../_components/shared/page-shell';

const siteSections = [
    { href: '/tools/python-cheat-sheet', label: 'Python Cheat Sheet' },
];

export default function ToolsPage() {
    return (
        <PageShell
            title='Tools'
            description='Place for personal utilities, experiments, and small apps you build to make life easier.'>
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
