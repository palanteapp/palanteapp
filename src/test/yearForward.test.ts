import { describe, it, expect } from 'vitest';
import {
    buildYearForwardData,
    buildYearForwardFallback,
    hasEnoughForYearForward,
} from '../utils/yearForward';
import type { UserProfile, DailyMorningPractice, DailyEveningPractice } from '../types';

const NOW = new Date('2026-06-12T12:00:00');
const YEAR_END = new Date('2026-12-31T12:00:00');

const baseProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    id: 'u1',
    name: 'Mike Vargas',
    career: '',
    profession: '',
    interests: [],
    quoteIntensity: 2,
    subscriptionTier: 'free',
    streak: 0,
    points: 0,
    sourcePreference: 'mix',
    contentTypePreference: 'mix',
    notificationFrequency: 3,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    goals: [],
    ...overrides,
});

const morning = (date: string, gratitudes: string[], intention?: string): DailyMorningPractice => ({
    id: `m-${date}`,
    date,
    gratitudes,
    affirmations: [],
    dailyIntention: intention,
});

const evening = (date: string, fields: Partial<DailyEveningPractice> = {}): DailyEveningPractice => ({
    id: `e-${date}`,
    date,
    gratitude: '',
    learning: '',
    accomplishment: '',
    delight: '',
    ...fields,
});

describe('buildYearForwardData', () => {
    it('counts only practices within the target calendar year', () => {
        const user = baseProfile({
            dailyMorningPractice: [
                morning('2025-12-31', ['old year gratitude'], 'reflection'),
                morning('2026-01-02', ['sunlight'], 'presence'),
                morning('2026-03-15', ['my family'], 'courage'),
            ],
        });

        const data = buildYearForwardData(user, NOW);
        expect(data.year).toBe(2026);
        expect(data.morningsCount).toBe(2); // 2025 entry excluded
        expect(data.gratitudesWritten).toBe(2);
    });

    it('labels mid-year vs year-end correctly', () => {
        const user = baseProfile();
        expect(buildYearForwardData(user, NOW).windowLabel).toBe('2026, so far');
        expect(buildYearForwardData(user, NOW).isCompleteYear).toBe(false);

        expect(buildYearForwardData(user, YEAR_END).windowLabel).toBe('2026');
        expect(buildYearForwardData(user, YEAR_END).isCompleteYear).toBe(true);
    });

    it('derives first and last intentions in date order', () => {
        const user = baseProfile({
            dailyMorningPractice: [
                morning('2026-05-01', ['a'], 'ease'),
                morning('2026-01-10', ['b'], 'courage'),
                morning('2026-03-20', ['c'], 'focus'),
            ],
        });
        const data = buildYearForwardData(user, NOW);
        expect(data.firstIntention).toBe('courage'); // earliest date
        expect(data.lastIntention).toBe('ease');      // latest date
    });

    it('does not set lastIntention when only one intention exists', () => {
        const user = baseProfile({
            dailyMorningPractice: [morning('2026-02-01', ['x'], 'steady')],
        });
        const data = buildYearForwardData(user, NOW);
        expect(data.firstIntention).toBe('steady');
        expect(data.lastIntention).toBeUndefined();
    });

    it('computes longest consecutive-day streak within the year', () => {
        const user = baseProfile({
            dailyMorningPractice: [
                morning('2026-02-01', ['a']),
                morning('2026-02-02', ['b']),
                morning('2026-02-03', ['c']), // 3-day run
                morning('2026-02-05', ['d']), // gap breaks it
                morning('2026-02-06', ['e']),
            ],
        });
        const data = buildYearForwardData(user, NOW);
        expect(data.longestStreak).toBe(3);
    });

    it('counts a day once even when morning and evening both happen', () => {
        const user = baseProfile({
            dailyMorningPractice: [morning('2026-04-01', ['a']), morning('2026-04-02', ['b'])],
            dailyEveningPractice: [evening('2026-04-01', { delight: 'sunset' })],
        });
        const data = buildYearForwardData(user, NOW);
        expect(data.daysPracticed).toBe(2); // not 3
        expect(data.totalPractices).toBe(3); // 2 mornings + 1 evening
    });

    it('extracts recurring themes and ignores stopwords', () => {
        const user = baseProfile({
            dailyMorningPractice: [
                morning('2026-01-01', ['courage to begin', 'the morning was good']),
                morning('2026-01-02', ['courage again', 'family time']),
                morning('2026-01-03', ['my family and courage']),
            ],
        });
        const data = buildYearForwardData(user, NOW);
        // "courage" appears 3x, "family" 2x — both clear the >=2 threshold
        expect(data.topThemes).toContain('courage');
        expect(data.topThemes).toContain('family');
        // stopwords like "the"/"good"/"morning"/"time" must not surface
        expect(data.topThemes).not.toContain('the');
        expect(data.topThemes).not.toContain('morning');
    });

    it('picks the longest entry as each standout', () => {
        const user = baseProfile({
            dailyEveningPractice: [
                evening('2026-01-01', { accomplishment: 'short', delight: 'a' }),
                evening('2026-01-02', { accomplishment: 'finished the hardest chapter of the book', delight: 'a long walk by the water at dusk' }),
            ],
        });
        const data = buildYearForwardData(user, NOW);
        expect(data.standoutAccomplishment).toBe('finished the hardest chapter of the book');
        expect(data.standoutDelight).toBe('a long walk by the water at dusk');
    });

    it('uses the first name only', () => {
        expect(buildYearForwardData(baseProfile({ name: 'Mike Vargas' }), NOW).firstName).toBe('Mike');
        expect(buildYearForwardData(baseProfile({ name: '' }), NOW).firstName).toBe('Friend');
    });
});

