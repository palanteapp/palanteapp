/**
 * Copy that got written once tends to get written again. These tests are the standing
 * guard: the runtime filter catches generated text, and the source scan catches the
 * hand-written fallbacks, intro lines, and card copy the filter never sees.
 *
 * "the whole practice" is the case that prompted this, a construction that asserts
 * significance rather than showing it, which is a wasted line in a product whose whole
 * value is saying something true and succinct.
 */

import { describe, it, expect } from 'vitest';
import { BANNED_PHRASES, MEMOIR_BANNED_PHRASES, containsBannedPhrase } from '../utils/aiService';

// Vite's glob rather than node:fs. This config has no node types, and the raw query
// gives the same file contents without dragging @types/node into the app tsconfig.
const SOURCE_FILES = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

describe('banned phrase filter', () => {
    it('bans the phrase that started this', () => {
        expect(BANNED_PHRASES).toContain('the whole practice');
        expect(MEMOIR_BANNED_PHRASES).toContain('the whole practice');
    });

    it('catches it regardless of casing or surrounding text', () => {
        expect(containsBannedPhrase('You made the decision to be here and that is the whole practice.')).toBe(true);
        expect(containsBannedPhrase('That Is The Whole Practice')).toBe(true);
        expect(containsBannedPhrase('and that is the whole practice, and you did it')).toBe(true);
    });

    it('leaves clean copy alone', () => {
        expect(containsBannedPhrase('Consistency is built on ordinary mornings, not inspired ones.')).toBe(false);
        expect(containsBannedPhrase('Most days get spent without ever being seen. This one did not.')).toBe(false);
    });

    it('applies the stricter memoir list only to memoirs', () => {
        expect(containsBannedPhrase('a transformational year', MEMOIR_BANNED_PHRASES)).toBe(true);
        expect(containsBannedPhrase('a transformational year')).toBe(false);
    });
});

/**
 * Scans checked-in source for the phrase. The runtime filter cannot see these strings
 * they are the fallbacks and static lines shown when AI is off or a call fails, which is
 * exactly when the writing matters most.
 */
// Vite normalizes glob keys, so sibling test files come back as "./foo.test.ts" rather
// than a "/test/" path. Match on the filename to exclude them reliably.
const scannableFiles = () =>
    Object.entries(SOURCE_FILES).filter(([path]) => !/\.test\.tsx?$/.test(path));

describe('no banned phrase in checked-in copy', () => {
    it('finds source files to scan', () => {
        expect(scannableFiles().length).toBeGreaterThan(50);
    });

    it('has no occurrence of "the whole practice" outside the ban list itself', () => {
        const offenders: string[] = [];
        for (const [path, contents] of scannableFiles()) {
            contents.split('\n').forEach((line, i) => {
                if (!line.toLowerCase().includes('the whole practice')) return;
                const trimmed = line.trim();
                // The places that must name the phrase to forbid it: the ban list entry
                // itself, its doc comment, and the prompt rules telling the model to
                // avoid it. Anything else is the phrase creeping back into real copy.
                const isListEntry = /^'the whole practice',?$/.test(trimmed);
                const isComment = trimmed.startsWith('*') || trimmed.startsWith('//');
                const isPromptRule = /NEVER write|Never write|banned word/.test(line);
                if (isListEntry || isComment || isPromptRule) return;
                offenders.push(`${path}:${i + 1}`);
            });
        }
        expect(offenders).toEqual([]);
    });
});

/**
 * Strips line comments, block comments, and JSX comments so the em dash scan sees only
 * code and copy. Developer comments are not shipped and are not the target of the rule.
 */
const stripComments = (line: string, inBlock: boolean): [string, boolean] => {
    let out = '';
    let i = 0;
    while (i < line.length) {
        if (inBlock) {
            const end = line.indexOf('*/', i);
            if (end === -1) return [out, true];
            i = end + 2;
            inBlock = false;
            continue;
        }
        if (line.startsWith('//', i)) return [out, false];
        if (line.startsWith('{/*', i)) { inBlock = true; i += 3; continue; }
        if (line.startsWith('/*', i)) { inBlock = true; i += 2; continue; }
        out += line[i];
        i += 1;
    }
    return [out, inBlock];
};

/**
 * Quote files hold verbatim lines from named authors. Rewriting punctuation inside an
 * attributed quotation changes what a real person is on record as saying, so they are
 * excluded here rather than swept with everything else.
 */
const isQuoteData = (path: string) => /\/data\/(quotes|expansionQuotes)/.test(path);

describe('no em dashes in app copy', () => {
    it('has no em dash in any shipped string or JSX text', () => {
        const offenders: string[] = [];
        for (const [path, contents] of scannableFiles()) {
            if (isQuoteData(path)) continue;
            let inBlock = false;
            contents.split('\n').forEach((line, i) => {
                const [code, next] = stripComments(line, inBlock);
                inBlock = next;
                if (!code.includes('—')) return;
                // The prompt rules and this test must name the character to forbid it.
                if (/em dash/i.test(line) || /not\.toContain/.test(line)) return;
                offenders.push(`${path}:${i + 1}: ${line.trim().slice(0, 100)}`);
            });
        }
        expect(offenders).toEqual([]);
    });
});
