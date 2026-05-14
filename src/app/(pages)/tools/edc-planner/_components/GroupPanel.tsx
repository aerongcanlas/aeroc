import { BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { firestore } from '@/lib/firebase';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    onSnapshot,
    serverTimestamp,
    setDoc,
} from 'firebase/firestore';
import { ChevronDown, Copy, Plus, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Group, Profile } from './types';
import { getInviteLink } from './utils';

export default function GroupPanel({
    profile,
    activeGroupId,
    setActiveGroupId,
}: {
    profile: Profile;
    activeGroupId: string;
    setActiveGroupId: (groupId: string) => void;
}) {
    const [groupName, setGroupName] = useState('');
    const [joinId, setJoinId] = useState('');
    const [groups, setGroups] = useState<Group[]>([]);
    const [copied, setCopied] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        return onSnapshot(
            collection(firestore, 'users', profile.uid, 'groups'),
            (snapshot) => {
                setGroups(
                    snapshot.docs.map((groupDoc) => ({
                        id: groupDoc.id,
                        name: groupDoc.data().name ?? 'EDC group',
                    })),
                );
            },
        );
    }, [profile.uid]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const invitedGroupId = params.get('group');

        if (invitedGroupId) {
            setJoinId(invitedGroupId);
        }
    }, []);

    useEffect(() => {
        if (activeGroupId) {
            setIsExpanded(false);
        }
    }, [activeGroupId]);

    const joinGroup = async (groupId: string, name = 'EDC group') => {
        await setDoc(
            doc(firestore, 'groups', groupId, 'members', profile.uid),
            {
                ...profile,
                joinedAt: serverTimestamp(),
            },
        );
        await setDoc(doc(firestore, 'users', profile.uid, 'groups', groupId), {
            name,
            joinedAt: serverTimestamp(),
        });
        setActiveGroupId(groupId);
    };

    const createGroup = async () => {
        const groupRef = await addDoc(collection(firestore, 'groups'), {
            name: groupName.trim() || 'EDC group',
            createdBy: profile.uid,
            createdAt: serverTimestamp(),
        });

        await joinGroup(groupRef.id, groupName.trim() || 'EDC group');
        setGroupName('');
    };

    const joinExistingGroup = async () => {
        if (!joinId.trim()) {
            return;
        }

        const groupDoc = await getDoc(doc(firestore, 'groups', joinId.trim()));
        await joinGroup(joinId.trim(), groupDoc.data()?.name ?? 'EDC group');
        setJoinId('');
    };

    const copyInvite = async () => {
        if (!activeGroupId) {
            return;
        }

        await navigator.clipboard.writeText(getInviteLink(activeGroupId));
        setCopied('Invite link copied.');
    };

    const activeGroup = groups.find((group) => group.id === activeGroupId);
    const shouldShowGroupControls = !activeGroupId || isExpanded;

    return (
        <BoxColumn className='gap-4 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md sm:rounded-3xl sm:p-5'>
            <BoxRow className='min-w-0 flex-col items-stretch justify-between gap-4 sm:flex-row sm:flex-wrap sm:items-center'>
                <BoxColumn className='min-w-0 gap-1'>
                    <Text className='text-sm font-semibold uppercase tracking-[0.22em] text-white/45'>
                        Group
                    </Text>
                    <Text className='min-w-0 truncate text-2xl font-semibold'>
                        {activeGroupId
                            ? activeGroup?.name || 'EDC group'
                            : 'Your crew'}
                    </Text>
                </BoxColumn>
                {activeGroupId ? (
                    <BoxRow className='min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap'>
                        <button
                            className='inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14 sm:w-auto'
                            onClick={copyInvite}
                            type='button'>
                            <Copy className='h-4 w-4 shrink-0' />
                            <span className='truncate'>Copy invite</span>
                        </button>
                        <button
                            className='inline-flex w-full min-w-0 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14 sm:w-auto'
                            onClick={() =>
                                setIsExpanded((current) => !current)
                            }
                            type='button'>
                            <span className='truncate'>Change</span>
                            <ChevronDown
                                className={`h-4 w-4 shrink-0 transition ${
                                    isExpanded ? 'rotate-180' : ''
                                }`}
                            />
                        </button>
                    </BoxRow>
                ) : null}
            </BoxRow>

            {activeGroupId && !isExpanded ? (
                <BoxRow className='min-w-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/62'>
                    <Users className='h-4 w-4 shrink-0 text-cyan-100' />
                    <Text className='min-w-0 text-sm leading-5'>
                        Group selected. Friend picks and meetups are scoped to
                        this crew.
                    </Text>
                </BoxRow>
            ) : null}

            {shouldShowGroupControls ? (
                <>
                    <BoxRow className='flex-col gap-3 sm:flex-row sm:flex-wrap'>
                        <input
                            className='w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60 sm:min-w-56'
                            onChange={(event) =>
                                setGroupName(event.target.value)
                            }
                            placeholder='New group name'
                            value={groupName}
                        />
                        <button
                            className='inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50 sm:w-auto'
                            onClick={createGroup}
                            type='button'>
                            <Plus className='h-4 w-4' />
                            Create
                        </button>
                    </BoxRow>

                    <BoxRow className='flex-col gap-3 sm:flex-row sm:flex-wrap'>
                        <input
                            className='w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60 sm:min-w-56'
                            onChange={(event) => setJoinId(event.target.value)}
                            placeholder='Paste group id or open an invite link'
                            value={joinId}
                        />
                        <button
                            className='w-full rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14 sm:w-auto'
                            onClick={joinExistingGroup}
                            type='button'>
                            Join
                        </button>
                    </BoxRow>

                    {groups.length ? (
                        <BoxRow className='flex-wrap gap-2'>
                            {groups.map((group) => (
                                <button
                                    className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                                        activeGroupId === group.id
                                            ? 'border-white/30 bg-white text-black'
                                            : 'border-white/15 bg-white/8 text-white hover:bg-white/14'
                                    }`}
                                    key={group.id}
                                    onClick={() => setActiveGroupId(group.id)}
                                    type='button'>
                                    {group.name}
                                </button>
                            ))}
                        </BoxRow>
                    ) : null}
                </>
            ) : null}

            {copied ? (
                <Text className='text-sm text-cyan-100'>{copied}</Text>
            ) : null}
        </BoxColumn>
    );
}
