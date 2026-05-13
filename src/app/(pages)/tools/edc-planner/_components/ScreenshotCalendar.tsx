import { Box, BoxRow, Text } from '@/app/_components/ui';
import Avatar from './Avatar';
import type { FestivalSet, GroupMember, Selection, Stage } from './types';
import {
    getDisplayTime,
    getScheduleMinute,
    scheduleStartMinutes,
} from './utils';

export default function ScreenshotCalendar({
    activeDay,
    currentUserId,
    days,
    friendFilter,
    memberById,
    onlyMine,
    selections,
    sets,
    stages,
}: {
    activeDay: string;
    currentUserId: string;
    days: string[];
    friendFilter: string;
    memberById: Record<string, GroupMember>;
    onlyMine: boolean;
    selections: Record<string, Selection>;
    sets: FestivalSet[];
    stages: Stage[];
}) {
    const hourHeight = 86;
    const hourLabels = [
        '07:00',
        '08:00',
        '09:00',
        '10:00',
        '11:00',
        '12:00',
        '01:00',
        '02:00',
        '03:00',
        '04:00',
        '05:00',
        '06:00',
    ];
    const dayNumber = Math.max(days.indexOf(activeDay) + 1, 1);
    const calendarHeight = (hourLabels.length - 1) * hourHeight;

    const getVisibleMembers = (setId: string) => {
        const selectedUserIds = selections[setId]?.userIds ?? [];
        let filteredUserIds = selectedUserIds;

        if (onlyMine) {
            filteredUserIds = filteredUserIds.filter(
                (userId) => userId === currentUserId,
            );
        }

        if (friendFilter !== 'all') {
            filteredUserIds = filteredUserIds.filter(
                (userId) => userId === friendFilter,
            );
        }

        return filteredUserIds
            .map((userId) => memberById[userId])
            .filter(Boolean);
    };

    return (
        <Box className='overflow-x-auto rounded-3xl bg-black p-4 shadow-2xl sm:p-7'>
            <Box
                className='min-w-245 bg-black text-white'
                style={{
                    gridTemplateColumns: `56px repeat(${Math.max(stages.length, 1)}, minmax(96px, 1fr))`,
                }}>
                <Text className='mb-9 text-center text-5xl font-black uppercase text-white sm:text-6xl'>
                    EDC DAY {dayNumber} -- {activeDay}
                </Text>

                <Box
                    className='grid gap-1.5'
                    style={{
                        gridTemplateColumns: `56px repeat(${Math.max(stages.length, 1)}, minmax(96px, 1fr))`,
                    }}>
                    <Box />
                    {stages.map((stage) => (
                        <Box
                            className='flex min-h-20 items-center justify-center rounded-t-sm px-2 text-center'
                            key={stage.id}
                            style={{ backgroundColor: stage.color }}>
                            <Text className='text-lg font-bold leading-6 text-black/75'>
                                {stage.name}
                            </Text>
                        </Box>
                    ))}
                </Box>

                <Box
                    className='grid gap-1.5'
                    style={{
                        gridTemplateColumns: `56px repeat(${Math.max(stages.length, 1)}, minmax(96px, 1fr))`,
                    }}>
                    <Box
                        className='relative'
                        style={{ height: calendarHeight }}>
                        {hourLabels.map((label, index) => (
                            <Box
                                className='absolute left-0 right-0'
                                key={label}
                                style={{ top: index * hourHeight }}>
                                <Text className='absolute -top-1 right-3 text-base font-semibold text-white/90'>
                                    {label}
                                </Text>
                            </Box>
                        ))}
                    </Box>

                    {stages.map((stage) => (
                        <Box
                            className='relative'
                            key={stage.id}
                            style={{ height: calendarHeight }}>
                            {hourLabels.map((label, index) => (
                                <Box
                                    className='absolute left-0 right-0'
                                    key={`${stage.id}-${label}`}
                                    style={{ top: index * hourHeight }}
                                />
                            ))}
                            {sets
                                .filter(
                                    (set) =>
                                        set.day === activeDay &&
                                        set.stageId === stage.id,
                                )
                                .map((set) => {
                                    const start = getScheduleMinute(
                                        set.startTime,
                                    );
                                    let end = getScheduleMinute(set.endTime);

                                    if (end <= start) {
                                        end += 24 * 60;
                                    }

                                    const top =
                                        ((start - scheduleStartMinutes) / 60) *
                                        hourHeight;
                                    const height = Math.max(
                                        ((end - start) / 60) * hourHeight - 3,
                                        58,
                                    );
                                    const visibleMembers = getVisibleMembers(
                                        set.id,
                                    );
                                    const isWanted = visibleMembers.length > 0;

                                    return (
                                        <Box
                                            className={`absolute left-0 right-0 flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-black px-2 py-2 text-center text-black transition ${
                                                isWanted
                                                    ? 'opacity-100'
                                                    : 'opacity-35 grayscale'
                                            }`}
                                            key={set.id}
                                            style={{
                                                backgroundColor: stage.color,
                                                top,
                                                height,
                                            }}>
                                            <Text className='text-[0.72rem] font-black uppercase leading-4 sm:text-sm'>
                                                {set.artist}
                                            </Text>
                                            <Text className='mt-1 text-[0.58rem] font-bold leading-3 text-black/65'>
                                                {getDisplayTime(set.startTime)}{' '}
                                                - {getDisplayTime(set.endTime)}
                                            </Text>
                                            {visibleMembers.length ? (
                                                <BoxRow className='mt-1 flex-wrap justify-center gap-1'>
                                                    {visibleMembers
                                                        .slice(0, 5)
                                                        .map((member) => (
                                                            <Avatar
                                                                key={member.uid}
                                                                member={member}
                                                                size='sm'
                                                            />
                                                        ))}
                                                </BoxRow>
                                            ) : null}
                                        </Box>
                                    );
                                })}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
