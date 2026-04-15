import { Box, BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { cn } from '@/lib/utils';

type Props = {
    items: { href: string; label: string }[];
};

export default function PageNav({ items }: Props) {
    return (
        <Box className=''>
            <BoxColumn>
                {items.map((item, index) => {
                    return (
                        <BoxRow key={item.href}>
                            <Box
                                className={cn(
                                    'rounded-full bg-white h-3 w-3',
                                    // isActive && 'bg-blue-500',
                                )}
                            />
                            <Text className='text-sm text-white'>
                                {item.label}
                            </Text>
                        </BoxRow>
                    );
                })}
            </BoxColumn>
        </Box>
    );
}
