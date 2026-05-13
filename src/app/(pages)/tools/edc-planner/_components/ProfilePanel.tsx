import { BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { firebaseStorage, firestore } from '@/lib/firebase';
import type { User } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import { getFriendlyError, getInitials } from './utils';

export default function ProfilePanel({ user }: { user: User }) {
    const [firstName, setFirstName] = useState(
        user.displayName?.split(' ')[0] ?? '',
    );
    const [lastName, setLastName] = useState(
        user.displayName?.split(' ').slice(1).join(' ') ?? '',
    );
    const [photo, setPhoto] = useState<File | null>(null);
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
            let photoURL = user.photoURL ?? '';

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
                } catch (photoError) {
                    setWarning(
                        `Profile will save with initials because photo upload failed: ${getFriendlyError(photoError)}`,
                    );
                }
            }

            await setDoc(doc(firestore, 'users', user.uid), {
                uid: user.uid,
                firstName: firstName.trim(),
                lastName: lastName.trim(),
                initials: getInitials(firstName.trim(), lastName.trim()),
                photoURL,
                email: user.email ?? '',
                updatedAt: serverTimestamp(),
            });
        } catch (profileError) {
            setError(getFriendlyError(profileError));
        } finally {
            setSaving(false);
        }
    };

    return (
        <BoxColumn className='mx-auto min-h-screen w-full max-w-3xl justify-center gap-6 px-5 py-12 text-white sm:px-8'>
            <BoxColumn className='gap-6 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md sm:p-8'>
                <BoxColumn className='gap-3'>
                    <Text className='text-sm font-semibold uppercase tracking-[0.3em] text-white/55'>
                        Profile setup
                    </Text>
                    <Text className='text-4xl font-semibold tracking-tight'>
                        Add your festival face
                    </Text>
                    <Text className='text-base leading-8 text-white/72'>
                        Friends will see your photo on picked sets. If you skip
                        the photo, your initials will show instead.
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
                    <label className='flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white/75 transition hover:bg-white/10'>
                        <Camera className='h-4 w-4' />
                        {photo ? photo.name : 'Choose profile picture'}
                        <input
                            className='sr-only'
                            onChange={(event) =>
                                setPhoto(event.target.files?.[0] ?? null)
                            }
                            type='file'
                            accept='image/*'
                        />
                    </label>
                </BoxColumn>

                <BoxRow className='items-center gap-3'>
                    <button
                        className='rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50'
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
