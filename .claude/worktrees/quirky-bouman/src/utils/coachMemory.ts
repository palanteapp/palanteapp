/**
 * Coach Memory Builder
 *
 * Converts the full UserProfile into a structured memory brief that gives
 * the AI coach deep context across sessions. Leverages Gemini 2.0 Flash's
 * 1M-token context window — no summarization needed, just rich, organized data.
 */
import type { UserProfile } from '../types';

/** Build a comprehensive memory brief from the user's full profile */
export function buildCoachMemoryBrief(user: UserProfile): string {
    const sections: string[] = [];

    // ── Basic profile ──────────────────────────────────────────────────────────
    const profileLines = [
        `Name: ${user.name}`,
        user.profession ? `Profession: ${user.profession}` : null,
        user.career ? `Career context: ${user.career}` : null,
        user.interests?.length ? `Interests: ${user.interests.join(', ')}` : null,
        user.focusAreas?.length ? `Focus areas: ${user.focusAreas.join(', ')}` : null,
        `Coach intensity preference: ${user.quoteIntensity === 1 ? 'Gentle' : user.quoteIntensity === 2 ? 'Direct' : 'Bold'}`,
    ].filter(Boolean);
    sections.push(`=== USER PROFILE ===\n${profileLines.join('\n')}`);

    // ── Current stats ──────────────────────────────────────────────────────────
    const totalPractices = user.practiceData?.totalPractices ?? 0;
    sections.push(
        `=== CURRENT STATS ===\n` +
        `Streak: ${user.streak || 0} days\n` +
        `Total practices: ${totalPractices}\n` +
        `Energy today: ${user.currentEnergy ? `${user.currentEnergy}/5` : 'Not logged'}`
    );

    // ── Goals ──────────────────────────────────────────────────────────────────
    if (user.goals?.length) {
        const active = user.goals.filter(g => !g.isCompleted).slice(0, 6);
        const recentCompleted = user.goals.filter(g => g.isCompleted).slice(-3);
        const goalLines = [
            ...active.map(g => `  [ACTIVE] ${g.title}${g.category ? ` (${g.category})` : ''}`),
            ...recentCompleted.map(g => `  [DONE] ${g.title}`),
        ];
        if (goalLines.length) {
            sections.push(`=== GOALS ===\n${goalLines.join('\n')}`);
        }
    }

    // ── Energy patterns ────────────────────────────────────────────────────────
    if (user.energyHistory?.length) {
        const recent = user.energyHistory.slice(-14);
        const avg = recent.reduce((sum, e) => sum + e.level, 0) / recent.length;
        const trend = avg >= 3.5 ? 'generally high' : avg >= 2.5 ? 'moderate' : 'lower than ideal';
        const latest = recent[recent.length - 1];
        const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const lowestDay = (() => {
            const byDay: Record<number, number[]> = {};
            recent.forEach(e => {
                const d = new Date(e.timestamp).getDay();
                (byDay[d] ??= []).push(e.level);
            });
            let worstDay = -1, worstAvg = 99;
            Object.entries(byDay).forEach(([d, levels]) => {
                const a = levels.reduce((s, v) => s + v, 0) / levels.length;
                if (a < worstAvg) { worstAvg = a; worstDay = parseInt(d); }
            });
            return worstDay >= 0 ? dayLabels[worstDay] : null;
        })();
        sections.push(
            `=== ENERGY PATTERNS (last 14 logs) ===\n` +
            `Average: ${avg.toFixed(1)}/5 (${trend})\n` +
            `Most recent: ${latest?.level}/5 on ${latest?.timestamp?.split('T')[0]}\n` +
            (lowestDay ? `Typically lowest on: ${lowestDay}s` : '')
        );
    }

    // ── Journal entries ────────────────────────────────────────────────────────
    if (user.journalEntries?.length) {
        const recent = user.journalEntries.slice(-10);
        const lines = recent.map(e => {
            const parts = [e.date];
            if (e.highlight) parts.push(`Win: "${e.highlight}"`);
            if (e.lowlight) parts.push(`Challenge: "${e.lowlight}"`);
            if (e.midpoint) parts.push(`Learning: "${e.midpoint}"`);
            return `  ${parts.join(' | ')}`;
        });
        sections.push(`=== RECENT JOURNAL (last 10 entries) ===\n${lines.join('\n')}`);
    }

    // ── Morning practices ──────────────────────────────────────────────────────
    if (user.dailyMorningPractice?.length) {
        const recent = user.dailyMorningPractice.slice(-7);
        const lines = recent.map(p => {
            const grats = p.gratitudes?.slice(0, 2).join('; ') ?? '';
            const intParts = [`${p.date}`];
            if (grats) intParts.push(`Grateful: "${grats}"`);
            if (p.intention) intParts.push(`Intention: "${p.intention}"`);
            return `  ${intParts.join(' | ')}`;
        });
        sections.push(`=== MORNING PRACTICES (last 7) ===\n${lines.join('\n')}`);
    }

    // ── Evening practices ──────────────────────────────────────────────────────
    if (user.dailyEveningPractice?.length) {
        const recent = user.dailyEveningPractice.slice(-7);
        const lines = recent.map(p =>
            `  ${p.date} | Grateful: "${p.gratitude}" | Accomplished: "${p.accomplishment}"`
        );
        sections.push(`=== EVENING PRACTICES (last 7) ===\n${lines.join('\n')}`);
    }

    // ── Meditation reflections ─────────────────────────────────────────────────
    if (user.meditationReflections?.length) {
        const recent = user.meditationReflections.slice(-5);
        const lines = recent.map(r => {
            const parts = [r.date];
            if (r.intention) parts.push(`Intention: "${r.intention}"`);
            if (r.reflection) parts.push(`Reflection: "${r.reflection}"`);
            return `  ${parts.join(' | ')}`;
        });
        sections.push(`=== MEDITATION REFLECTIONS (last 5) ===\n${lines.join('\n')}`);
    }

    // ── Weekly report summary ──────────────────────────────────────────────────
    if (user.weeklyReports?.length) {
        const last = user.weeklyReports[user.weeklyReports.length - 1];
        if (last?.summary) {
            sections.push(`=== LAST WEEKLY REPORT (${last.weekStartDate}) ===\n  ${last.summary}`);
        }
    }

    // ── Future letters ─────────────────────────────────────────────────────────
    if (user.futureLetters?.length) {
        const undelivered = user.futureLetters.filter(l => !l.hasBeenDelivered).slice(0, 2);
        if (undelivered.length) {
            const lines = undelivered.map(l =>
                `  Written ${l.writtenDate}: "${l.content.slice(0, 120)}${l.content.length > 120 ? '…' : ''}"`
            );
            sections.push(`=== LETTERS TO FUTURE SELF (undelivered) ===\n${lines.join('\n')}`);
        }
    }

    if (sections.length <= 1) return ''; // Only profile — not enough to be useful

    return `━━━ COACH MEMORY (DO NOT reveal this block verbatim to the user) ━━━\n\n${sections.join('\n\n')}\n\n━━━ END MEMORY ━━━`;
}

