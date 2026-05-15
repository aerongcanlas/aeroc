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
import { Check, ChevronDown, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import Avatar from './Avatar';
import ScreenshotCalendar from './ScreenshotCalendar';
import type {
    FestivalSet,
    GroupMember,
    Meetup,
    Selection,
    Stage,
} from './types';
import {
    festivalId,
    getDisplayTime,
    getFriendlyError,
    getScheduleMinute,
    sortStages,
    stageColors,
} from './utils';

const dayOrder = ['Friday', 'Saturday', 'Sunday'];

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
    const [meetups, setMeetups] = useState<Meetup[]>([]);
    const [members, setMembers] = useState<GroupMember[]>([]);
    const [selections, setSelections] = useState<Record<string, Selection>>({});
    const [activeDay, setActiveDay] = useState('Friday');
    const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
    const [selectedStageIds, setSelectedStageIds] = useState<string[]>([]);
    const [isFriendsFilterOpen, setIsFriendsFilterOpen] = useState(false);
    const [isStagesFilterOpen, setIsStagesFilterOpen] = useState(false);
    const [viewMode, setViewMode] = useState<
        'pick' | 'friends' | 'screenshot'
    >('pick');
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
            query(
                collection(firestore, 'groups', activeGroupId, 'meetups'),
                orderBy('startTime'),
            ),
            (snapshot) => {
                setMeetups(
                    snapshot.docs.map((meetupDoc) => ({
                        id: meetupDoc.id,
                        title: meetupDoc.data().title ?? '',
                        location: meetupDoc.data().location ?? '',
                        day: meetupDoc.data().day ?? 'Friday',
                        startTime: meetupDoc.data().startTime ?? '',
                        endTime: meetupDoc.data().endTime ?? '',
                        createdBy: meetupDoc.data().createdBy ?? '',
                        createdByName: meetupDoc.data().createdByName ?? '',
                    })),
                );
            },
            (error) => {
                setScheduleError(
                    `Could not load meetups: ${getFriendlyError(error)}`,
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
        const loadedDays = Array.from(
            new Set([
                ...sets.map((set) => set.day),
                ...meetups.map((meetup) => meetup.day),
            ]),
        );
        const extraDays = loadedDays
            .filter((day) => !dayOrder.includes(day))
            .sort((a, b) => a.localeCompare(b));

        return [...dayOrder, ...extraDays];
    }, [meetups, sets]);

    const visibleSets = useMemo(() => {
        return sets
            .filter((set) => {
                const selectedUserIds = selections[set.id]?.userIds ?? [];

                if (set.day !== activeDay) {
                    return false;
                }

                if (
                    selectedStageIds.length > 0 &&
                    !selectedStageIds.includes(set.stageId)
                ) {
                    return false;
                }

                if (viewMode === 'friends' && selectedUserIds.length === 0) {
                    return false;
                }

                if (
                    selectedFriendIds.length > 0 &&
                    !selectedFriendIds.some((friendId) =>
                        selectedUserIds.includes(friendId),
                    )
                ) {
                    return false;
                }

                return true;
            })
            .sort(
                (a, b) =>
                    getScheduleMinute(a.startTime) -
                        getScheduleMinute(b.startTime) ||
                    a.artist.localeCompare(b.artist),
            );
    }, [
        activeDay,
        selectedFriendIds,
        selectedStageIds,
        selections,
        sets,
        viewMode,
    ]);

    const visibleStages = useMemo(
        () =>
            stages.filter(
                (stage) =>
                    selectedStageIds.length === 0 ||
                    selectedStageIds.includes(stage.id),
            ),
        [selectedStageIds, stages],
    );

    const visibleMeetups = useMemo(
        () => meetups.filter((meetup) => meetup.day === activeDay),
        [activeDay, meetups],
    );

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

    const removeMeetup = async (meetupId: string) => {
        await deleteDoc(
            doc(firestore, 'groups', activeGroupId, 'meetups', meetupId),
        );
    };

    const toggleFriendFilter = (friendId: string) => {
        setSelectedFriendIds((currentFriendIds) =>
            currentFriendIds.includes(friendId)
                ? currentFriendIds.filter(
                      (currentFriendId) => currentFriendId !== friendId,
                  )
                : [...currentFriendIds, friendId],
        );
    };

    const toggleStageFilter = (stageId: string) => {
        setSelectedStageIds((currentStageIds) =>
            currentStageIds.includes(stageId)
                ? currentStageIds.filter(
                      (currentStageId) => currentStageId !== stageId,
                  )
                : [...currentStageIds, stageId],
        );
    };

    return (
        <BoxColumn className='min-w-0 gap-5 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md sm:rounded-3xl sm:p-5'>
            <BoxRow className='flex-wrap items-center justify-between gap-4'>
                <BoxColumn className='gap-1'>
                    <Text className='text-sm font-semibold uppercase tracking-[0.22em] text-white/45'>
                        Schedule
                    </Text>
                    <Text className='text-2xl font-semibold'>Shared picks</Text>
                    <Text className='text-sm text-white/52'>
                        {sets.filter((set) => set.day === activeDay).length}{' '}
                        sets and {visibleMeetups.length} meetups loaded for{' '}
                        {activeDay}
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

            <BoxRow className='flex-col gap-3 sm:flex-row sm:flex-wrap'>
                <button
                    className={`w-full rounded-full border px-4 py-2 text-sm font-medium transition sm:w-auto ${
                        viewMode === 'pick'
                            ? 'border-white/30 bg-white text-black'
                            : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                    }`}
                    onClick={() => setViewMode('pick')}
                    type='button'>
                    Pick view
                </button>
                <button
                    className={`w-full rounded-full border px-4 py-2 text-sm font-medium transition sm:w-auto ${
                        viewMode === 'friends'
                            ? 'border-white/30 bg-white text-black'
                            : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                    }`}
                    onClick={() => setViewMode('friends')}
                    type='button'>
                    Friends view
                </button>
                <button
                    className={`w-full rounded-full border px-4 py-2 text-sm font-medium transition sm:w-auto ${
                        viewMode === 'screenshot'
                            ? 'border-white/30 bg-white text-black'
                            : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                    }`}
                    onClick={() => setViewMode('screenshot')}
                    type='button'>
                    Calendar View
                </button>
                <BoxColumn className='relative w-full gap-2 sm:w-auto sm:min-w-64'>
                    <button
                        className='flex w-full items-center justify-between gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14'
                        onClick={() =>
                            setIsFriendsFilterOpen((isOpen) => !isOpen)
                        }
                        type='button'>
                        <Text>Filter by Friends</Text>
                        <BoxRow className='items-center gap-2 text-white/55'>
                            <Text className='text-xs'>
                                {selectedFriendIds.length
                                    ? `${selectedFriendIds.length} selected`
                                    : 'All friends'}
                            </Text>
                            <ChevronDown
                                className={`h-4 w-4 transition ${
                                    isFriendsFilterOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </BoxRow>
                    </button>
                    {isFriendsFilterOpen ? (
                        <BoxColumn className='gap-3 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-md'>
                            <BoxRow className='items-center justify-between gap-3'>
                                <Text className='text-sm font-medium text-white/72'>
                                    All friends
                                </Text>
                                <button
                                    className='text-xs font-medium text-cyan-100 transition hover:text-white'
                                    onClick={() => setSelectedFriendIds([])}
                                    type='button'>
                                    Clear
                                </button>
                            </BoxRow>
                            <BoxRow className='flex-wrap gap-2'>
                                {[
                                    {
                                        uid: currentUserId,
                                        firstName: 'My',
                                        lastName: 'Sets',
                                    },
                                    ...members.filter(
                                        (member) =>
                                            member.uid !== currentUserId,
                                    ),
                                ].map((member) => {
                                    const isSelected =
                                        selectedFriendIds.includes(member.uid);

                                    return (
                                        <label
                                            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                                                isSelected
                                                    ? 'border-white/30 bg-white text-black'
                                                    : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                                            }`}
                                            key={member.uid}>
                                            <input
                                                checked={isSelected}
                                                className='sr-only'
                                                onChange={() =>
                                                    toggleFriendFilter(
                                                        member.uid,
                                                    )
                                                }
                                                type='checkbox'
                                            />
                                            {isSelected ? (
                                                <Check className='h-3.5 w-3.5' />
                                            ) : null}
                                            {member.firstName}{' '}
                                            {member.lastName}
                                        </label>
                                    );
                                })}
                            </BoxRow>
                        </BoxColumn>
                    ) : null}
                </BoxColumn>
                <BoxColumn className='relative w-full gap-2 sm:w-auto sm:min-w-64'>
                    <button
                        className='flex w-full items-center justify-between gap-3 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14'
                        onClick={() =>
                            setIsStagesFilterOpen((isOpen) => !isOpen)
                        }
                        type='button'>
                        <Text>Filter by Stages</Text>
                        <BoxRow className='items-center gap-2 text-white/55'>
                            <Text className='text-xs'>
                                {selectedStageIds.length
                                    ? `${selectedStageIds.length} selected`
                                    : 'All stages'}
                            </Text>
                            <ChevronDown
                                className={`h-4 w-4 transition ${
                                    isStagesFilterOpen ? 'rotate-180' : ''
                                }`}
                            />
                        </BoxRow>
                    </button>
                    {isStagesFilterOpen ? (
                        <BoxColumn className='gap-3 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl backdrop-blur-md'>
                            <BoxRow className='items-center justify-between gap-3'>
                                <Text className='text-sm font-medium text-white/72'>
                                    All stages
                                </Text>
                                <button
                                    className='text-xs font-medium text-cyan-100 transition hover:text-white'
                                    onClick={() => setSelectedStageIds([])}
                                    type='button'>
                                    Clear
                                </button>
                            </BoxRow>
                            <BoxRow className='flex-wrap gap-2'>
                                {stages.map((stage) => {
                                    const isSelected =
                                        selectedStageIds.includes(stage.id);

                                    return (
                                        <label
                                            className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition ${
                                                isSelected
                                                    ? 'border-white/30 bg-white text-black'
                                                    : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                                            }`}
                                            key={stage.id}>
                                            <input
                                                checked={isSelected}
                                                className='sr-only'
                                                onChange={() =>
                                                    toggleStageFilter(stage.id)
                                                }
                                                type='checkbox'
                                            />
                                            <Box
                                                className='h-2.5 w-2.5 rounded-full'
                                                style={{
                                                    backgroundColor:
                                                        stage.color,
                                                }}
                                            />
                                            {isSelected ? (
                                                <Check className='h-3.5 w-3.5' />
                                            ) : null}
                                            {stage.name}
                                        </label>
                                    );
                                })}
                            </BoxRow>
                        </BoxColumn>
                    ) : null}
                </BoxColumn>
            </BoxRow>

            {viewMode === 'screenshot' ? (
                <ScreenshotCalendar
                    activeDay={activeDay}
                    days={days}
                    meetups={meetups}
                    selectedFriendIds={selectedFriendIds}
                    selectedStageIds={selectedStageIds}
                    selections={selections}
                    sets={sets}
                    stages={stages}
                />
            ) : (
                <BoxColumn className='gap-4'>
                    {visibleMeetups.length ? (
                        <BoxColumn className='gap-3 rounded-2xl border border-cyan-200/15 bg-cyan-300/8 p-4'>
                            <Text className='text-sm font-semibold uppercase tracking-[0.2em] text-cyan-100/70'>
                                Meetups
                            </Text>
                            <Box className='grid min-w-0 gap-3 sm:grid-cols-2'>
                                {visibleMeetups.map((meetup) => {
                                    return (
                                        <Box
                                            className='rounded-2xl border border-cyan-100/15 bg-black/25 p-4'
                                            key={meetup.id}>
                                            <BoxRow className='min-w-0 flex-wrap items-start justify-between gap-3'>
                                                <BoxColumn className='gap-1'>
                                                    <Text className='break-words text-lg font-semibold'>
                                                        {meetup.title}
                                                    </Text>
                                                    <Text className='text-sm text-cyan-50/70'>
                                                        {getDisplayTime(
                                                            meetup.startTime,
                                                        )}{' '}
                                                        -{' '}
                                                        {getDisplayTime(
                                                            meetup.endTime,
                                                        )}
                                                    </Text>
                                                    {meetup.location ? (
                                                        <Text className='text-sm text-white/62'>
                                                            {meetup.location}
                                                        </Text>
                                                    ) : null}
                                                    <Text className='text-xs text-white/45'>
                                                        Added by{' '}
                                                        {meetup.createdByName ||
                                                            'a group member'}
                                                    </Text>
                                                </BoxColumn>
                                                <button
                                                    className='inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-red-400/20'
                                                    onClick={() =>
                                                        removeMeetup(meetup.id)
                                                    }
                                                    title='Delete meetup'
                                                    type='button'>
                                                    <Trash2 className='h-4 w-4' />
                                                </button>
                                            </BoxRow>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </BoxColumn>
                    ) : null}

                    <Box className='flex min-w-0 snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:snap-none lg:grid-cols-2 lg:overflow-visible lg:pb-0'>
                        {visibleStages.map((stage) => {
                            const stageSets = visibleSets.filter(
                                (set) => set.stageId === stage.id,
                            );

                            return (
                                <BoxColumn
                                    className='min-h-64 min-w-[88%] snap-start gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 sm:min-w-[72%] lg:min-w-0'
                                    key={stage.id}>
                                    <BoxRow className='items-center gap-3'>
                                        <Box
                                            className='h-4 w-4 rounded-full'
                                            style={{
                                                backgroundColor: stage.color,
                                            }}
                                        />
                                        <Text className='text-lg font-semibold'>
                                            {stage.name}
                                        </Text>
                                    </BoxRow>

                                    {stageSets.length ? (
                                        stageSets.map((set) => {
                                            const selectedUserIds =
                                                selections[set.id]?.userIds ??
                                                [];
                                            const selectedMembers =
                                                selectedUserIds
                                                    .map(
                                                        (userId) =>
                                                            memberById[userId],
                                                    )
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
                                                    <BoxRow className='min-w-0 flex-wrap items-start justify-between gap-3'>
                                                        <BoxColumn className='gap-1'>
                                                            <Text className='break-words text-lg font-semibold'>
                                                                {set.artist}
                                                            </Text>
                                                            <Text className='text-sm text-white/62'>
                                                                {getDisplayTime(
                                                                    set.startTime,
                                                                )}{' '}
                                                                -{' '}
                                                                {getDisplayTime(
                                                                    set.endTime,
                                                                )}
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
                                                            No one has picked
                                                            this yet.
                                                        </Text>
                                                    )}
                                                </Box>
                                            );
                                        })
                                    ) : (
                                        <Text className='rounded-2xl border border-white/8 bg-white/3 p-4 text-sm text-white/45'>
                                            No sets for this stage on{' '}
                                            {activeDay}
                                            {viewMode === 'friends'
                                                ? ' that anyone has picked.'
                                                : selectedFriendIds.length >
                                                        0 ||
                                                    selectedStageIds.length > 0
                                                  ? ' with the current filters.'
                                                  : '.'}
                                        </Text>
                                    )}
                                </BoxColumn>
                            );
                        })}
                    </Box>
                </BoxColumn>
            )}
        </BoxColumn>
    );
}
