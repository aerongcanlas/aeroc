import { Box, Text } from '@/app/_components/ui';
import { useState } from 'react';
import type { FestivalSet, Meetup, Selection, Stage } from './types';
import {
    getDisplayTime,
    getScheduleMinute,
    scheduleEndMinutes,
    scheduleStartMinutes,
} from './utils';

export default function ScreenshotCalendar({
    activeDay,
    days,
    meetups,
    selectedFriendIds,
    selectedStageIds,
    selections,
    sets,
    stages,
}: {
    activeDay: string;
    days: string[];
    meetups: Meetup[];
    selectedFriendIds: string[];
    selectedStageIds: string[];
    selections: Record<string, Selection>;
    sets: FestivalSet[];
    stages: Stage[];
}) {
    const [downloadStatus, setDownloadStatus] = useState('');
    const hourLabels = [
        '07:00',
        '08:00',
        '09:00',
        '10:00',
        '11:00',
        '12:00',
        '01:00',
        '02:00',
        '03:00',
        '04:00',
        '05:00',
        '06:00',
    ];
    const dayNumberByName: Record<string, number> = {
        Friday: 1,
        Saturday: 2,
        Sunday: 3,
    };
    const dayNumber =
        dayNumberByName[activeDay] ?? Math.max(days.indexOf(activeDay) + 1, 1);
    const scheduleDuration = scheduleEndMinutes - scheduleStartMinutes;
    const visibleMeetups = meetups.filter((meetup) => meetup.day === activeDay);
    const hasMeetups = visibleMeetups.length > 0;
    const visibleStages = stages.filter((stage) =>
        (selectedStageIds.length === 0 ||
            selectedStageIds.includes(stage.id)) &&
        sets.some(
            (set) =>
                set.day === activeDay &&
                set.stageId === stage.id &&
                isVisiblePick(set.id),
        ),
    );
    const calendarColumnCount = Math.max(
        visibleStages.length + (hasMeetups ? 1 : 0),
        1,
    );
    const isDense = calendarColumnCount >= 7;
    const displayFontFamily = 'Inter, Arial, sans-serif';
    const meetupColor = '#67e8f9';

    function isVisiblePick(setId: string) {
        const selectedUserIds = selections[setId]?.userIds ?? [];
        let filteredUserIds = selectedUserIds;

        if (selectedFriendIds.length > 0) {
            filteredUserIds = filteredUserIds.filter(
                (userId) => selectedFriendIds.includes(userId),
            );
        }

        return filteredUserIds.length > 0;
    }

    const drawRoundedRect = (
        context: CanvasRenderingContext2D,
        x: number,
        y: number,
        width: number,
        height: number,
        radius: number,
    ) => {
        const safeRadius = Math.min(radius, width / 2, height / 2);

        context.beginPath();
        context.moveTo(x + safeRadius, y);
        context.lineTo(x + width - safeRadius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
        context.lineTo(x + width, y + height - safeRadius);
        context.quadraticCurveTo(
            x + width,
            y + height,
            x + width - safeRadius,
            y + height,
        );
        context.lineTo(x + safeRadius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
        context.lineTo(x, y + safeRadius);
        context.quadraticCurveTo(x, y, x + safeRadius, y);
        context.closePath();
    };

    const drawWrappedText = ({
        context,
        text,
        x,
        y,
        maxWidth,
        lineHeight,
        maxLines,
    }: {
        context: CanvasRenderingContext2D;
        text: string;
        x: number;
        y: number;
        maxWidth: number;
        lineHeight: number;
        maxLines: number;
    }) => {
        const words = text.split(/\s+/);
        const lines: string[] = [];
        let line = '';

        words.forEach((word) => {
            const candidate = line ? `${line} ${word}` : word;

            if (
                context.measureText(candidate).width <= maxWidth ||
                !line
            ) {
                line = candidate;
                return;
            }

            lines.push(line);
            line = word;
        });

        if (line) {
            lines.push(line);
        }

        const visibleLines = lines.slice(0, maxLines);
        const totalHeight = visibleLines.length * lineHeight;

        visibleLines.forEach((visibleLine, index) => {
            const suffix =
                index === maxLines - 1 && lines.length > maxLines ? '...' : '';
            context.fillText(
                `${visibleLine}${suffix}`,
                x,
                y - totalHeight / 2 + lineHeight * index + lineHeight * 0.75,
                maxWidth,
            );
        });
    };

    const getWallpaperSize = () => {
        if (typeof window === 'undefined') {
            return { width: 1290, height: 2796 };
        }

        const pixelRatio = Math.max(window.devicePixelRatio || 1, 1);
        const screenWidth = Math.round(window.screen.width * pixelRatio);
        const screenHeight = Math.round(window.screen.height * pixelRatio);
        const isPhoneLike = window.innerWidth <= 700;
        const width = isPhoneLike ? screenWidth : 1290;
        const height = isPhoneLike ? screenHeight : 2796;

        return {
            width: Math.min(width, height),
            height: Math.max(width, height),
        };
    };

    const downloadWallpaper = async () => {
        await document.fonts.ready;

        const { width, height } = getWallpaperSize();
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        if (!context) {
            setDownloadStatus('Could not create wallpaper canvas.');
            return;
        }

        canvas.width = width;
        canvas.height = height;

        const padding = width * 0.018;
        const titleHeight = height * 0.045;
        const headerHeight = height * 0.058;
        const titleY = padding + titleHeight * 0.72;
        const headerY = padding + titleHeight;
        const bodyY = headerY + headerHeight;
        const bodyHeight = height - bodyY - padding;
        const timeColumnWidth = width * 0.058;
        const gap = Math.max(width * 0.0035, 2);
        const calendarWidth = width - padding * 2;
        const stageColumnWidth =
            (calendarWidth - timeColumnWidth - gap * calendarColumnCount) /
            calendarColumnCount;
        const denseFontScale = isDense ? 0.82 : 1;

        context.fillStyle = '#000000';
        context.fillRect(0, 0, width, height);

        context.textAlign = 'center';
        context.textBaseline = 'alphabetic';
        context.fillStyle = '#ffffff';
        context.font = `900 ${width * 0.06}px ${displayFontFamily}`;
        context.fillText(
            `EDC DAY ${dayNumber} - ${activeDay.toUpperCase()}`,
            width / 2,
            titleY,
        );

        visibleStages.forEach((stage, index) => {
            const x =
                padding +
                timeColumnWidth +
                gap +
                index * (stageColumnWidth + gap);

            context.globalAlpha = 1;
            context.fillStyle = stage.color;
            drawRoundedRect(
                context,
                x,
                headerY,
                stageColumnWidth,
                headerHeight,
                width * 0.006,
            );
            context.fill();

            context.fillStyle = 'rgba(0,0,0,0.75)';
            context.font = `900 ${Math.max(width * 0.016 * denseFontScale, 11)}px ${displayFontFamily}`;
            drawWrappedText({
                context,
                text: stage.name.toUpperCase(),
                x: x + stageColumnWidth / 2,
                y: headerY + headerHeight / 2,
                maxWidth: stageColumnWidth * 0.92,
                lineHeight: Math.max(width * 0.018 * denseFontScale, 12),
                maxLines: 3,
            });
        });

        if (hasMeetups) {
            const x =
                padding +
                timeColumnWidth +
                gap +
                visibleStages.length * (stageColumnWidth + gap);

            context.globalAlpha = 1;
            context.fillStyle = meetupColor;
            drawRoundedRect(
                context,
                x,
                headerY,
                stageColumnWidth,
                headerHeight,
                width * 0.006,
            );
            context.fill();

            context.fillStyle = 'rgba(0,0,0,0.75)';
            context.font = `900 ${Math.max(width * 0.016 * denseFontScale, 11)}px ${displayFontFamily}`;
            drawWrappedText({
                context,
                text: 'MEETUPS',
                x: x + stageColumnWidth / 2,
                y: headerY + headerHeight / 2,
                maxWidth: stageColumnWidth * 0.92,
                lineHeight: Math.max(width * 0.018 * denseFontScale, 12),
                maxLines: 2,
            });
        }

        context.textAlign = 'center';
        context.fillStyle = 'rgba(255,255,255,0.9)';
        context.font = `900 ${Math.max(width * 0.017, 12)}px ${displayFontFamily}`;
        hourLabels.forEach((label, index) => {
            const y =
                bodyY +
                (index / (hourLabels.length - 1)) * bodyHeight +
                height * 0.004;
            const [hour, minute] = label.split(':');
            const x = padding + timeColumnWidth * 0.48;
            const lineHeight = Math.max(width * 0.015, 10);

            context.fillText(hour, x, y);
            context.fillText(minute, x, y + lineHeight);
        });

        visibleStages.forEach((stage, index) => {
            const x =
                padding +
                timeColumnWidth +
                gap +
                index * (stageColumnWidth + gap);

            sets
                .filter(
                    (set) =>
                        set.day === activeDay && set.stageId === stage.id,
                )
                .forEach((set) => {
                    const start = getScheduleMinute(set.startTime);
                    let end = getScheduleMinute(set.endTime);

                    if (end <= start) {
                        end += 24 * 60;
                    }

                    const y =
                        bodyY +
                        ((start - scheduleStartMinutes) / scheduleDuration) *
                            bodyHeight;
                    const blockHeight = Math.max(
                        ((end - start) / scheduleDuration) * bodyHeight,
                        height * 0.038,
                    );
                    const isWanted = isVisiblePick(set.id);

                    context.globalAlpha = isWanted ? 1 : 0.35;
                    context.fillStyle = stage.color;
                    drawRoundedRect(
                        context,
                        x,
                        y,
                        stageColumnWidth,
                        blockHeight - gap,
                        width * 0.01,
                    );
                    context.fill();
                    context.globalAlpha = 1;

                    context.save();
                    drawRoundedRect(
                        context,
                        x,
                        y,
                        stageColumnWidth,
                        blockHeight - gap,
                        width * 0.01,
                    );
                    context.clip();
                    context.textAlign = 'center';
                    context.fillStyle = 'rgba(0,0,0,0.86)';
                    context.font = `900 ${Math.max(width * 0.015 * denseFontScale, 10)}px ${displayFontFamily}`;
                    drawWrappedText({
                        context,
                        text: set.artist.toUpperCase(),
                        x: x + stageColumnWidth / 2,
                        y: y + blockHeight * 0.42,
                        maxWidth: stageColumnWidth * 0.9,
                        lineHeight: Math.max(width * 0.0165 * denseFontScale, 11),
                        maxLines: blockHeight < height * 0.055 ? 2 : 3,
                    });

                    context.fillStyle = 'rgba(0,0,0,0.62)';
                    context.font = `900 ${Math.max(width * 0.012 * denseFontScale, 8)}px ${displayFontFamily}`;
                    context.fillText(
                        `${getDisplayTime(set.startTime)} - ${getDisplayTime(set.endTime)}`,
                        x + stageColumnWidth / 2,
                        y + blockHeight * 0.68,
                        stageColumnWidth * 0.92,
                    );
                    context.restore();
                });
        });

        if (hasMeetups) {
            const x =
                padding +
                timeColumnWidth +
                gap +
                visibleStages.length * (stageColumnWidth + gap);

            visibleMeetups.forEach((meetup) => {
                const start = getScheduleMinute(meetup.startTime);
                let end = getScheduleMinute(meetup.endTime);

                if (end <= start) {
                    end += 24 * 60;
                }

                const y =
                    bodyY +
                    ((start - scheduleStartMinutes) / scheduleDuration) *
                        bodyHeight;
                const blockHeight = Math.max(
                    ((end - start) / scheduleDuration) * bodyHeight,
                    height * 0.038,
                );

                context.globalAlpha = 1;
                context.fillStyle = meetupColor;
                drawRoundedRect(
                    context,
                    x,
                    y,
                    stageColumnWidth,
                    blockHeight - gap,
                    width * 0.01,
                );
                context.fill();

                context.save();
                drawRoundedRect(
                    context,
                    x,
                    y,
                    stageColumnWidth,
                    blockHeight - gap,
                    width * 0.01,
                );
                context.clip();
                context.textAlign = 'center';
                context.fillStyle = 'rgba(0,0,0,0.86)';
                context.font = `900 ${Math.max(width * 0.015 * denseFontScale, 10)}px ${displayFontFamily}`;
                drawWrappedText({
                    context,
                    text: meetup.title.toUpperCase(),
                    x: x + stageColumnWidth / 2,
                    y: y + blockHeight * 0.34,
                    maxWidth: stageColumnWidth * 0.9,
                    lineHeight: Math.max(width * 0.0165 * denseFontScale, 11),
                    maxLines: blockHeight < height * 0.055 ? 2 : 3,
                });

                if (meetup.location) {
                    context.fillStyle = 'rgba(0,0,0,0.72)';
                    context.font = `900 ${Math.max(width * 0.011 * denseFontScale, 8)}px ${displayFontFamily}`;
                    drawWrappedText({
                        context,
                        text: meetup.location.toUpperCase(),
                        x: x + stageColumnWidth / 2,
                        y: y + blockHeight * 0.59,
                        maxWidth: stageColumnWidth * 0.9,
                        lineHeight: Math.max(width * 0.012 * denseFontScale, 8),
                        maxLines: 2,
                    });
                }

                context.fillStyle = 'rgba(0,0,0,0.62)';
                context.font = `900 ${Math.max(width * 0.012 * denseFontScale, 8)}px ${displayFontFamily}`;
                context.fillText(
                    `${getDisplayTime(meetup.startTime)} - ${getDisplayTime(meetup.endTime)}`,
                    x + stageColumnWidth / 2,
                    y + blockHeight * 0.78,
                    stageColumnWidth * 0.92,
                );
                context.restore();
            });
        }

        canvas.toBlob((blob) => {
            if (!blob) {
                setDownloadStatus('Could not export wallpaper.');
                return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.href = url;
            link.download = `edc-${activeDay.toLowerCase()}-wallpaper.png`;
            link.click();
            URL.revokeObjectURL(url);
            setDownloadStatus(`Downloaded ${width}x${height} wallpaper.`);
        }, 'image/png');
    };

    return (
        <Box className='mx-auto flex w-full max-w-107.5 flex-col gap-3 sm:max-w-130'>
            <Box className='rounded-[1.75rem] bg-black p-1.5 shadow-2xl sm:p-2'>
                <Box className='relative aspect-9/19.5 w-full overflow-hidden rounded-[1.35rem] bg-black px-1.5 pb-2 pt-3 text-white sm:px-2 sm:pt-4'>
                <Text className='h-[5%] whitespace-nowrap text-center text-[clamp(0.92rem,5vw,1.8rem)] font-black uppercase leading-none text-white'>
                    EDC DAY {dayNumber} - {activeDay}
                </Text>

                <Box
                    className='grid h-[6.5%] gap-0.5'
                    style={{
                        gridTemplateColumns: `6% repeat(${calendarColumnCount}, minmax(0, 1fr))`,
                    }}>
                    <Box />
                    {visibleStages.map((stage) => (
                        <Box
                            className='flex min-w-0 items-center justify-center rounded-t-md px-0.5 text-center'
                            key={stage.id}
                            style={{ backgroundColor: stage.color }}>
                            <Text
                                className={`wrap-break-word font-black uppercase text-black/75 ${
                                    isDense
                                        ? 'text-[0.34rem] leading-[0.42rem] sm:text-[0.44rem] sm:leading-[0.52rem]'
                                        : 'text-[0.48rem] leading-[0.58rem] sm:text-[0.62rem] sm:leading-[0.72rem]'
                                }`}>
                                {stage.name}
                            </Text>
                        </Box>
                    ))}
                    {hasMeetups ? (
                        <Box
                            className='flex min-w-0 items-center justify-center rounded-t-md px-0.5 text-center'
                            style={{ backgroundColor: meetupColor }}>
                            <Text
                                className={`wrap-break-word font-black uppercase text-black/75 ${
                                    isDense
                                        ? 'text-[0.34rem] leading-[0.42rem] sm:text-[0.44rem] sm:leading-[0.52rem]'
                                        : 'text-[0.48rem] leading-[0.58rem] sm:text-[0.62rem] sm:leading-[0.72rem]'
                                }`}>
                                Meetups
                            </Text>
                        </Box>
                    ) : null}
                </Box>

                <Box
                    className='grid h-[88.5%] gap-0.5'
                    style={{
                        gridTemplateColumns: `6% repeat(${calendarColumnCount}, minmax(0, 1fr))`,
                    }}>
                    <Box className='relative'>
                        {hourLabels.map((label, index) => (
                            <Box
                                className='absolute left-0 right-0'
                                key={label}
                                style={{
                                    top: `${(index / (hourLabels.length - 1)) * 100}%`,
                                }}>
                                <Text className='absolute right-0 translate-y-1 text-[0.34rem] font-bold leading-none text-white/90 sm:text-[0.46rem]'>
                                    {label}
                                </Text>
                            </Box>
                        ))}
                    </Box>

                    {visibleStages.map((stage) => (
                        <Box
                            className='relative min-w-0'
                            key={stage.id}>
                            {hourLabels.map((label, index) => (
                                <Box
                                    className='absolute left-0 right-0'
                                    key={`${stage.id}-${label}`}
                                    style={{
                                        top: `${(index / (hourLabels.length - 1)) * 100}%`,
                                    }}
                                />
                            ))}
                            {sets
                                .filter(
                                    (set) =>
                                        set.day === activeDay &&
                                        set.stageId === stage.id,
                                )
                                .map((set) => {
                                    const start = getScheduleMinute(
                                        set.startTime,
                                    );
                                    let end = getScheduleMinute(set.endTime);

                                    if (end <= start) {
                                        end += 24 * 60;
                                    }

                                    const top =
                                        ((start - scheduleStartMinutes) /
                                            scheduleDuration) *
                                        100;
                                    const height = Math.max(
                                        ((end - start) / scheduleDuration) *
                                            100,
                                        4.5,
                                    );
                                    const isWanted = isVisiblePick(set.id);

                                    return (
                                        <Box
                                            className={`absolute left-0 right-0 flex flex-col items-center justify-center overflow-hidden rounded-[0.28rem] border border-black px-0.5 py-0.5 text-center text-black transition ${
                                                isWanted
                                                    ? 'opacity-100'
                                                    : 'opacity-35 grayscale'
                                            }`}
                                            key={set.id}
                                            style={{
                                                backgroundColor: stage.color,
                                                top: `${top}%`,
                                                height: `${height}%`,
                                            }}>
                                            <Text
                                                className={`max-w-full wrap-break-word font-black uppercase ${
                                                    isDense
                                                        ? 'text-[0.32rem] leading-[0.38rem] sm:text-[0.42rem] sm:leading-[0.48rem]'
                                                        : 'text-[0.42rem] leading-2 sm:text-[0.58rem] sm:leading-[0.66rem]'
                                                }`}>
                                                {set.artist}
                                            </Text>
                                            <Text
                                                className={`mt-0.5 font-bold leading-none text-black/65 ${
                                                    isDense
                                                        ? 'text-[0.25rem] sm:text-[0.34rem]'
                                                        : 'text-[0.32rem] sm:text-[0.42rem]'
                                                }`}>
                                                {getDisplayTime(set.startTime)}{' '}
                                                - {getDisplayTime(set.endTime)}
                                            </Text>
                                        </Box>
                                    );
                                })}
                        </Box>
                    ))}
                    {hasMeetups ? (
                        <Box className='relative min-w-0'>
                            {hourLabels.map((label, index) => (
                                <Box
                                    className='absolute left-0 right-0'
                                    key={`meetups-${label}`}
                                    style={{
                                        top: `${(index / (hourLabels.length - 1)) * 100}%`,
                                    }}
                                />
                            ))}
                            {visibleMeetups.map((meetup) => {
                                const start = getScheduleMinute(
                                    meetup.startTime,
                                );
                                let end = getScheduleMinute(meetup.endTime);

                                if (end <= start) {
                                    end += 24 * 60;
                                }

                                const top =
                                    ((start - scheduleStartMinutes) /
                                        scheduleDuration) *
                                    100;
                                const height = Math.max(
                                    ((end - start) / scheduleDuration) * 100,
                                    4.5,
                                );

                                return (
                                    <Box
                                        className='absolute left-0 right-0 flex flex-col items-center justify-center overflow-hidden rounded-[0.28rem] border border-black px-0.5 py-0.5 text-center text-black'
                                        key={meetup.id}
                                        style={{
                                            backgroundColor: meetupColor,
                                            top: `${top}%`,
                                            height: `${height}%`,
                                        }}>
                                        <Text
                                            className={`max-w-full wrap-break-word font-black uppercase ${
                                                isDense
                                                    ? 'text-[0.32rem] leading-[0.38rem] sm:text-[0.42rem] sm:leading-[0.48rem]'
                                                    : 'text-[0.42rem] leading-2 sm:text-[0.58rem] sm:leading-[0.66rem]'
                                            }`}>
                                            {meetup.title}
                                        </Text>
                                        {meetup.location ? (
                                            <Text
                                                className={`mt-0.5 max-w-full wrap-break-word font-bold uppercase text-black/70 ${
                                                    isDense
                                                        ? 'text-[0.24rem] leading-[0.3rem] sm:text-[0.32rem] sm:leading-[0.38rem]'
                                                        : 'text-[0.3rem] leading-[0.36rem] sm:text-[0.38rem] sm:leading-[0.46rem]'
                                                }`}>
                                                {meetup.location}
                                            </Text>
                                        ) : null}
                                        <Text
                                            className={`mt-0.5 font-bold leading-none text-black/65 ${
                                                isDense
                                                    ? 'text-[0.25rem] sm:text-[0.34rem]'
                                                    : 'text-[0.32rem] sm:text-[0.42rem]'
                                            }`}>
                                            {getDisplayTime(meetup.startTime)} -{' '}
                                            {getDisplayTime(meetup.endTime)}
                                        </Text>
                                    </Box>
                                );
                            })}
                        </Box>
                    ) : null}
                </Box>
            </Box>
            </Box>
            <button
                className='w-full rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-cyan-50'
                onClick={downloadWallpaper}
                type='button'>
                Download wallpaper
            </button>
            {downloadStatus ? (
                <Text className='text-center text-sm text-white/62'>
                    {downloadStatus}
                </Text>
            ) : null}
        </Box>
    );
}