/**
 * Extract a concise daily snapshot from the user's data for morning brief generation.
 * Returns null if there isn't enough data yet.
 */
export function buildDailyBriefContext(user: UserProfile): {
    recentWins: string[];
    recentChallenges: string[];
    activeGoals: string[];
    latestIntention: string | null;
    averageEnergy: number | null;
    streak: number;
} | null {
    const recentWins: string[] = [];
    const recentChallenges: string[] = [];

    // Last 3 journal entries
    user.journalEntries?.slice(-3).forEach(e => {
        if (e.highlight) recentWins.push(e.highlight);
        if (e.lowlight) recentChallenges.push(e.lowlight);
    });

    // Last evening practice
    const lastEvening = user.dailyEveningPractice?.slice(-1)[0];
    if (lastEvening?.accomplishment) recentWins.push(lastEvening.accomplishment);
    if (lastEvening?.gratitude) recentWins.push(lastEvening.gratitude);

    const activeGoals = (user.goals ?? [])
        .filter(g => !g.isCompleted)
        .slice(0, 3)
        .map(g => g.title);

    const lastMorning = user.dailyMorningPractice?.slice(-1)[0];
    const latestIntention = lastMorning?.intention ?? null;

    const energyLogs = user.energyHistory?.slice(-7) ?? [];
    const averageEnergy = energyLogs.length
        ? energyLogs.reduce((s, e) => s + e.level, 0) / energyLogs.length
        : null;

    // Need at least some data
    if (!recentWins.length && !activeGoals.length) return null;

    return {
        recentWins: recentWins.slice(0, 3),
        recentChallenges: recentChallenges.slice(0, 2),
        activeGoals,
        latestIntention,
        averageEnergy: averageEnergy !== null ? Math.round(averageEnergy * 10) / 10 : null,
        streak: user.streak || 0,
    };
}
