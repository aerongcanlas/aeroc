import { Box } from '@/app/_components/ui';
import type { GroupMember } from './types';

export default function Avatar({
    member,
    size = 'md',
}: {
    member: GroupMember;
    size?: 'sm' | 'md';
}) {
    const sizeClass =
        size === 'sm' ? 'h-7 w-7 text-[0.65rem]' : 'h-10 w-10 text-sm';

    if (member.photoURL) {
        return (
            <img
                alt={`${member.firstName} ${member.lastName}`}
                className={`${sizeClass} rounded-full border border-white/30 object-cover`}
                src={member.photoURL}
            />
        );
    }

    return (
        <Box
            className={`${sizeClass} flex items-center justify-center rounded-full border border-white/25 bg-white/15 font-semibold text-white`}>
            {member.initials}
        </Box>
    );
}
