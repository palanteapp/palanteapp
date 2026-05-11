/**
 * Coach Memory Builder
 *
 * Extracts meaningful context from a UserProfile and formats it into a
 * structured memory brief for the Palante AI Coach. Gemini 2.0 Flash's
 * 1M-token context window means we can be generous — include everything
 * that helps the coach sound like it actually knows this person.
 */

import type { UserProfile } from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (iso: string): string => {
    if (!iso) return '';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
        return iso;
    }
};

const energyLabel = (level: number): string => {
    const labels: Record<number, string> = {
        1: 'Depleted',
        2: 'Low',
        3: 'Moderate',
        4: 'Energized',
        5: 'Peak',
    };
    return labels[level] ?? `${level}/5`;
};

const avg = (nums: number[]): number =>
    nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : 0;

// ── Main builder ──────────────────────────────────────────────────────────────

export const buildCoachMemoryContext = (user: UserProfile): string => {
    const lines: string[] = [];
    const firstName = user.name?.split(' ')[0] || user.name || 'User';
    const coachName = user.coachName || 'Palante Coach';

    lines.push('=== COACH MEMORY BRIEF ===');
    lines.push(`User: ${firstName} | Profession: ${user.profession || 'Not specified'} | Coach: ${coachName}`);
    lines.push('');

    // ── Progress Snapshot ──────────────────────────────────────────────────────
    const completedFocuses = user.dailyFocuses?.filter(f => f.isCompleted).length ?? 0;
    const totalFocuses = user.dailyFocuses?.length ?? 0;
    const completedGoals = user.goals?.filter(g => g.completedAt).length ?? 0;
    const activeGoals = user.goals?.filter(g => !g.completedAt) ?? [];
    const totalPractices = user.practiceData?.totalPractices ?? 0;
    const currentEnergy = user.currentEnergy;

    lines.push('📊 PROGRESS SNAPSHOT');
    lines.push(`- Total lifetime practices: ${totalPractices}`);
    lines.push(`- Daily focuses today: ${completedFocuses}/${totalFocuses} done`);
    lines.push(`- Goals: ${activeGoals.length} active, ${completedGoals} completed all-time`);
    if (currentEnergy) {
        lines.push(`- Current energy: ${currentEnergy}/5 (${energyLabel(currentEnergy)})`);
    }
    if (user.streak && user.streak > 0) {
        lines.push(`- Current streak: ${user.streak} days`);
    }
    lines.push('');

    // ── Energy Trend ───────────────────────────────────────────────────────────
    const energyHistory = user.energyHistory?.slice(-14) ?? [];
    if (energyHistory.length >= 3) {
        const levels = energyHistory.map(e => e.level);
        const average = avg(levels);
        const lowDays = energyHistory.filter(e => e.level <= 2).length;
        const highDays = energyHistory.filter(e => e.level >= 4).length;
        const recent3 = levels.slice(-3);
        const trend =
            recent3[2] > recent3[0] ? 'trending upward'
            : recent3[2] < recent3[0] ? 'trending downward'
            : 'stable';

        lines.push('⚡ ENERGY TREND (Last 14 readings)');
        lines.push(`- Average: ${average}/5 | Low-energy days: ${lowDays} | High-energy days: ${highDays} | ${trend}`);
        lines.push('');
    }

    // ── Journal Entries (last 7) ───────────────────────────────────────────────
    const journals = user.journalEntries?.slice(-7).reverse() ?? [];
    if (journals.length > 0) {
        lines.push('📓 RECENT JOURNAL ENTRIES');
        for (const entry of journals) {
            const energyNote = entry.energyLevel ? ` | Energy: ${entry.energyLevel}/5` : '';
            lines.push(`- ${formatDate(entry.date)}: Win: "${entry.highlight}" | Challenge: "${entry.lowlight}"${energyNote}`);
            if (entry.freeform?.trim()) {
                lines.push(`  Notes: "${entry.freeform.trim().slice(0, 120)}${entry.freeform.length > 120 ? '…' : ''}"`);
            }
        }
        lines.push('');
    }

    // ── Morning Practices (last 7) ─────────────────────────────────────────────
    const mornings = user.dailyMorningPractice?.slice(-7).reverse() ?? [];
    if (mornings.length > 0) {
        lines.push('🌅 MORNING PRACTICES');
        for (const m of mornings) {
            const intention = m.dailyIntention ? ` | Intention: "${m.dailyIntention}"` : '';
            const gratitudes = m.gratitudes?.filter(Boolean).slice(0, 3).join(', ');
            const affirmations = m.affirmations?.filter(Boolean).slice(0, 2).join(' / ');
            lines.push(`- ${formatDate(m.date)}${intention}`);
            if (gratitudes) lines.push(`  Grateful for: ${gratitudes}`);
            if (affirmations) lines.push(`  Affirming: "${affirmations}"`);
        }
        lines.push('');
    }

    // ── Evening GLAD Entries (last 7) ──────────────────────────────────────────
    const evenings = user.dailyEveningPractice?.slice(-7).reverse() ?? [];
    if (evenings.length > 0) {
        lines.push('🌙 EVENING REFLECTIONS (GLAD)');
        for (const e of evenings) {
            lines.push(`- ${formatDate(e.date)}: Grateful: "${e.gratitude}" | Learned: "${e.learning}" | Accomplished: "${e.accomplishment}" | Delighted by: "${e.delight}"`);
        }
        lines.push('');
    }

    // ── Meditation Reflections (last 5) ───────────────────────────────────────
    const meditations = user.meditationReflections?.slice(-5).reverse() ?? [];
    if (meditations.length > 0) {
        lines.push('🧘 MEDITATION REFLECTIONS');
        for (const m of meditations) {
            lines.push(`- ${formatDate(m.date)} (${m.duration}min, mantra: "${m.mantra}"): Intention: "${m.intention}" | Reflection: "${m.reflection.slice(0, 100)}${m.reflection.length > 100 ? '…' : ''}"`);
        }
        lines.push('');
    }

    // ── Active Goals ──────────────────────────────────────────────────────────
    if (activeGoals.length > 0) {
        lines.push('🎯 ACTIVE GOALS');
        for (const goal of activeGoals.slice(0, 5)) {
            const progress = goal.targetValue
                ? Math.round((goal.currentValue / goal.targetValue) * 100)
                : goal.currentValue;
            const deadline = goal.deadline ? ` | Deadline: ${formatDate(goal.deadline)}` : '';
            const checkInNote = goal.checkIns?.length
                ? ` | Last check-in: "${goal.checkIns[goal.checkIns.length - 1]?.note ?? ''}"`
                : '';
            lines.push(`- "${goal.title}" (${goal.category}) — ${progress}% complete${deadline}${checkInNote}`);
        }
        lines.push('');
    }

    // ── Focus Areas ───────────────────────────────────────────────────────────
    if (user.focusAreas?.length) {
        lines.push(`🔍 FOCUS AREAS: ${user.focusAreas.join(', ')}`);
        lines.push('');
    }

    // ── Behavior Patterns ─────────────────────────────────────────────────────
    const bp = user.behaviorPattern;
    if (bp) {
        lines.push('📈 BEHAVIOR PATTERNS');
        lines.push(`- Preferred meditation time: ${bp.patterns.preferredPracticeTime.meditation}`);
        lines.push(`- Practice frequency: meditation ${bp.patterns.practiceFrequency.meditation}x/wk, breathwork ${bp.patterns.practiceFrequency.breathwork}x/wk`);
        if (bp.patterns.skipPatterns.consecutiveSkips > 1) {
            lines.push(`- Recent skip pattern: ${bp.patterns.skipPatterns.consecutiveSkips} consecutive days skipped`);
        }
        lines.push(`- Goal completion rate: ${Math.round(bp.patterns.goalCompletionRate * 100)}%`);
        lines.push('');
    }

    // ── Future Letters ────────────────────────────────────────────────────────
    const letters = user.futureLetters ?? [];
    const undelivered = letters.filter(l => !l.hasBeenDelivered);
    const delivered = letters.filter(l => l.hasBeenDelivered);
    if (letters.length > 0) {
        lines.push('📬 FUTURE LETTERS');
        lines.push(`- Total written: ${letters.length} | Delivered: ${delivered.length} | Waiting: ${undelivered.length}`);
        // Include the most recent delivered letter preview so the coach can reference it
        const lastDelivered = delivered[delivered.length - 1];
        if (lastDelivered) {
            lines.push(`- Most recent delivered (${formatDate(lastDelivered.deliveredDate ?? '')}): "${lastDelivered.content.slice(0, 120)}…"`);
        }
        lines.push('');
    }

    // ── Weekly Report Highlights (last 2) ────────────────────────────────────
    const reports = user.weeklyReports?.slice(-2).reverse() ?? [];
    if (reports.length > 0) {
        lines.push('📅 RECENT WEEKLY REPORTS');
        for (const r of reports) {
            const weekOf = formatDate(r.weekStartDate);
            const mood = r.moodTrends.mostCommonMood;
            const energyAvg = r.moodTrends.energyAverage?.toFixed(1);
            const goalRate = Math.round(r.goals.completionRate * 100);
            lines.push(`- Week of ${weekOf}: Mood: ${mood} | Energy avg: ${energyAvg}/5 | Goal completion: ${goalRate}%`);
            if (r.insights?.length) {
                lines.push(`  Insight: "${r.insights[0]}"`);
            }
        }
        lines.push('');
    }

    lines.push('=== END MEMORY BRIEF ===');

    return lines.join('\n');
};
