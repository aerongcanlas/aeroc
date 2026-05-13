import { Box, BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { firestore } from '@/lib/firebase';
import {
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import { Check, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar';
import ScreenshotCalendar from './ScreenshotCalendar';
import type { FestivalSet, GroupMember, Selection, Stage } from './types';
import { festivalId, getFriendlyError, sortStages, stageColors } from './utils';

export default function ScheduleBoard({
    activeGroupId,
    currentUserId,
    isAdmin,
}: {
    activeGroupId: string;
    currentUserId: string;
    isAdmin: boolean;
}) {
    const [stages, setStages] = useState<Stage[]>([]);
    const [sets, setSets] = useState<FestivalSet[]>([]);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [selections, setSelections] = useState<Record<string, Selection>>({});
    const [activeDay, setActiveDay] = useState('Friday');
    const [friendFilter, setFriendFilter] = useState('all');
    const [onlyMine, setOnlyMine] = useState(false);
    const [viewMode, setViewMode] = useState<'pick' | 'screenshot'>('pick');
    const [scheduleError, setScheduleError] = useState('');

    useEffect(() => {
        return onSnapshot(
            query(
                collection(firestore, 'festivals', festivalId, 'stages'),
                orderBy('name'),
            ),
            (snapshot) => {
                setScheduleError('');
                const nextStages = snapshot.docs.map((stageDoc) => ({
                        id: stageDoc.id,
                        name: stageDoc.data().name ?? '',
                        color: stageDoc.data().color ?? stageColors[0],
                        order: stageDoc.data().order,
                    }));

                setStages(sortStages(nextStages));
            },
            (error) => {
                setScheduleError(
                    `Could not load stages: ${getFriendlyError(error)}`,
                );
            },
        );
    }, []);

    useEffect(() => {
        return onSnapshot(
            query(
                collection(firestore, 'festivals', festivalId, 'sets'),
                orderBy('startTime'),
            ),
            (snapshot) => {
                setScheduleError('');
                setSets(
                    snapshot.docs.map((setDoc) => ({
                        id: setDoc.id,
                        artist: setDoc.data().artist ?? '',
                        day: setDoc.data().day ?? 'Friday',
                        stageId: setDoc.data().stageId ?? '',
                        startTime: setDoc.data().startTime ?? '',
                        endTime: setDoc.data().endTime ?? '',
                    })),
                );
            },
            (error) => {
                setScheduleError(
                    `Could not load sets: ${getFriendlyError(error)}`,
                );
            },
        );
    }, []);

    useEffect(() => {
        if (!activeGroupId) {
            return;
        }

        return onSnapshot(
            collection(firestore, 'groups', activeGroupId, 'members'),
            (snapshot) => {
                setMembers(
                    snapshot.docs.map((memberDoc) => ({
                        uid: memberDoc.id,
                        firstName: memberDoc.data().firstName ?? '',
                        lastName: memberDoc.data().lastName ?? '',
                        initials: memberDoc.data().initials ?? '',
                        photoURL: memberDoc.data().photoURL ?? '',
                        email: memberDoc.data().email ?? '',
                    })),
                );
            },
        );
    }, [activeGroupId]);

    useEffect(() => {
        if (!activeGroupId) {
            return;
        }

        return onSnapshot(
            collection(firestore, 'groups', activeGroupId, 'setSelections'),
            (snapshot) => {
                setSelections(
                    Object.fromEntries(
                        snapshot.docs.map((selectionDoc) => [
                            selectionDoc.id,
                            {
                                id: selectionDoc.id,
                                userIds: selectionDoc.data().userIds ?? [],
                            },
                        ]),
                    ),
                );
            },
        );
    }, [activeGroupId]);

    const memberById = useMemo(
        () => Object.fromEntries(members.map((member) => [member.uid, member])),
        [members],
    );

    const days = useMemo(() => {
        const setDays = Array.from(new Set(sets.map((set) => set.day)));
        return setDays.length ? setDays : ['Friday', 'Saturday', 'Sunday'];
    }, [sets]);

    const visibleSets = useMemo(() => {
        return sets.filter((set) => {
            const selectedUserIds = selections[set.id]?.userIds ?? [];

            if (set.day !== activeDay) {
                return false;
            }

            if (onlyMine && !selectedUserIds.includes(currentUserId)) {
                return false;
            }

            if (
                friendFilter !== 'all' &&
                !selectedUserIds.includes(friendFilter)
            ) {
                return false;
            }

            return true;
        });
    }, [activeDay, currentUserId, friendFilter, onlyMine, selections, sets]);

    const toggleSet = async (setId: string) => {
        const selectionRef = doc(
            firestore,
            'groups',
            activeGroupId,
            'setSelections',
            setId,
        );
        const selectedUserIds = selections[setId]?.userIds ?? [];

        await setDoc(
            selectionRef,
            {
                userIds: selectedUserIds.includes(currentUserId)
                    ? arrayRemove(currentUserId)
                    : arrayUnion(currentUserId),
                updatedAt: serverTimestamp(),
            },
            { merge: true },
        );
    };

    const removeSet = async (setId: string) => {
        await deleteDoc(doc(firestore, 'festivals', festivalId, 'sets', setId));
    };

    return (
        <BoxColumn className='gap-5 rounded-3xl border border-white/10 bg-black/35 p-5 backdrop-blur-md'>
            <BoxRow className='flex-wrap items-center justify-between gap-4'>
                <BoxColumn className='gap-1'>
                    <Text className='text-sm font-semibold uppercase tracking-[0.22em] text-white/45'>
                        Schedule
                    </Text>
                    <Text className='text-2xl font-semibold'>Shared picks</Text>
                    <Text className='text-sm text-white/52'>
                        {sets.filter((set) => set.day === activeDay).length}{' '}
                        sets loaded for {activeDay}
                    </Text>
                </BoxColumn>
                <BoxRow className='flex-wrap gap-2'>
                    {days.map((dayOption) => (
                        <button
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                activeDay === dayOption
                                    ? 'border-white/30 bg-white text-black'
                                    : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                            }`}
                            key={dayOption}
                            onClick={() => setActiveDay(dayOption)}
                            type='button'>
                            {dayOption}
                        </button>
                    ))}
                </BoxRow>
            </BoxRow>

            {scheduleError ? (
                <Text className='rounded-2xl border border-red-200/20 bg-red-500/10 px-4 py-3 text-sm text-red-100'>
                    {scheduleError}
                </Text>
            ) : null}

            <BoxRow className='flex-wrap gap-3'>
                <button
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        viewMode === 'pick'
                            ? 'border-white/30 bg-white text-black'
                            : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                    }`}
                    onClick={() => setViewMode('pick')}
                    type='button'>
                    Pick view
                </button>
                <button
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        viewMode === 'screenshot'
                            ? 'border-white/30 bg-white text-black'
                            : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                    }`}
                    onClick={() => setViewMode('screenshot')}
                    type='button'>
                    Screenshot view
                </button>
                <button
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        onlyMine
                            ? 'border-white/30 bg-white text-black'
                            : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                    }`}
                    onClick={() => setOnlyMine((current) => !current)}
                    type='button'>
                    My sets
                </button>
                <select
                    className='rounded-2xl border border-white/10 bg-black/80 px-4 py-2 text-sm text-white outline-none focus:border-cyan-200/60'
                    onChange={(event) => setFriendFilter(event.target.value)}
                    value={friendFilter}>
                    <option value='all'>All friends</option>
                    {members.map((member) => (
                        <option
                            key={member.uid}
                            value={member.uid}>
                            {member.firstName} {member.lastName}
                        </option>
                    ))}
                </select>
            </BoxRow>

            {viewMode === 'screenshot' ? (
                <ScreenshotCalendar
                    activeDay={activeDay}
                    currentUserId={currentUserId}
                    days={days}
                    friendFilter={friendFilter}
                    memberById={memberById}
                    onlyMine={onlyMine}
                    selections={selections}
                    sets={sets}
                    stages={stages}
                />
            ) : (
                <Box className='grid gap-4 lg:grid-cols-2'>
                    {stages.map((stage) => {
                        const stageSets = visibleSets.filter(
                            (set) => set.stageId === stage.id,
                        );

                        return (
                            <BoxColumn
                                className='min-h-64 gap-3 rounded-2xl border border-white/10 bg-black/25 p-4'
                                key={stage.id}>
                                <BoxRow className='items-center gap-3'>
                                    <Box
                                        className='h-4 w-4 rounded-full'
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <Text className='text-lg font-semibold'>
                                        {stage.name}
                                    </Text>
                                </BoxRow>

                                {stageSets.length ? (
                                    stageSets.map((set) => {
                                        const selectedUserIds =
                                            selections[set.id]?.userIds ?? [];
                                        const selectedMembers = selectedUserIds
                                            .map((userId) => memberById[userId])
                                            .filter(Boolean);
                                        const isSelectedByMe =
                                            selectedUserIds.includes(
                                                currentUserId,
                                            );

                                        return (
                                            <Box
                                                className={`rounded-2xl border p-4 transition ${
                                                    selectedUserIds.length
                                                        ? 'border-white/15 bg-white/8'
                                                        : 'border-white/8 bg-white/3 opacity-55'
                                                }`}
                                                key={set.id}
                                                style={{
                                                    borderLeftColor:
                                                        stage.color,
                                                    borderLeftWidth: 5,
                                                }}>
                                                <BoxRow className='items-start justify-between gap-3'>
                                                    <BoxColumn className='gap-1'>
                                                        <Text className='text-lg font-semibold'>
                                                            {set.artist}
                                                        </Text>
                                                        <Text className='text-sm text-white/62'>
                                                            {set.startTime} -{' '}
                                                            {set.endTime}
                                                        </Text>
                                                    </BoxColumn>
                                                    <BoxRow className='gap-2'>
                                                        <button
                                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
                                                                isSelectedByMe
                                                                    ? 'border-emerald-200/50 bg-emerald-300/20 text-emerald-100'
                                                                    : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                                                            }`}
                                                            onClick={() =>
                                                                toggleSet(
                                                                    set.id,
                                                                )
                                                            }
                                                            title='Toggle my pick'
                                                            type='button'>
                                                            <Check className='h-4 w-4' />
                                                        </button>
                                                        {isAdmin ? (
                                                            <button
                                                                className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-red-400/20'
                                                                onClick={() =>
                                                                    removeSet(
                                                                        set.id,
                                                                    )
                                                                }
                                                                title='Delete set'
                                                                type='button'>
                                                                <Trash2 className='h-4 w-4' />
                                                            </button>
                                                        ) : null}
                                                    </BoxRow>
                                                </BoxRow>

                                                {selectedMembers.length ? (
                                                    <BoxRow className='mt-4 flex-wrap gap-2'>
                                                        {selectedMembers.map(
                                                            (member) => (
                                                                <Avatar
                                                                    key={
                                                                        member.uid
                                                                    }
                                                                    member={
                                                                        member
                                                                    }
                                                                    size='sm'
                                                                />
                                                            ),
                                                        )}
                                                    </BoxRow>
                                                ) : (
                                                    <Text className='mt-4 text-sm text-white/45'>
                                                        No one has picked this
                                                        yet.
                                                    </Text>
                                                )}
                                            </Box>
                                        );
                                    })
                                ) : (
                                    <Text className='rounded-2xl border border-white/8 bg-white/3 p-4 text-sm text-white/45'>
                                        No sets for this stage on {activeDay}
                                        {onlyMine || friendFilter !== 'all'
                                            ? ' with the current filters.'
                                            : '.'}
                                    </Text>
                                )}
                            </BoxColumn>
                        );
                    })}
                </Box>
            )}
        </BoxColumn>
    );
}
