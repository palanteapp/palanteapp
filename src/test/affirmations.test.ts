/**
 * The app publishes only its own words. Earlier versions shipped ~2,100 quotes from
 * named third parties; those were removed in July 2026 so that "quote" means exactly
 * one thing across the product. These tests keep it that way, because the failure mode
 * is silent: a borrowed line pasted in with `author: "Palante"` looks identical to an
 * original one in the diff.
 */

import { describe, it, expect } from 'vitest';
import { AFFIRMATIONS } from '../data/affirmations';

describe('the line library is entirely Palante-authored', () => {
    it('attributes every line to Palante', () => {
        const foreign = AFFIRMATIONS.filter(q => q.author !== 'Palante');
        expect(foreign.map(q => `${q.id}: ${q.author}`)).toEqual([]);
    });

    it('has no duplicate ids', () => {
        const ids = AFFIRMATIONS.map(q => q.id);
        expect(ids.length).toBe(new Set(ids).size);
    });

    it('has no duplicate text', () => {
        const texts = AFFIRMATIONS.map(q => q.text.toLowerCase().trim());
        expect(texts.length).toBe(new Set(texts).size);
    });

    it('carries no em dashes', () => {
        const offenders = AFFIRMATIONS.filter(q => q.text.includes('—'));
        expect(offenders.map(q => q.id)).toEqual([]);
    });

    it('carries no emojis, per the design system', () => {
        const offenders = AFFIRMATIONS.filter(q => /\p{Extended_Pictographic}/u.test(q.text));
        expect(offenders.map(q => q.id)).toEqual([]);
    });

    /**
     * Recognizable lines that were previously in the library attributed to Palante but
     * belong to someone else. Listed explicitly so re-adding one fails loudly rather
     * than quietly reintroducing the problem this whole change exists to fix.
     */
    it('does not contain the borrowed aphorisms that were removed', () => {
        const removed = [
            'excellence is a habit, not an act',      // Will Durant, summarizing Aristotle
            'pain is temporary',                      // commonly attributed to Lance Armstrong
            'comfort zone is where dreams go to die', // stock internet aphorism
            "don't stop until you're proud",          // stock internet aphorism
        ];
        const found: string[] = [];
        for (const line of AFFIRMATIONS) {
            const lower = line.text.toLowerCase();
            for (const phrase of removed) {
                if (lower.includes(phrase)) found.push(`${line.id}: ${phrase}`);
            }
        }
        expect(found).toEqual([]);
    });

    it('covers all three intensity tiers with enough lines to avoid fast repeats', () => {
        for (const tier of [1, 2, 3] as const) {
            const count = AFFIRMATIONS.filter(q => q.intensity === tier).length;
            // The iOS widget samples 24 lines a day from a single tier's neighborhood;
            // fewer than that guarantees same-day repetition.
            expect(count).toBeGreaterThanOrEqual(30);
        }
    });
});

describe('the deleted quote modules are gone', () => {
    const modules = import.meta.glob('../data/*.ts');

    it('has no quotes.ts or expansionQuotes* left in src/data', () => {
        const leftover = Object.keys(modules).filter(p => /\/(quotes|expansionQuotes|latinoQuotes)/.test(p));
        expect(leftover).toEqual([]);
    });
});

/**
 * The src/data sweep above is not enough on its own. WeeklyHighlightsModal.tsx held twelve
 * quotes from named authors (Aristotle, Twain, James Clear, and others) in a component
 * const, and survived the July 2026 purge untouched because every check was pointed at
 * src/data. These scans cover all source, so the next borrowed line has nowhere to sit.
 */
const SOURCE_FILES = import.meta.glob('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

// Vite normalizes glob keys, so sibling test files come back as "./foo.test.ts" rather
// than a "/test/" path. Match on the filename to exclude them reliably.
const appSources = () => Object.entries(SOURCE_FILES).filter(([p]) => !/\.test\.tsx?$/.test(p));

// Comments legitimately name the authors whose lines were removed, to explain why. Only
// code and shipped copy are in scope.
const withoutComments = (contents: string): { line: string; n: number }[] => {
    const out: { line: string; n: number }[] = [];
    let inBlock = false;
    contents.split('\n').forEach((raw, i) => {
        let line = raw;
        if (inBlock) {
            const end = line.indexOf('*/');
            if (end === -1) return;
            line = line.slice(end + 2);
            inBlock = false;
        }
        const block = line.indexOf('/*');
        if (block !== -1) { inBlock = !line.includes('*/', block); line = line.slice(0, block); }
        const lineComment = line.indexOf('//');
        if (lineComment !== -1) line = line.slice(0, lineComment);
        if (line.trim()) out.push({ line, n: i + 1 });
    });
    return out;
};

describe('no borrowed lines anywhere in source', () => {
    it('finds source files to scan', () => {
        expect(appSources().length).toBeGreaterThan(50);
    });

    it('attributes every author literal to Palante', () => {
        const offenders: string[] = [];
        for (const [path, contents] of appSources()) {
            for (const { line, n } of withoutComments(contents)) {
                for (const m of line.matchAll(/author:\s*['"]([^'"]+)['"]/g)) {
                    if (!m[1].includes('Palante')) offenders.push(`${path}:${n}: ${m[1]}`);
                }
            }
        }
        expect(offenders).toEqual([]);
    });

    /**
     * Names, not phrases. A borrowed quote nearly always arrives with its author attached,
     * and prompts that tell the model to write "like" a real person invite it to reproduce
     * that person's actual sentences.
     */
    it('names no third-party author or figure in code or prompts', () => {
        const names = /\b(aristotle|confucius|einstein|mark twain|james clear|rumi|seneca|marcus aurelius|epictetus|maya angelou|gandhi|mandela|thoreau|emerson|nietzsche|buddha|lao tzu|thich nhat hanh|brene brown|goggins|jocko|tony robbins|oprah|steve jobs|theodore roosevelt|churchill|c\.s\. lewis|ryan holiday|john maxwell|gretchen rubin|robert collier|max depree|will durant|lance armstrong)\b/i;
        const offenders: string[] = [];
        for (const [path, contents] of appSources()) {
            for (const { line, n } of withoutComments(contents)) {
                const hit = line.match(names);
                if (hit) offenders.push(`${path}:${n}: ${hit[0]}`);
            }
        }
        expect(offenders).toEqual([]);
    });
});