describe('hasEnoughForYearForward', () => {
    it('requires at least 20 practices', () => {
        const mornings = Array.from({ length: 10 }, (_, i) =>
            morning(`2026-01-${String(i + 1).padStart(2, '0')}`, ['g']));
        const evenings = Array.from({ length: 9 }, (_, i) =>
            evening(`2026-02-${String(i + 1).padStart(2, '0')}`));

        const thin = buildYearForwardData(baseProfile({ dailyMorningPractice: mornings, dailyEveningPractice: evenings }), NOW);
        expect(thin.totalPractices).toBe(19);
        expect(hasEnoughForYearForward(thin)).toBe(false);

        const full = buildYearForwardData(
            baseProfile({ dailyMorningPractice: [...mornings, morning('2026-03-01', ['g'])], dailyEveningPractice: evenings }),
            NOW,
        );
        expect(hasEnoughForYearForward(full)).toBe(true);
    });
});

describe('buildYearForwardFallback', () => {
    it('produces a complete letter that opens with name and year and quotes their words', () => {
        const user = baseProfile({
            name: 'Mike',
            dailyMorningPractice: [
                morning('2026-01-01', ['my daughter laughing'], 'courage'),
                morning('2026-06-01', ['steady mornings'], 'ease'),
            ],
            dailyEveningPractice: [
                evening('2026-05-05', { accomplishment: 'shipped the first build', delight: 'coffee on the porch' }),
            ],
        });
        const data = buildYearForwardData(user, NOW);
        const letter = buildYearForwardFallback(data);

        expect(letter.startsWith('Mike,')).toBe(true);
        expect(letter).toContain('2026, so far');
        expect(letter).toContain('courage');
        expect(letter).toContain('shipped the first build');
        expect(letter.toLowerCase()).toContain("pa'lante");
        // No em dashes per brand voice
        expect(letter).not.toContain('—');
    });

    it('handles an empty year without crashing', () => {
        const data = buildYearForwardData(baseProfile({ name: '' }), NOW);
        const letter = buildYearForwardFallback(data);
        expect(letter.length).toBeGreaterThan(20);
        expect(letter).toContain('Friend,');
    });
});
