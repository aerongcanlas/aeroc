import { BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { firebaseAuth, googleProvider } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
} from 'firebase/auth';
import { useState } from 'react';
import { getFriendlyError } from './utils';

export default function AuthPanel() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const signInWithEmail = async () => {
        setError('');

        try {
            await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (authError) {
            setError(getFriendlyError(authError));
        }
    };

    const createAccount = async () => {
        setError('');

        try {
            await createUserWithEmailAndPassword(firebaseAuth, email, password);
        } catch (authError) {
            setError(getFriendlyError(authError));
        }
    };

    const signInGoogle = async () => {
        setError('');

        try {
            await signInWithPopup(firebaseAuth, googleProvider);
        } catch (authError) {
            setError(getFriendlyError(authError));
        }
    };

    return (
        <BoxColumn className='mx-auto min-h-screen w-full max-w-4xl justify-center gap-6 px-5 py-12 text-white sm:px-8'>
            <BoxColumn className='gap-6 rounded-3xl border border-white/10 bg-black/40 p-6 backdrop-blur-md sm:p-8'>
                <BoxColumn className='gap-3'>
                    <Text className='text-sm font-semibold uppercase tracking-[0.3em] text-white/55'>
                        EDC planner
                    </Text>
                    <Text className='text-4xl font-semibold tracking-tight sm:text-6xl'>
                        Pick sets with your crew
                    </Text>
                    <Text className='max-w-2xl text-base leading-8 text-white/72'>
                        Sign in to build your festival profile, join a group,
                        and mark the sets you want on the shared schedule.
                    </Text>
                </BoxColumn>

                <BoxColumn className='gap-3'>
                    <input
                        className='rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60'
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder='Email'
                        type='email'
                        value={email}
                    />
                    <input
                        className='rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60'
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder='Password'
                        type='password'
                        value={password}
                    />
                </BoxColumn>

                <BoxRow className='flex-wrap gap-3'>
                    <button
                        className='rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50'
                        onClick={signInWithEmail}
                        type='button'>
                        Sign in
                    </button>
                    <button
                        className='rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14'
                        onClick={createAccount}
                        type='button'>
                        Create account
                    </button>
                    <button
                        className='rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14'
                        onClick={signInGoogle}
                        type='button'>
                        Continue with Google
                    </button>
                </BoxRow>

                {error ? (
                    <Text className='text-sm text-red-200'>{error}</Text>
                ) : null}
            </BoxColumn>
        </BoxColumn>
    );
}
