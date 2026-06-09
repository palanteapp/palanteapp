/**
 * Tests the conversation_memories table end-to-end.
 * Run: node scripts/test-memory.mjs
 * Requires: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 *           PALANTE_TEST_EMAIL and PALANTE_TEST_PASSWORD as env vars or in .env
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env manually
const env = Object.fromEntries(
    readFileSync(new URL('../.env', import.meta.url), 'utf8')
        .split('\n')
        .filter(l => l.includes('=') && !l.startsWith('#'))
        .map(l => l.split('=').map(s => s.trim()))
);

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
    console.error('\nUsage: TEST_EMAIL=you@example.com TEST_PASSWORD=yourpass node scripts/test-memory.mjs\n');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    console.log('\n--- Palante Memory System Test ---\n');

    // 1. Sign in
    console.log('1. Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: EMAIL, password: PASSWORD });
    if (authError) { console.error('   FAIL:', authError.message); process.exit(1); }
    const userId = authData.user.id;
    console.log(`   OK — user id: ${userId}`);

    // 2. Insert a test memory
    console.log('\n2. Inserting test memory...');
    const testMemory = `[TEST] ${EMAIL} mentioned they want to test the Palante memory system on ${new Date().toISOString()}`;
    const { error: insertError } = await supabase
        .from('conversation_memories')
        .insert({ user_id: userId, memory_text: testMemory });
    if (insertError) { console.error('   FAIL:', insertError.message); process.exit(1); }
    console.log('   OK — memory inserted');

    // 3. Read it back
    console.log('\n3. Reading memories back...');
    const { data: rows, error: readError } = await supabase
        .from('conversation_memories')
        .select('memory_text, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
    if (readError) { console.error('   FAIL:', readError.message); process.exit(1); }
    console.log(`   OK — found ${rows.length} memories:`);
    rows.forEach(r => console.log(`      • ${r.memory_text.slice(0, 80)}...`));

    // 4. Verify the test memory is in the results
    const found = rows.some(r => r.memory_text === testMemory);
    if (!found) { console.error('\n   FAIL — test memory not found in results'); process.exit(1); }
    console.log('\n   OK — test memory confirmed in results');

    // 5. Clean up the test row
    console.log('\n4. Cleaning up test row...');
    const { error: deleteError } = await supabase
        .from('conversation_memories')
        .delete()
        .eq('user_id', userId)
        .eq('memory_text', testMemory);
    if (deleteError) { console.error('   FAIL:', deleteError.message); }
    else console.log('   OK — test row deleted');

    // 6. RLS check: sign out and try to read (should return empty/error)
    console.log('\n5. RLS check — reading as anonymous...');
    await supabase.auth.signOut();
    const { data: anonRows, error: anonError } = await supabase
        .from('conversation_memories')
        .select('memory_text')
        .eq('user_id', userId);
    if (anonError || (anonRows && anonRows.length === 0)) {
        console.log('   OK — RLS is blocking unauthenticated reads (0 rows returned)');
    } else {
        console.warn('   WARN — RLS may not be configured correctly');
    }

    console.log('\n--- ALL TESTS PASSED ---\n');
}

run().catch(e => { console.error('Unexpected error:', e); process.exit(1); });
