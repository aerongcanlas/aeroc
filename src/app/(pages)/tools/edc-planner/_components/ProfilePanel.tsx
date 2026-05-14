import { BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { firebaseStorage, firestore } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import {
    collection,
    doc,
    getDocs,
    serverTimestamp,
    setDoc,
    writeBatch,
} from 'firebase/firestore';
import {
    deleteObject,
    getDownloadURL,
    ref,
    uploadBytes,
} from 'firebase/storage';
import { Camera, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { Profile } from './types';
import { getFriendlyError, getInitials } from './utils';

export default function ProfilePanel({
    compact = false,
    onSaved,
    profile,
    user,
}: {
    compact?: boolean;
    onSaved?: () => void;
    profile?: Profile;
    user: User;
}) {
    const [firstName, setFirstName] = useState(
        profile?.firstName ?? user.displayName?.split(' ')[0] ?? '',
    );
    const [lastName, setLastName] = useState(
        profile?.lastName ??
            user.displayName?.split(' ').slice(1).join(' ') ??
            '',
    );
    const [photo, setPhoto] = useState<File | null>(null);
    const [removePhoto, setRemovePhoto] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const [saving, setSaving] = useState(false);

    const saveProfile = async () => {
        if (!firstName.trim() || !lastName.trim()) {
            setError('First and last name are required.');
            return;
        }

        setSaving(true);
        setError('');
        setWarning('');

        try {
            let photoURL = profile?.photoURL ?? user.photoURL ?? '';

            if (removePhoto) {
                try {
                    await deleteObject(
                        ref(
                            firebaseStorage,
                            `profile-pictures/${user.uid}/avatar`,
                        ),
                    );
                } catch {
                    // The profile should still save even if there is no stored file.
                }

                photoURL = '';
            }

            if (photo) {
                try {
                    const imageRef = ref(
                        firebaseStorage,
                        `profile-pictures/${user.uid}/avatar`,
                    );
                    await uploadBytes(imageRef, photo, {
                        contentType: photo.type,
                    });
                    photoURL = await getDownloadURL(imageRef);
                    setRemovePhoto(false);
                } catch (photoError) {
                    setWarning(
                        `Profile saved, but photo upload failed: ${getFriendlyError(photoError)}`,
                    );
                }
            }

            const nextProfile = {
                uid: user.uid,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                initials: getInitials(firstName.trim(), lastName.trim()),
                photoURL,
                email: user.email ?? '',
                updatedAt: serverTimestamp(),
            };

            await setDoc(doc(firestore, 'users', user.uid), nextProfile);

            const userGroups = await getDocs(
                collection(firestore, 'users', user.uid, 'groups'),
            );

            if (!userGroups.empty) {
                const batch = writeBatch(firestore);

                userGroups.forEach((groupDoc) => {
                    batch.set(
                        doc(
                            firestore,
                            'groups',
                            groupDoc.id,
                            'members',
                            user.uid,
                        ),
                        nextProfile,
                        { merge: true },
                    );
                });

                await batch.commit();
            }

            setPhoto(null);
            onSaved?.();
        } catch (profileError) {
            setError(getFriendlyError(profileError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <BoxColumn
            className={
                compact
                    ? 'w-full gap-6 text-white'
                    : 'mx-auto min-h-screen w-full max-w-3xl justify-center gap-6 overflow-x-hidden px-3 py-8 text-white sm:px-8 sm:py-12'
            }>
            <BoxColumn className='gap-6 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md sm:rounded-3xl sm:p-8'>
                <BoxColumn className='gap-3'>
                    <Text className='text-sm font-semibold uppercase tracking-[0.3em] text-white/55'>
                        {compact ? 'Edit profile' : 'Profile setup'}
                    </Text>
                    <Text className='text-3xl font-semibold tracking-tight sm:text-4xl'>
                        {compact
                            ? 'Update your festival face'
                            : 'Add your festival face'}
                    </Text>
                    <Text className='text-base leading-8 text-white/72'>
                        Friends will see your name and photo on picked sets. If
                        you skip the photo, your initials will show instead.
                    </Text>
                </BoxColumn>

                <BoxColumn className='gap-3'>
                    <input
                        className='rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60'
                        onChange={(event) => setFirstName(event.target.value)}
                        placeholder='First name'
                        value={firstName}
                    />
                    <input
                        className='rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60'
                        onChange={(event) => setLastName(event.target.value)}
                        placeholder='Last name'
                        value={lastName}
                    />
                    <label className='flex min-w-0 cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10'>
                        <Camera className='h-4 w-4' />
                        <Text className='min-w-0 truncate text-sm'>
                            {photo ? photo.name : 'Choose profile picture'}
                        </Text>
                        <input
                            className='sr-only'
                            onChange={(event) => {
                                setPhoto(event.target.files?.[0] ?? null);
                                setRemovePhoto(false);
                            }}
                            type='file'
                            accept='image/*'
                        />
                    </label>
                    {profile?.photoURL || photo ? (
                        <button
                            className='inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400/20 sm:w-auto'
                            onClick={() => {
                                setPhoto(null);
                                setRemovePhoto(true);
                            }}
                            type='button'>
                            <Trash2 className='h-4 w-4' />
                            Remove photo
                        </button>
                    ) : null}
                    {removePhoto ? (
                        <Text className='text-sm text-white/55'>
                            Photo will be removed when you save.
                        </Text>
                    ) : null}
                </BoxColumn>

                <BoxRow className='flex-col items-stretch gap-3 sm:flex-row sm:items-center'>
                    <button
                        className='w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50 sm:w-auto'
                        disabled={saving}
                        onClick={saveProfile}
                        type='button'>
                        {saving ? 'Saving...' : 'Save profile'}
                    </button>
                    {error ? (
                        <Text className='text-sm text-red-200'>{error}</Text>
                    ) : null}
                </BoxRow>
                {warning ? (
                    <Text className='text-sm leading-6 text-amber-100'>
                        {warning}
                    </Text>
                ) : null}
            </BoxColumn>
        </BoxColumn>
    );
}
