export type MilestoneType = 'streak' | 'points';
export type PlantType = 'grass' | 'fern' | 'wildflower' | 'lotus' | 'butterfly' | 'koi' | 'bird_of_paradise' | 'cherry_blossom' | null;

export interface GardenMilestone {
  id: string;
  type: MilestoneType;
  threshold: number;      // streak days OR total points
  label: string;
  description: string;    // shown in legend
  detail: string;         // why it matters / flavor text
  plantType: PlantType;   // which plant/element to render (null = atmosphere unlock)
}

export const STREAK_MILESTONES: GardenMilestone[] = [
  {
    id: 'sprout',
    type: 'streak',
    threshold: 1,
    label: 'First Sprout',
    description: 'Day 1',
    detail: 'Your garden takes root. Every great journey starts here.',
    plantType: 'grass',
  },
  {
    id: 'fern',
    type: 'streak',
    threshold: 3,
    label: 'Fern',
    description: '3-day streak',
    detail: 'Three days of showing up. Consistency is taking hold.',
    plantType: 'fern',
  },
  {
    id: 'wildflower',
    type: 'streak',
    threshold: 7,
    label: 'Wildflower',
    description: '7-day streak',
    detail: 'One full week. Your practice is becoming a ritual.',
    plantType: 'wildflower',
  },
  {
    id: 'lotus',
    type: 'streak',
    threshold: 14,
    label: 'Lotus',
    description: '14-day streak',
    detail: 'Two weeks. The lotus blooms from still water — so do you.',
    plantType: 'lotus',
  },
  {
    id: 'butterfly',
    type: 'streak',
    threshold: 21,
    label: 'Butterfly',
    description: '21-day streak',
    detail: 'Three weeks — science says habits form here. Something beautiful arrived.',
    plantType: 'butterfly',
  },
  {
    id: 'koi',
    type: 'streak',
    threshold: 30,
    label: 'Koi Pond',
    description: '30-day streak',
    detail: 'A full month. Koi appear in your garden — symbols of perseverance and good fortune.',
    plantType: 'koi',
  },
  {
    id: 'bird_of_paradise',
    type: 'streak',
    threshold: 60,
    label: 'Bird of Paradise',
    description: '60-day streak',
    detail: 'Two months of practice. A rare flower for a rare commitment.',
    plantType: 'bird_of_paradise',
  },
  {
    id: 'cherry_blossom',
    type: 'streak',
    threshold: 100,
    label: 'Cherry Blossom Tree',
    description: '100-day streak',
    detail: '100 days. A sacred milestone. The tree will bloom in your garden forever.',
    plantType: 'cherry_blossom',
  },
];

export const POINTS_MILESTONES: GardenMilestone[] = [
  {
    id: 'fireflies',
    type: 'points',
    threshold: 100,
    label: 'Fireflies',
    description: '100 points',
    detail: 'Little lights appear in your garden at night — one for every practice.',
    plantType: null,
  },
  {
    id: 'terracotta_blooms',
    type: 'points',
    threshold: 250,
    label: 'Terracotta Blooms',
    description: '250 points',
    detail: 'Your flowers take on the warm color of Palante — earthy, alive, yours.',
    plantType: null,
  },
  {
    id: 'stone_path',
    type: 'points',
    threshold: 500,
    label: 'Stone Path',
    description: '500 points',
    detail: 'A winding path appears through your garden. You built it one step at a time.',
    plantType: null,
  },
  {
    id: 'golden_hour',
    type: 'points',
    threshold: 1000,
    label: 'Golden Hour',
    description: '1,000 points',
    detail: 'Your garden glows at dusk. A permanent warmth you earned.',
    plantType: null,
  },
  {
    id: 'named_koi',
    type: 'points',
    threshold: 2500,
    label: 'Named Koi',
    description: '2,500 points',
    detail: 'Tap your koi to learn their names. They\'ve been watching you grow.',
    plantType: null,
  },
  {
    id: 'sacred_rings',
    type: 'points',
    threshold: 5000,
    label: 'Sacred Rings',
    description: '5,000 points',
    detail: 'Rings of light crown your garden at night. A master\'s garden.',
    plantType: null,
  },
];

export const ALL_MILESTONES = [...STREAK_MILESTONES, ...POINTS_MILESTONES];

/** Returns which streak milestones are unlocked for a given streak count */
export function getUnlockedStreakMilestones(streak: number): GardenMilestone[] {
  return STREAK_MILESTONES.filter(m => streak >= m.threshold);
}

/** Returns which points milestones are unlocked for a given points total */
export function getUnlockedPointsMilestones(points: number): GardenMilestone[] {
  return POINTS_MILESTONES.filter(m => points >= m.threshold);
}

/** Returns the next streak milestone the user hasn't reached yet */
export function getNextStreakMilestone(streak: number): GardenMilestone | null {
  return STREAK_MILESTONES.find(m => streak < m.threshold) ?? null;
}

/** Returns the next points milestone the user hasn't reached yet */
export function getNextPointsMilestone(points: number): GardenMilestone | null {
  return POINTS_MILESTONES.find(m => points < m.threshold) ?? null;
}
