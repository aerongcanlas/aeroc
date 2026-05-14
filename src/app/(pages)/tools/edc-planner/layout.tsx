import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'EDC Planner',
    description: 'Plan EDC sets and meetups with your crew.',
    openGraph: {
        title: 'EDC Planner',
        description: 'Plan EDC sets and meetups with your crew.',
        siteName: 'EDC Planner',
        type: 'website',
    },
    twitter: {
        card: 'summary',
        title: 'EDC Planner',
        description: 'Plan EDC sets and meetups with your crew.',
    },
};

export default function EdcPlannerLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return children;
}
