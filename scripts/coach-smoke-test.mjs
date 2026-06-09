// Smoke test for the migrated Coach payload shape.
// Replicates the exact threaded-history logic from chatWithCoach / chatWithCoachPillar
// and hits the real Anthropic API. Prints every test's status and the model's reply.
//
// Run from the Palante repo root:
//   node scripts/coach-smoke-test.mjs

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENV_PATH = resolve(__dirname, '..', '.env');
const env = Object.fromEntries(
    readFileSync(ENV_PATH, 'utf8')
        .split('\n')
        .filter(l => l && !l.startsWith('#') && l.includes('='))
        .map(l => {
            const i = l.indexOf('=');
            return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
        })
);

const ANTHROPIC_API_KEY = env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-haiku-4-5-20251001';

if (!ANTHROPIC_API_KEY) {
    console.error('FAIL: VITE_ANTHROPIC_API_KEY not found in .env');
    process.exit(1);
}
console.log(`Loaded key: ${ANTHROPIC_API_KEY.slice(0, 10)}...${ANTHROPIC_API_KEY.slice(-4)} (length ${ANTHROPIC_API_KEY.length})`);

// ── Replicate the threaded-history builder from chatWithCoach exactly ─────────
function buildThreaded(history, message) {
    const cleanHistory = history
        .filter(msg => !msg.id?.startsWith('init-'))
        .slice(-10);
    const historyForAPI = cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role === 'user'
        ? cleanHistory.slice(0, -1)
        : cleanHistory;

    const threaded = [];
    for (const msg of historyForAPI) {
        const role = msg.role === 'user' ? 'user' : 'assistant';
        const last = threaded[threaded.length - 1];
        if (last && last.role === role) {
            last.content = `${last.content}\n\n${msg.text}`;
        } else {
            threaded.push({ role, content: msg.text });
        }
    }
    while (threaded.length > 0 && threaded[0].role !== 'user') {
        threaded.shift();
    }
    const lastThreaded = threaded[threaded.length - 1];
    if (lastThreaded && lastThreaded.role === 'user') {
        lastThreaded.content = `${lastThreaded.content}\n\n${message}`;
    } else {
        threaded.push({ role: 'user', content: message });
    }
    return threaded;
}

async function callAnthropic(systemPrompt, threaded, label) {
    const res = await fetch(ANTHROPIC_API_URL, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: ANTHROPIC_MODEL,
            max_tokens: 400,
            temperature: 0.7,
            system: systemPrompt,
            messages: threaded,
        }),
    });

    if (!res.ok) {
        const body = await res.text();
        return { ok: false, status: res.status, body, label };
    }
    const data = await res.json();
    const text = data.content?.[0]?.text?.trim();
    return { ok: true, status: 200, text, label, usage: data.usage };
}

const BASE_SYSTEM = `You are Palante Coach, a warm, nurturing, and deeply supportive friend and mentor.

USER CONTEXT:
- Name: Michael
- Profession: Founder
- Streak: 12 days
- Today's Progress: 1/3 goals completed.
- Time: morning

YOUR PERSONA:
- Tone: Deeply conversational, empathetic, and patient. Direct, clear, and stoic. Think Marcus Aurelius, Ryan Holiday - firm but wise.
- Conversation Style: Focus on a natural back-and-forth. Keep your responses relatively short at first. Listen more than you talk.
- App Guidance: Only suggest ONE relevant app feature if it feels truly helpful.

GOAL:
Build a genuine connection. Be a supportive presence.

MEDICAL SAFETY GUIDE:
- You are a wellness coach, NOT a doctor.
- NEVER provide medical advice or suggest specific diets.`;

const PILLAR_SYSTEM_ANXIETY = `You are Palante Coach, operating specifically as an anxiety and stress-relief guide.
The user has come to you specifically because they are dealing with anxiety, worry, or overwhelm.

YOUR APPROACH:
- Lead with calm, grounded empathy. Match their energy — do NOT be overly cheerful.
- Your first goal is always to help them feel heard and safe before offering any tools or advice.
- Use evidence-backed CBT and mindfulness-adjacent techniques when appropriate.
- Offer gentle, concrete micro-actions — nothing overwhelming.

USER CONTEXT:
- Name: Michael
- Streak: 12 days

TONE: Warm, unhurried, steady.
RESPONSE LENGTH: Under 120 words.`;

// ── Tests ────────────────────────────────────────────────────────────────────
const tests = [
    {
        label: 'Test 1: chatWithCoach with EMPTY history (first message)',
        run: () => {
            const threaded = buildThreaded([], 'I keep procrastinating on the work that actually matters. What is going on.');
            console.log('  Threaded payload:', JSON.stringify(threaded, null, 2));
            return callAnthropic(BASE_SYSTEM, threaded, 'empty-history');
        },
    },
    {
        label: 'Test 2: chatWithCoach with MID-CONVERSATION history',
        run: () => {
            const history = [
                { id: 'init-greet', role: 'assistant', text: 'Hey Michael, what is on your mind?' }, // filtered out
                { id: 'm1', role: 'user', text: 'I keep procrastinating on the work that actually matters.' },
                { id: 'a1', role: 'assistant', text: 'When you say "the work that actually matters," what comes to mind first?' },
                { id: 'm2', role: 'user', text: 'Writing. I have been avoiding it for two weeks now.' },
            ];
            const threaded = buildThreaded(history, 'Why do you think that is?');
            console.log('  Threaded payload (roles only):', threaded.map(t => t.role).join(' -> '));
            return callAnthropic(BASE_SYSTEM, threaded, 'mid-conversation');
        },
    },
    {
        label: 'Test 3: chatWithCoach with TWO consecutive user messages (should merge)',
        run: () => {
            const history = [
                { id: 'm1', role: 'user', text: 'I am stressed.' },
                { id: 'm2', role: 'user', text: 'Like, really stressed.' }, // back-to-back user; should merge
            ];
            const threaded = buildThreaded(history, 'I do not know what to do.');
            console.log('  Threaded payload:', JSON.stringify(threaded, null, 2));
            // Verify alternation client-side
            const valid = threaded.every((t, i) => {
                if (i === 0) return t.role === 'user';
                return t.role !== threaded[i - 1].role;
            }) || threaded.length <= 1;
            console.log(`  Alternation valid: ${valid}`);
            return callAnthropic(BASE_SYSTEM, threaded, 'consecutive-user-merge');
        },
    },
    {
        label: 'Test 4: chatWithCoachPillar (anxiety) with empty history',
        run: () => {
            const threaded = buildThreaded([], 'My chest has been tight all morning. I cannot focus.');
            return callAnthropic(PILLAR_SYSTEM_ANXIETY, threaded, 'pillar-anxiety');
        },
    },
];

let pass = 0;
let fail = 0;

for (const t of tests) {
    console.log(`\n=== ${t.label} ===`);
    try {
        const result = await t.run();
        if (result.ok) {
            console.log(`  STATUS: ${result.status} OK`);
            console.log(`  REPLY: ${result.text}`);
            console.log(`  USAGE: input=${result.usage?.input_tokens} output=${result.usage?.output_tokens}`);
            pass++;
        } else {
            console.log(`  STATUS: ${result.status} FAIL`);
            console.log(`  BODY: ${result.body}`);
            fail++;
        }
    } catch (e) {
        console.log(`  THROWN: ${e.message}`);
        fail++;
    }
}

console.log(`\n=== Summary: ${pass} pass / ${fail} fail ===`);
process.exit(fail === 0 ? 0 : 1);
