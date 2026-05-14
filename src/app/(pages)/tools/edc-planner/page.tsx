'use client';

import { firebaseAuth, firestore } from '@/lib/firebase';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { CalendarDays, LogOut, Sparkles, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Box, BoxColumn, BoxRow, Text } from '../../../_components/ui';
import AdminPanel from './_components/AdminPanel';
import AuthPanel from './_components/AuthPanel';
import Avatar from './_components/Avatar';
import GroupPanel from './_components/GroupPanel';
import MeetupPanel from './_components/MeetupPanel';
import ProfilePanel from './_components/ProfilePanel';
import ScheduleBoard from './_components/ScheduleBoard';
import type { Profile } from './_components/types';
import { getFriendlyError } from './_components/utils';

const adminEmails = (process.env.NEXT_PUBLIC_EDC_ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export default function EdcPlannerPage() {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [activeGroupId, setActiveGroupId] = useState('');
    const [profileError, setProfileError] = useState('');

    useEffect(() => {
        return onAuthStateChanged(firebaseAuth, (nextUser) => {
            setUser(nextUser);
        });
    }, []);

    useEffect(() => {
        if (!user) {
            setProfile(null);
            setProfileError('');
            return;
        }

        return onSnapshot(
            doc(firestore, 'users', user.uid),
            (snapshot) => {
                setProfileError('');
                setProfile(
                    snapshot.exists() ? (snapshot.data() as Profile) : null,
                );
            },
            (error) => {
                setProfileError(getFriendlyError(error));
            },
        );
    }, [user]);

    const isAdmin = Boolean(
        user?.email && adminEmails.includes(user.email.toLowerCase()),
    );

    if (!user) {
        return <AuthPanel />;
    }

    if (!profile) {
        return (
            <BoxColumn className='gap-4'>
                {profileError ? (
                    <Box className='mx-auto mt-8 max-w-3xl rounded-2xl border border-red-200/20 bg-red-500/10 px-5 py-4 text-sm text-red-100'>
                        Firestore blocked profile access: {profileError}
                    </Box>
                ) : null}
                <ProfilePanel user={user} />
            </BoxColumn>
        );
    }

    return (
        <BoxColumn className='mx-auto min-h-screen w-full max-w-7xl gap-4 overflow-x-hidden px-3 py-5 text-white sm:gap-5 sm:px-8 sm:py-8 lg:px-10'>
            <BoxColumn className='gap-5 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md sm:rounded-3xl sm:p-7'>
                <BoxRow className='flex-wrap items-center justify-between gap-4'>
                    <BoxColumn className='gap-3'>
                        <Text className='text-sm font-semibold uppercase tracking-[0.3em] text-white/55'>
                            EDC planner
                        </Text>
                        <Text className='text-3xl font-semibold tracking-tight sm:text-6xl'>
                            Electric Daisy Carnival
                        </Text>
                        <BoxRow className='flex-wrap items-center gap-3 text-white/70'>
                            <BoxRow className='items-center gap-2'>
                                <Sparkles className='h-4 w-4 text-cyan-100' />
                                <Text className='text-sm'>
                                    Screenshot-ready shared schedule
                                </Text>
                            </BoxRow>
                            <BoxRow className='items-center gap-2'>
                                <Users className='h-4 w-4 text-cyan-100' />
                                <Text className='text-sm'>
                                    Group-scoped friend picks
                                </Text>
                            </BoxRow>
                            <BoxRow className='items-center gap-2'>
                                <CalendarDays className='h-4 w-4 text-cyan-100' />
                                <Text className='text-sm'>
                                    Multiple days and stages
                                </Text>
                            </BoxRow>
                        </BoxRow>
                    </BoxColumn>

                    <BoxRow className='flex-wrap items-center gap-3'>
                        <Avatar member={profile} />
                        <button
                            className='inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14'
                            onClick={() => signOut(firebaseAuth)}
                            type='button'>
                            <LogOut className='h-4 w-4' />
                            Sign out
                        </button>
                    </BoxRow>
                </BoxRow>
            </BoxColumn>

            <Box className='grid min-w-0 gap-4 sm:gap-5 xl:grid-cols-[0.9fr_1.5fr]'>
                <BoxColumn className='contents min-w-0 gap-5 xl:order-1 xl:flex'>
                    <GroupPanel
                        activeGroupId={activeGroupId}
                        profile={profile}
                        setActiveGroupId={setActiveGroupId}
                    />
                    {activeGroupId ? (
                        <Box className='order-3 min-w-0 xl:order-none'>
                            <MeetupPanel
                                activeGroupId={activeGroupId}
                                profile={profile}
                            />
                        </Box>
                    ) : null}
                </BoxColumn>

                {activeGroupId ? (
                    <Box className='order-2 min-w-0 xl:order-2'>
                        <ScheduleBoard
                            activeGroupId={activeGroupId}
                            currentUserId={user.uid}
                            isAdmin={isAdmin}
                        />
                    </Box>
                ) : (
                    <BoxColumn className='min-w-0 justify-center gap-3 rounded-3xl border border-white/10 bg-black/25 p-8 text-white/70 xl:order-2'>
                        <Text className='text-2xl font-semibold text-white'>
                            Create or join a group first
                        </Text>
                        <Text className='max-w-xl text-base leading-8'>
                            Groups keep friend picks separate, so each invite
                            link gets its own shared schedule view.
                        </Text>
                    </BoxColumn>
                )}
                {isAdmin ? (
                    <Box className='order-4 min-w-0 xl:order-3'>
                        <AdminPanel />
                    </Box>
                ) : null}
            </Box>
        </BoxColumn>
    );
}
