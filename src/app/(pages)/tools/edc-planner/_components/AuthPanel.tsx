import { BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { firebaseAuth, googleProvider } from '@/lib/firebase';
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
} from 'firebase/auth';
import { useState } from 'react';
import { getFriendlyError } from './utils';

export default function AuthPanel() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isResettingPassword, setIsResettingPassword] = useState(false);

    const signInWithEmail = async () => {
        setError('');
        setMessage('');

        try {
            await signInWithEmailAndPassword(firebaseAuth, email, password);
        } catch (authError) {
            setError(getFriendlyError(authError));
        }
    };

    const createAccount = async () => {
        setError('');
        setMessage('');

        try {
            await createUserWithEmailAndPassword(firebaseAuth, email, password);
        } catch (authError) {
            setError(getFriendlyError(authError));
        }
    };

    const signInGoogle = async () => {
        setError('');
        setMessage('');

        try {
            await signInWithPopup(firebaseAuth, googleProvider);
        } catch (authError) {
            setError(getFriendlyError(authError));
        }
    };

    const resetPassword = async () => {
        setError('');
        setMessage('');

        try {
            await sendPasswordResetEmail(firebaseAuth, email.trim());
            setMessage('Check your inbox for a password reset link.');
            setIsResettingPassword(false);
        } catch (authError) {
            setError(getFriendlyError(authError));
        }
    };

    return (
        <BoxColumn className='mx-auto min-h-screen w-full max-w-4xl justify-center gap-6 overflow-x-hidden px-3 py-8 text-white sm:px-8 sm:py-12'>
            <BoxColumn className='gap-6 rounded-2xl border border-white/10 bg-black/40 p-4 backdrop-blur-md sm:rounded-3xl sm:p-8'>
                <BoxColumn className='gap-3'>
                    <Text className='text-sm font-semibold uppercase tracking-[0.3em] text-white/55'>
                        EDC planner
                    </Text>
                    <Text className='text-3xl font-semibold tracking-tight sm:text-6xl'>
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
                        onChange={(event) => {
                            setEmail(event.target.value);
                            setError('');
                            setMessage('');
                        }}
                        placeholder='Email'
                        type='email'
                        value={email}
                    />
                    {isResettingPassword ? null : (
                        <input
                            className='rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60'
                            onChange={(event) => {
                                setPassword(event.target.value);
                                setError('');
                                setMessage('');
                            }}
                            placeholder='Password'
                            type='password'
                            value={password}
                        />
                    )}
                </BoxColumn>

                {isResettingPassword ? (
                    <BoxColumn className='gap-3'>
                        <Text className='max-w-2xl text-sm leading-6 text-white/65'>
                            Enter your account email and we&apos;ll send a
                            password reset link.
                        </Text>
                        <BoxRow className='flex-col gap-3 sm:flex-row sm:flex-wrap'>
                            <button
                                className='w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50 sm:w-auto'
                                onClick={resetPassword}
                                type='button'>
                                Send reset link
                            </button>
                            <button
                                className='w-full rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14 sm:w-auto'
                                onClick={() => {
                                    setIsResettingPassword(false);
                                    setError('');
                                    setMessage('');
                                }}
                                type='button'>
                                Back to sign in
                            </button>
                        </BoxRow>
                    </BoxColumn>
                ) : (
                    <BoxColumn className='gap-3'>
                        <BoxRow className='flex-col gap-3 sm:flex-row sm:flex-wrap'>
                            <button
                                className='w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50 sm:w-auto'
                                onClick={signInWithEmail}
                                type='button'>
                                Sign in
                            </button>
                            <button
                                className='w-full rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14 sm:w-auto'
                                onClick={createAccount}
                                type='button'>
                                Create account
                            </button>
                            <button
                                className='w-full rounded-full border border-white/15 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/14 sm:w-auto'
                                onClick={signInGoogle}
                                type='button'>
                                Continue with Google
                            </button>
                        </BoxRow>
                        <BoxRow>
                            <button
                                className='text-sm font-medium text-cyan-100 transition hover:text-white'
                                onClick={() => {
                                    setIsResettingPassword(true);
                                    setError('');
                                    setMessage('');
                                }}
                                type='button'>
                                Forgot password?
                            </button>
                        </BoxRow>
                    </BoxColumn>
                )}

                {error ? (
                    <Text className='text-sm text-red-200'>{error}</Text>
                ) : null}
                {message ? (
                    <Text className='text-sm text-emerald-100'>{message}</Text>
                ) : null}
            </BoxColumn>
        </BoxColumn>
    );
}
