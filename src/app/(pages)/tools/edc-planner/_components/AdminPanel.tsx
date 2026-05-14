import { Box, BoxColumn, BoxRow, Text } from '@/app/_components/ui';
import { firestore } from '@/lib/firebase';
import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    writeBatch,
} from 'firebase/firestore';
import { ArrowDown, ArrowUp, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { Stage } from './types';
import { festivalId, getFriendlyError, sortStages, stageColors } from './utils';

export default function AdminPanel() {
    const [stageName, setStageName] = useState('');
    const [stageColor, setStageColor] = useState(stageColors[0]);
    const [artist, setArtist] = useState('');
    const [day, setDay] = useState('Friday');
    const [stageId, setStageId] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [stages, setStages] = useState<Stage[]>([]);
    const [adminStatus, setAdminStatus] = useState('');
    const [adminError, setAdminError] = useState('');
    const [setJson, setSetJson] = useState(`[
{
    "artist": "Trace",
    "stage": "Kinetic Field",
    "day": "Sunday",
    "start": "19:00",
    "end": "20:00"
},
]`);

    useEffect(() => {
        return onSnapshot(
            query(
                collection(firestore, 'festivals', festivalId, 'stages'),
                orderBy('name'),
            ),
            (snapshot) => {
                const nextStages = snapshot.docs.map((stageDoc) => ({
                    id: stageDoc.id,
                    name: stageDoc.data().name ?? '',
                    color: stageDoc.data().color ?? stageColors[0],
                    order: stageDoc.data().order,
                }));
                const sortedStages = sortStages(nextStages);

                setStages(sortedStages);
                setStageId((current) => current || sortedStages[0]?.id || '');
            },
            (error) => {
                setAdminError(
                    `Could not load stages: ${getFriendlyError(error)}`,
                );
            },
        );
    }, []);

    const addStage = async () => {
        setAdminStatus('');
        setAdminError('');

        if (!stageName.trim()) {
            setAdminError('Add a stage name first.');
            return;
        }

        try {
            await setDoc(
                doc(firestore, 'festivals', festivalId),
                {
                    name: 'Electric Daisy Carnival',
                    updatedAt: serverTimestamp(),
                },
                { merge: true },
            );
            await addDoc(
                collection(firestore, 'festivals', festivalId, 'stages'),
                {
                    name: stageName.trim(),
                    color: stageColor,
                    order: stages.length,
                    createdAt: serverTimestamp(),
                },
            );
            setAdminStatus(`Added stage: ${stageName.trim()}`);
            setStageName('');
        } catch (error) {
            setAdminError(`Could not add stage: ${getFriendlyError(error)}`);
        }
    };

    const addSet = async () => {
        setAdminStatus('');
        setAdminError('');

        if (!artist.trim() || !stageId || !startTime || !endTime) {
            setAdminError(
                'Add artist, day, stage, start time, and end time first.',
            );
            return;
        }

        const stageNameForSet =
            stages.find((stage) => stage.id === stageId)?.name ??
            'selected stage';

        try {
            await addDoc(
                collection(firestore, 'festivals', festivalId, 'sets'),
                {
                    artist: artist.trim(),
                    day,
                    stageId,
                    startTime,
                    endTime,
                    createdAt: serverTimestamp(),
                },
            );
            setAdminStatus(
                `Added ${artist.trim()} to ${stageNameForSet} on ${day}.`,
            );
            setArtist('');
            setStartTime('');
            setEndTime('');
        } catch (error) {
            setAdminError(`Could not add set: ${getFriendlyError(error)}`);
        }
    };

    const importSets = async () => {
        setAdminStatus('');
        setAdminError('');

        try {
            const parsed = JSON.parse(setJson) as unknown;
            const items = Array.isArray(parsed) ? parsed : [];

            if (!items.length) {
                setAdminError('Paste a JSON array of set objects first.');
                return;
            }

            const stageIdByName = new Map(
                stages.map((stage) => [stage.name.toLowerCase(), stage.id]),
            );
            let importedCount = 0;

            await setDoc(
                doc(firestore, 'festivals', festivalId),
                {
                    name: 'Electric Daisy Carnival',
                    updatedAt: serverTimestamp(),
                },
                { merge: true },
            );

            for (const item of items) {
                if (!item || typeof item !== 'object') {
                    continue;
                }

                const setItem = item as Record<string, string>;
                const importedArtist = setItem.artist?.trim();
                const importedStage = setItem.stage?.trim();
                const importedDay = setItem.day?.trim();
                const importedStart = (
                    setItem.startTime ?? setItem.start
                )?.trim();
                const importedEnd = (setItem.endTime ?? setItem.end)?.trim();

                if (
                    !importedArtist ||
                    !importedStage ||
                    !importedDay ||
                    !importedStart ||
                    !importedEnd
                ) {
                    continue;
                }

                let importedStageId = stageIdByName.get(
                    importedStage.toLowerCase(),
                );

                if (!importedStageId) {
                    const stageRef = await addDoc(
                        collection(
                            firestore,
                            'festivals',
                            festivalId,
                            'stages',
                        ),
                        {
                            name: importedStage,
                            color: stageColors[
                                stageIdByName.size % stageColors.length
                            ],
                            order: stageIdByName.size,
                            createdAt: serverTimestamp(),
                        },
                    );
                    importedStageId = stageRef.id;
                    stageIdByName.set(
                        importedStage.toLowerCase(),
                        importedStageId,
                    );
                }

                await addDoc(
                    collection(firestore, 'festivals', festivalId, 'sets'),
                    {
                        artist: importedArtist,
                        day: importedDay,
                        stageId: importedStageId,
                        startTime: importedStart,
                        endTime: importedEnd,
                        createdAt: serverTimestamp(),
                    },
                );
                importedCount += 1;
            }

            setAdminStatus(`Imported ${importedCount} sets.`);
        } catch (error) {
            setAdminError(`Could not import sets: ${getFriendlyError(error)}`);
        }
    };

    const moveStage = async (stageIdToMove: string, direction: -1 | 1) => {
        setAdminStatus('');
        setAdminError('');

        const currentIndex = stages.findIndex(
            (stage) => stage.id === stageIdToMove,
        );
        const targetIndex = currentIndex + direction;

        if (
            currentIndex < 0 ||
            targetIndex < 0 ||
            targetIndex >= stages.length
        ) {
            return;
        }

        const nextStages = [...stages];
        const [movedStage] = nextStages.splice(currentIndex, 1);
        nextStages.splice(targetIndex, 0, movedStage);

        try {
            const batch = writeBatch(firestore);

            nextStages.forEach((stage, index) => {
                batch.set(
                    doc(firestore, 'festivals', festivalId, 'stages', stage.id),
                    { order: index },
                    { merge: true },
                );
            });

            await batch.commit();
            setStages(
                nextStages.map((stage, index) => ({
                    ...stage,
                    order: index,
                })),
            );
            setAdminStatus('Updated stage order.');
        } catch (error) {
            setAdminError(
                `Could not update stage order: ${getFriendlyError(error)}`,
            );
        }
    };

    return (
        <BoxColumn className='gap-5 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-md sm:rounded-3xl sm:p-5'>
            <BoxRow className='items-center gap-2'>
                <ShieldCheck className='h-5 w-5 text-emerald-200' />
                <Text className='text-2xl font-semibold'>
                    Admin schedule entry
                </Text>
            </BoxRow>

            <BoxColumn className='gap-3 rounded-2xl border border-white/10 bg-white/5 p-4'>
                <Text className='text-sm font-semibold uppercase tracking-[0.2em] text-white/45'>
                    Stages
                </Text>
                <BoxRow className='flex-col gap-3 sm:flex-row sm:flex-wrap'>
                    <input
                        className='w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60 sm:min-w-56'
                        onChange={(event) => setStageName(event.target.value)}
                        placeholder='Stage name'
                        value={stageName}
                    />
                    <input
                        aria-label='Stage color'
                        className='h-12 w-16 rounded-2xl border border-white/10 bg-black/35 p-1'
                        onChange={(event) => setStageColor(event.target.value)}
                        type='color'
                        value={stageColor}
                    />
                    <button
                        className='w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50 sm:w-auto'
                        onClick={addStage}
                        type='button'>
                        Add stage
                    </button>
                </BoxRow>
                {stages.length ? (
                    <BoxColumn className='gap-2 pt-2'>
                        {stages.map((stage, index) => (
                            <BoxRow
                                className='min-w-0 items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2'
                                key={stage.id}>
                                <BoxRow className='min-w-0 items-center gap-3'>
                                    <Box
                                        className='h-4 w-4 shrink-0 rounded-full'
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <Text className='truncate text-sm font-medium text-white'>
                                        {stage.name}
                                    </Text>
                                </BoxRow>
                                <BoxRow className='gap-2'>
                                    <button
                                        className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-35'
                                        disabled={index === 0}
                                        onClick={() => moveStage(stage.id, -1)}
                                        title='Move stage left'
                                        type='button'>
                                        <ArrowUp className='h-4 w-4' />
                                    </button>
                                    <button
                                        className='inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/8 text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-35'
                                        disabled={index === stages.length - 1}
                                        onClick={() => moveStage(stage.id, 1)}
                                        title='Move stage right'
                                        type='button'>
                                        <ArrowDown className='h-4 w-4' />
                                    </button>
                                </BoxRow>
                            </BoxRow>
                        ))}
                    </BoxColumn>
                ) : null}
            </BoxColumn>

            <BoxColumn className='gap-3 rounded-2xl border border-white/10 bg-white/5 p-4'>
                <Text className='text-sm font-semibold uppercase tracking-[0.2em] text-white/45'>
                    Sets
                </Text>
                <BoxRow className='flex-col gap-3 sm:flex-row sm:flex-wrap'>
                    <input
                        className='w-full min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60 sm:min-w-56'
                        onChange={(event) => setArtist(event.target.value)}
                        placeholder='Artist'
                        value={artist}
                    />
                    <select
                        className='w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-cyan-200/60 sm:w-auto'
                        onChange={(event) => setDay(event.target.value)}
                        value={day}>
                        <option>Friday</option>
                        <option>Saturday</option>
                        <option>Sunday</option>
                    </select>
                    <select
                        className='w-full rounded-2xl border border-white/10 bg-black/80 px-4 py-3 text-white outline-none focus:border-cyan-200/60 sm:w-auto'
                        onChange={(event) => setStageId(event.target.value)}
                        value={stageId}>
                        {stages.map((stage) => (
                            <option
                                key={stage.id}
                                value={stage.id}>
                                {stage.name}
                            </option>
                        ))}
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
                        onClick={addSet}
                        type='button'>
                        Add set
                    </button>
                </BoxRow>
            </BoxColumn>

            <BoxColumn className='gap-3 rounded-2xl border border-white/10 bg-white/5 p-4'>
                <Text className='text-sm font-semibold uppercase tracking-[0.2em] text-white/45'>
                    JSON import
                </Text>
                <textarea
                    className='min-h-72 w-full resize-y rounded-2xl border border-white/10 bg-black/35 p-4 font-mono text-xs leading-5 text-white outline-none placeholder:text-white/35 focus:border-cyan-200/60 sm:text-sm sm:leading-6'
                    onChange={(event) => setSetJson(event.target.value)}
                    value={setJson}
                />
                <BoxRow className='flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center'>
                    <button
                        className='w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50 sm:w-auto'
                        onClick={importSets}
                        type='button'>
                        Import JSON sets
                    </button>
                    <Text className='text-sm text-white/55'>
                        Accepts artist, stage, day, start/end or
                        startTime/endTime.
                    </Text>
                </BoxRow>
            </BoxColumn>
            {adminStatus ? (
                <Text className='text-sm text-emerald-100'>{adminStatus}</Text>
            ) : null}
            {adminError ? (
                <Text className='text-sm text-red-200'>{adminError}</Text>
            ) : null}
        </BoxColumn>
    );
}
