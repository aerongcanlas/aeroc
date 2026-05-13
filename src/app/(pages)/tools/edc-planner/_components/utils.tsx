import type { Stage } from './types';

export const scheduleStartMinutes = 19 * 60;
export const scheduleEndMinutes = 30 * 60;
export const festivalId = 'edc-las-vegas-2026';

export const stageColors = [
    '#38bdf8',
    '#f472b6',
    '#a3e635',
    '#facc15',
    '#c084fc',
    '#fb7185',
];

export function getInitials(firstName: string, lastName: string) {
    return `${firstName.at(0) ?? ''}${lastName.at(0) ?? ''}`.toUpperCase();
}

export function getFriendlyError(error: unknown) {
    if (error instanceof Error) {
        return error.message;
    }

    return 'Something went wrong.';
}

export function getInviteLink(groupId: string) {
    if (typeof window === 'undefined') {
        return '';
    }

    return `${window.location.origin}/tools/edc-planner?group=${groupId}`;
}

export function getScheduleMinute(time: string) {
    const [hour = '0', minute = '0'] = time.split(':');
    const parsed = Number(hour) * 60 + Number(minute);

    if (parsed < scheduleStartMinutes) {
        return parsed + 24 * 60;
    }

    return parsed;
}

export function getDisplayTime(time: string) {
    const [hourValue = '0', minute = '0'] = time.split(':');
    const hour = Number(hourValue);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${suffix}`;
}

export function sortStages(stages: Stage[]) {
    return [...stages].sort((a, b) => {
        const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
        const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;

        if (aOrder !== bOrder) {
            return aOrder - bOrder;
        }

        return a.name.localeCompare(b.name);
    });
}
