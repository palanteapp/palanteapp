/**
 * AI Usage Budget: per-user daily cap on open-ended partner chat.
 *
 * WHY THIS EXISTS
 * Partner chat is the only *unbounded* AI cost vector in the app. The daily
 * practice/affirmation/quote calls fire at most once per day each, so they're
 * self-limiting. Chat is not: a user can send hundreds of messages a day.
 *
 * At Haiku 4.5 pricing a partner-chat turn costs ~$0.003. Against ~$43 net
 * revenue per user/year, the math only breaks down for the pathological
 * outlier sending 100–300 messages every single day. This cap removes that
 * tail risk without ever touching normal use.
 *
 * COST MATH AT THE CURRENT LIMIT
 *   AI_DAILY_CHAT_LIMIT × ~$0.004 × 365 = absolute worst-case AI spend/user/yr
 *   30/day → ~$0.12/day → ~$44/yr if a user maxed it every single day, 365 days.
 * Against ~$51 net revenue under Apple's Small Business Program (15% cut), even
 * that mythical everyday-maxer stays profitable. Real heavy users average well
 * under 30/day on active days, so this never touches a genuine user. It only
 * caps the pathological tail. Tune the single constant below to trade headroom
 * against safety; see the in-app unit-economics model for the full curve.
 */

import { STORAGE_KEYS } from '../constants/storageKeys';

/**
 * Max partner-chat AI calls per user per local day.
 * Lower this to tighten the worst-case ceiling; raise it to give power users
 * more room. See the cost math in the file header before changing.
 */
export const AI_DAILY_CHAT_LIMIT = 30;

interface UsageRecord {
  /** Local date the count applies to, 'YYYY-MM-DD'. */
  date: string;
  /** Partner-chat AI calls made on that date. */
  count: number;
}

/** Local calendar day key, e.g. '2026-06-14'. Resets the count at local midnight. */
function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Read today's usage. Returns a zeroed record for a new day (or on any storage
 * error): the cap is a safety net, so when in doubt we fail *open* rather than
 * block a paying user's chat over a tracking glitch.
 */
function readUsage(): UsageRecord {
  const today = todayKey();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AI_USAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as UsageRecord;
      if (parsed.date === today && typeof parsed.count === 'number') {
        return parsed;
      }
    }
  } catch {
    // fall through to a fresh record
  }
  return { date: today, count: 0 };
}

function writeUsage(rec: UsageRecord): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AI_USAGE, JSON.stringify(rec));
  } catch {
    // Storage full / unavailable: tracking degrades but chat keeps working.
  }
}

/** Partner-chat AI calls the user has made so far today. */
export function getChatUsageToday(): number {
  return readUsage().count;
}

/** Partner-chat AI calls the user has left today (never negative). */
export function getRemainingChats(): number {
  return Math.max(0, AI_DAILY_CHAT_LIMIT - getChatUsageToday());
}

/** True once the user has hit today's partner-chat ceiling. */
export function isChatLimitReached(): boolean {
  return getChatUsageToday() >= AI_DAILY_CHAT_LIMIT;
}

/** Record one successful partner-chat AI call against today's budget. */
export function recordChatCall(): void {
  const rec = readUsage();
  writeUsage({ date: rec.date, count: rec.count + 1 });
}

/**
 * Warm, partner-voiced message shown when the daily ceiling is reached.
 * Framed as care, not a paywall. Never calls itself a "coach".
 */
export function getDailyLimitMessage(name?: string): string {
  const who = name?.trim() ? `, ${name.trim()}` : '';
  return `I've loved being here with you today${who}. Let's pick this back up tomorrow so I can show up fully rested and present for you. Rest well. I'm not going anywhere, and I'll be right here when you return.`;
}
