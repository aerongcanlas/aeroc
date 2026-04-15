import { cn } from '@/lib/utils';
import { Box } from './Box';
import { BoxColumn } from './BoxColumn';

type Props = {
    className?: string;
    children?: React.ReactNode;
    variant?: 'default' | 'fadedEdges';
};

function Card({ className, children, variant = 'default' }: Props) {
    return (
        <Box
            className={cn(
                'fixed left-1/2 top-1/2 h-[33dvh] w-[33dvw] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-black/30 p-8 backdrop-blur-sm sm:p-12',
                variant === 'fadedEdges' &&
                    'overflow-hidden [mask-image:radial-gradient(circle_at_center,black_58%,transparent_100%)] [mask-repeat:no-repeat]',
                className,
            )}>
            {children ? <BoxColumn className='mt-10'>{children}</BoxColumn> : null}
        </Box>
    );
}

export { Card };
