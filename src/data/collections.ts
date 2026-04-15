import type { Quote } from '../types';

export interface QuoteCollection {
    id: string;
    title: string;
    description: string;
    icon: string;
    quoteIds: string[];
    isPremium: boolean;
    profession?: string;
}

export const QUOTE_COLLECTIONS: QuoteCollection[] = [
    {
        id: 'creative_blocks',
        title: 'Creative Blocks',
        description: 'Break through creative barriers and find your flow',
        icon: 'Palette',
        quoteIds: ['c_w1', 'c_w2', 'c_ar1', 'c_m1', 'f_w1', 'f_f2'],
        isPremium: false,
    },
    {
        id: 'pre_competition',
        title: 'Pre-Competition',
        description: 'Get in the zone before your big moment',
        icon: 'Trophy',
        quoteIds: ['c_at1', 'f_box1', 'f_box2', 'd_box1', 'd_at1', 'd_at7'],
        isPremium: true,
    },
    {
        id: 'leadership',
        title: 'Leadership Moments',
        description: 'Lead with wisdom and strength',
        icon: 'Crown',
        quoteIds: ['c_b1', 'c_co1', 'f_b2', 'f_co2', 'd_co1'],
        isPremium: true,
    },
    {
        id: 'morning_motivation',
        title: 'Morning Motivation',
        description: 'Start your day with energy and purpose',
        icon: 'Sun',
        quoteIds: ['c_e1', 'f1', 'f4', 'd_at2', 'd4'],
        isPremium: false,
    },
    {
        id: 'evening_reflection',
        title: 'Evening Reflection',
        description: 'Wind down with wisdom and perspective',
        icon: 'Moon',
        quoteIds: ['c1', 'c4', 'c_s1', 'f2', 'f_s1'],
        isPremium: true,
    },
    {
        id: 'overcoming_failure',
        title: 'Overcoming Failure',
        description: 'Turn setbacks into comebacks',
        icon: 'Zap',
        quoteIds: ['c_at1', 'f_at1', 'f10', 'd_box1', 'd9', 'd14'],
        isPremium: true,
    },
    {
        id: 'work_life_balance',
        title: 'Work-Life Balance',
        description: 'Find harmony between ambition and peace',
        icon: 'Scale',
        quoteIds: ['c_b2', 'c8', 'c9', 'f2', 'f_b3'],
        isPremium: true,
    },
    {
        id: 'imposter_syndrome',
        title: 'Imposter Syndrome',
        description: 'Build confidence and own your achievements',
        icon: 'Masks',
        quoteIds: ['c5', 'c10', 'f_box2', 'd_box2', 'd_box4'],
        isPremium: true,
    },
];

export const getCollectionQuotes = (collectionId: string, allQuotes: Quote[]): Quote[] => {
    const collection = QUOTE_COLLECTIONS.find(c => c.id === collectionId);
    if (!collection) return [];

    return collection.quoteIds
        .map(id => allQuotes.find(q => q.id === id))
        .filter((q): q is Quote => q !== undefined);
};
