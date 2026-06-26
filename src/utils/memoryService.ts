import { supabase } from '../lib/supabase';
import type { ChatMessage } from '../types';
import { fetchWithTimeout } from './fetchWithTimeout';

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/anthropic-proxy`;
const MODEL = 'claude-haiku-4-5-20251001';

function proxyHeaders(): HeadersInit {
    return {
        'content-type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
    };
}

/** Load the most recent memories for a user (last 30 days, up to 15 entries). */
export const loadConversationMemories = async (userId: string): Promise<string[]> => {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data, error } = await supabase
        .from('conversation_memories')
        .select('memory_text')
        .eq('user_id', userId)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(15);

    if (error || !data) return [];
    return data.map(row => row.memory_text as string);
};

/**
 * Use Claude to extract key memory statements from a completed session,
 * then persist them to Supabase so future sessions can reference them.
 * Only runs if the user sent at least 3 messages (short greetings aren't worth saving).
 */
export const extractAndSaveMemories = async (
    messages: ChatMessage[],
    userId: string,
    userName: string
): Promise<void> => {
    const userTurns = messages.filter(m => m.role === 'user' && !m.id?.startsWith('init-'));
    if (userTurns.length < 3) return;

    const transcript = messages
        .filter(m => !m.id?.startsWith('init-'))
        .map(m => `${m.role === 'user' ? userName : 'Palante'}: ${m.text}`)
        .join('\n');

    const extractionPrompt = `You are a memory extraction assistant for Palante, a personal wellness app.

From the conversation below, extract 3–5 memory statements that will help ${userName}'s AI partner recall important things in future sessions. These memories should feel personal and specific — the kind of detail that, when referenced later, makes someone feel truly seen.

Focus on:
- Specific people in their life (names, relationships, what happened with them)
- Concrete situations or events they described (not just "stress at work" — the specific project, boss, conflict)
- Emotions they named or showed, and what triggered them
- Things they're proud of, afraid of, or actively working on
- Any breakthrough moment, realization, or thing they said that felt significant

Rules:
- Write each memory as one sentence starting with "${userName}"
- Be specific — include names, details, and the actual content of what was shared
- Prefer vivid over vague: "mentioned her sister called after months of silence" beats "talked about family"
- Only include things actually said — do not invent or infer
- Return ONLY the memory sentences, one per line, nothing else

Conversation:
${transcript}`;

    try {
        const res = await fetchWithTimeout(PROXY_URL, {
            method: 'POST',
            headers: proxyHeaders(),
            body: JSON.stringify({
                model: MODEL,
                max_tokens: 400,
                messages: [{ role: 'user', content: extractionPrompt }],
            }),
        });

        if (!res.ok) return;

        const result = await res.json();
        const raw: string = result?.content?.[0]?.text ?? '';
        const memories = raw
            .split('\n')
            .map((s: string) => s.trim())
            .filter((s: string) => s.length > 15);

        if (memories.length === 0) return;

        await supabase
            .from('conversation_memories')
            .insert(memories.map((memory_text: string) => ({ user_id: userId, memory_text })));
    } catch (e) {
        console.error('[Palante Memory] Failed to extract or save memories:', e);
    }
};
