import type { DailyEveningPractice } from '../types';

export interface WeeklyHighlightsTrigger {
    shouldShow: boolean;
    accomplishments: { text: string; date: string }[];
    markShown: () => void;
}

export const getISOWeek = (date: Date): string => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
};

const sevenDaysAgo = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
};

export const computeWeeklyHighlights = (
    practices: DailyEveningPractice[],
    shownKey: string
): WeeklyHighlightsTrigger => {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const thisWeek = getISOWeek(today);
    const alreadyShown = localStorage.getItem(shownKey) === thisWeek;
    const cutoff = sevenDaysAgo();

    const accomplishments = (practices || [])
        .filter(p => p.date >= cutoff && p.accomplishment?.trim())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(p => ({ text: p.accomplishment.trim(), date: p.date }));

    const shouldShow = isSunday && !alreadyShown && accomplishments.length >= 2;

    return {
        shouldShow,
        accomplishments,
        markShown: () => localStorage.setItem(shownKey, thisWeek),
    };
};
