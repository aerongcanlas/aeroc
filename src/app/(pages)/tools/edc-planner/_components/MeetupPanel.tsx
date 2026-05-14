import { BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { firestore } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import type { Profile } from './types';
import { getFriendlyError } from './utils';

export default function MeetupPanel({
    activeGroupId,
    profile,
}: {
    activeGroupId: string;
    profile: Profile;
}) {
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [day, setDay] = useState('Friday');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [meetupStatus, setMeetupStatus] = useState('');
    const [meetupError, setMeetupError] = useState('');

    const addMeetup = async () => {
        setMeetupStatus('');
        setMeetupError('');

        if (!activeGroupId) {
            setMeetupError('Create or join a group before adding meetups.');
            return;
        }

        if (!title.trim() || !startTime || !endTime) {
            setMeetupError('Add a meetup name, start time, and end time first.');
            return;
        }

        try {
            await addDoc(
                collection(firestore, 'groups', activeGroupId, 'meetups'),
                {
                    title: title.trim(),
                    location: location.trim(),
                    day,
                    startTime,
                    endTime,
                    createdBy: profile.uid,
                    createdByName:
                        `${profile.firstName} ${profile.lastName}`.trim() ||
                        profile.email,
                    createdAt: serverTimestamp(),
                },
            );

            setMeetupStatus(`Added meetup: ${title.trim()}`);
            setTitle('');
            setLocation('');
            setStartTime('');
            setEndTime('');
        } catch (error) {
            setMeetupError(`Could not add meetup: ${getFriendlyError(error)}`);
        }
    };

    return (
        <BoxColumn className='gap-5 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md sm:rounded-3xl sm:p-5'>
            <BoxRow className='items-center gap-2'>
                <CalendarPlus className='h-5 w-5 text-cyan-100' />
                <Text className='text-2xl font-semibold'>Meetup times</Text>
            </BoxRow>

            <BoxColumn className='gap-3 rounded-2xl border border-white/10 bg-white/5 p-4'>
                <Text className='text-sm font-semibold uppercase tracking-[0.2em] text-white/45'>
                    Group meetup
                </Text>
                <BoxRow className='flex-col gap-3 sm:flex-row sm:flex-wrap'>
                    <input
                        className='w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60 sm:min-w-56'
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder='Meetup name'
                        value={title}
                    />
                    <input
                        className='w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60 sm:min-w-56'
                        onChange={(event) => setLocation(event.target.value)}
                        placeholder='Location'
                        value={location}
                    />
                    <select
                        className='w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-cyan-200/60 sm:w-auto'
                        onChange={(event) => setDay(event.target.value)}
                        value={day}>
                        <option>Friday</option>
                        <option>Saturday</option>
                        <option>Sunday</option>
                    </select>
                    <input
                        className='w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none focus:border-cyan-200/60 sm:w-auto'
                        onChange={(event) => setStartTime(event.target.value)}
                        type='time'
                        value={startTime}
                    />
                    <input
                        className='w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none focus:border-cyan-200/60 sm:w-auto'
                        onChange={(event) => setEndTime(event.target.value)}
                        type='time'
                        value={endTime}
                    />
                    <button
                        className='w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50 sm:w-auto'
                        onClick={addMeetup}
                        type='button'>
                        Add meetup
                    </button>
                </BoxRow>
                <Text className='text-sm leading-6 text-white/55'>
                    Meetups are shared with this group and can overlap with any
                    set time.
                </Text>
            </BoxColumn>

            {meetupStatus ? (
                <Text className='text-sm text-emerald-100'>
                    {meetupStatus}
                </Text>
            ) : null}
            {meetupError ? (
                <Text className='text-sm text-red-200'>{meetupError}</Text>
            ) : null}
        </BoxColumn>
    );
}
