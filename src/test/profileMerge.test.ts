import { describe, it, expect } from 'vitest';
import { mergeProfiles } from '../utils/profileMerge';
import type { UserProfile, JournalEntry, DailyMorningPractice, PracticeData } from '../types';

const baseProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
    id: 'user-1',
    name: 'Mike',
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

const journalEntry = (id: string, highlight: string): JournalEntry => ({
    id,
    date: '2026-06-10',
    highlight,
    midpoint: '',
    lowlight: '',
});

const morningPractice = (date: string): DailyMorningPractice => ({
    id: `mp-${date}`,
    date,
    gratitudes: ['sunlight'],
    affirmations: ['I am steady'],
});

describe('mergeProfiles', () => {
    it('unions journal entries from both devices — nothing is lost', () => {
        const deviceA = baseProfile({
            journalEntries: [journalEntry('a1', 'wrote on phone'), journalEntry('shared', 'common')],
        });
        const deviceB = baseProfile({
            journalEntries: [journalEntry('b1', 'wrote on ipad'), journalEntry('shared', 'older copy')],
        });

        const merged = mergeProfiles(deviceA, deviceB);
        const ids = merged.journalEntries!.map(e => e.id).sort();
        expect(ids).toEqual(['a1', 'b1', 'shared']);
        // preferred side wins the collision
        expect(merged.journalEntries!.find(e => e.id === 'shared')!.highlight).toBe('common');
    });

    it('unions morning practices by date', () => {
        const local = baseProfile({ dailyMorningPractice: [morningPractice('2026-06-10')] });
        const cloud = baseProfile({ dailyMorningPractice: [morningPractice('2026-06-11')] });

        const merged = mergeProfiles(local, cloud);
        expect(merged.dailyMorningPractice!.map(p => p.date).sort())
            .toEqual(['2026-06-10', '2026-06-11']);
    });

    it('prefers scalar fields from the preferred side', () => {
        const local = baseProfile({ name: 'Mike', coachName: 'Palante', quoteIntensity: 3 });
        const cloud = baseProfile({ name: 'Old Name', coachName: 'Coach', quoteIntensity: 1 });

        const merged = mergeProfiles(local, cloud);
        expect(merged.name).toBe('Mike');
        expect(merged.coachName).toBe('Palante');
        expect(merged.quoteIntensity).toBe(3);
    });

    it('never decreases counters', () => {
        const local = baseProfile({ points: 120, streak: 3, xp: 40 });
        const cloud = baseProfile({ points: 90, streak: 9, xp: 55 });

        const merged = mergeProfiles(local, cloud);
        expect(merged.points).toBe(120);
        expect(merged.streak).toBe(9);
        expect(merged.xp).toBe(55);
    });

    it('merges activity history by date+type taking max counts', () => {
        const local = baseProfile({
            activityHistory: [
                { date: '2026-06-10', type: 'meditate', count: 2 },
                { date: '2026-06-10', type: 'breath', count: 1 },
            ],
        });
        const cloud = baseProfile({
            activityHistory: [
                { date: '2026-06-10', type: 'meditate', count: 3 },
                { date: '2026-06-09', type: 'reflect', count: 1 },
            ],
        });

        const merged = mergeProfiles(local, cloud);
        expect(merged.activityHistory).toHaveLength(3);
        const meditate = merged.activityHistory!.find(a => a.type === 'meditate');
        expect(meditate!.count).toBe(3);
    });

    it('merges practiceData — union days, OR milestones, monotonic total', () => {
        const localPractice: PracticeData = {
            totalPractices: 8,
            lastActivityDate: '2026-06-10',
            milestones: { practices_1: true, practices_3: true, practices_7: true, practices_14: false, practices_30: false, practices_50: false, practices_90: false, practices_100: false, practices_180: false, practices_200: false, practices_365: false },
            activityHistory: [
                { date: '2026-06-10', practices: ['meditation', 'morning_practice'] },
            ],
        };
        const cloudPractice: PracticeData = {
            totalPractices: 7,
            lastActivityDate: '2026-06-11',
            milestones: { practices_1: true, practices_3: false, practices_7: false, practices_14: false, practices_30: true, practices_50: false, practices_90: false, practices_100: false, practices_180: false, practices_200: false, practices_365: false },
            activityHistory: [
                { date: '2026-06-10', practices: ['breathwork'] },
                { date: '2026-06-11', practices: ['reflection'] },
            ],
        };

        const merged = mergeProfiles(
            baseProfile({ practiceData: localPractice }),
            baseProfile({ practiceData: cloudPractice }),
        );

        const pd = merged.practiceData!;
        expect(pd.milestones.practices_7).toBe(true);
        expect(pd.milestones.practices_30).toBe(true);
        expect(pd.lastActivityDate).toBe('2026-06-11');
        expect(pd.totalPractices).toBe(8); // max(8, 7, recomputed 4)
        const june10 = pd.activityHistory.find(d => d.date === '2026-06-10')!;
        expect(june10.practices.sort()).toEqual(['breathwork', 'meditation', 'morning_practice']);
    });

    it('unions string sets like rest days and badges', () => {
        const local = baseProfile({ restDays: ['2026-06-01'], unlockedBadges: ['week_one'] });
        const cloud = baseProfile({ restDays: ['2026-06-02'], unlockedBadges: ['week_one', 'first_letter'] });

        const merged = mergeProfiles(local, cloud);
        expect(merged.restDays!.sort()).toEqual(['2026-06-01', '2026-06-02']);
        expect(merged.unlockedBadges!.sort()).toEqual(['first_letter', 'week_one']);
    });

    it('leaves undefined collections undefined when absent on both sides', () => {
        const merged = mergeProfiles(baseProfile(), baseProfile());
        expect(merged.journalEntries).toBeUndefined();
        expect(merged.practiceData).toBeUndefined();
        expect(merged.restDays).toBeUndefined();
    });

    it('passes through a collection present on only one side', () => {
        const cloud = baseProfile({ futureLetters: [{ id: 'fl1', content: 'keep going', writtenDate: '2026-06-01', context: 'manual', hasBeenDelivered: false }] });
        const merged = mergeProfiles(baseProfile(), cloud);
        expect(merged.futureLetters).toHaveLength(1);
    });
});
