import type { ReactNode } from 'react';

type PageShellProps = {
    title: string;
    description: string;
    children?: ReactNode;
};

export function PageShell({ title, description, children }: PageShellProps) {
    return (
        <main className='mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-32 sm:px-10'>
            <div className='max-w-3xl rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-sm sm:p-12'>
                <p className='text-sm font-medium uppercase tracking-[0.3em] text-white/60'>
                    Aeroc
                </p>
                <h1 className='mt-4 text-4xl font-semibold tracking-tight text-white sm:text-6xl'>
                    {title}
                </h1>
                <p className='mt-6 max-w-2xl text-base leading-8 text-white/75 sm:text-lg'>
                    {description}
                </p>
                {children ? <div className='mt-10'>{children}</div> : null}
            </div>
        </main>
    );
}
