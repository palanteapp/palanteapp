/**
 * Palante is a wellness app, not a medical one. src/data/scienceFacts.ts states the
 * editorial rule in prose ("Medical or metabolic claims of any kind" are out, and
 * "Apple's review guidelines care about unsubstantiated health claims"), but nothing
 * enforced it, and featureInfo.ts drifted: two benefit lists still promised "Reduced
 * anxiety and cortisol levels" and "Reduced rumination and anxiety through structured
 * processing" as plain fact, alongside three other lists that had already been rewritten
 * in the hedged, experiential voice. This test is the enforcement the rule was missing.
 *
 * Scope note: `research` prose is deliberately exempt. That field is where hedged
 * discussion of actual findings belongs, and it legitimately uses words like "clinical"
 * while explicitly disclaiming treatment.
 */

import { describe, it, expect } from 'vitest';
import { FEATURE_INFO } from '../data/featureInfo';
import { SCIENCE_FACTS } from '../data/scienceFacts';

/**
 * Claim constructions, not topics. Mentioning anxiety is fine; promising to reduce it
 * is the thing Apple reads as a medical claim.
 */
const FORBIDDEN: { pattern: RegExp; why: string }[] = [
    { pattern: /\b(cures?|curing|heals?|healing|diagnos)\b/i, why: 'claims to cure, heal, or diagnose' },
    // Bare "treat" is excluded on purpose: it is also the ordinary verb meaning "regard",
    // as in "Treat any confident claim about it, including ours, with some skepticism."
    // Only the medical sense is a claim, so it has to be matched by its object.
    { pattern: /\bis\s+a\s+treatment\b|\btreatment\s+for\b|\btreats?\s+(any\s+)?(medical\s+)?(condition|disease|illness|disorder|symptoms?|anxiety|depression|insomnia)\b/i, why: 'positions the practice as a medical treatment' },
    { pattern: /\bclinically\s+(proven|shown|validated)\b/i, why: 'claims clinical proof' },
    { pattern: /\bscientifically[\s-]+(proven|designed|validated)\b/i, why: 'claims scientific proof' },
    { pattern: /\b(reduce[sd]?|lower[sd]?|decreases?)\s+(your\s+)?(anxiety|depression|cortisol|blood pressure|inflammation|stress)\b/i, why: 'promises a physiological or psychiatric reduction as fact' },
    { pattern: /\brewires?\s+your\s+brain\b/i, why: 'unsupported neuroplasticity claim' },
    { pattern: /\bshrinks?\s+the\s+amygdala\b/i, why: 'unsupported neuroanatomy claim' },
    { pattern: /\breleases?\s+(dopamine|serotonin|oxytocin)\b/i, why: 'states a neurotransmitter mechanism as settled' },
    { pattern: /\bboosts?\s+(your\s+)?immune\b/i, why: 'immune-function claim' },
    { pattern: /\b\d+\s?%/, why: 'percentage claim without a checkable citation' },
];

/** Every user-facing string in FEATURE_INFO except `research`. */
const featureCopy = (): { where: string; text: string }[] => {
    const out: { where: string; text: string }[] = [];
    for (const [key, info] of Object.entries(FEATURE_INFO)) {
        const { title, description, steps, tips } = info.howToUse;
        out.push({ where: `${key}.howToUse.title`, text: title });
        out.push({ where: `${key}.howToUse.description`, text: description });
        steps.forEach((s, i) => out.push({ where: `${key}.howToUse.steps[${i}]`, text: s }));
        (tips ?? []).forEach((t, i) => out.push({ where: `${key}.howToUse.tips[${i}]`, text: t }));
        if (info.theScience) {
            const { title: sTitle, overview, benefits } = info.theScience;
            out.push({ where: `${key}.theScience.title`, text: sTitle });
            out.push({ where: `${key}.theScience.overview`, text: overview });
            benefits.forEach((b, i) => out.push({ where: `${key}.theScience.benefits[${i}]`, text: b }));
        }
    }
    return out;
};

const scan = (entries: { where: string; text: string }[]): string[] => {
    const offenders: string[] = [];
    for (const { where, text } of entries) {
        for (const { pattern, why } of FORBIDDEN) {
            const hit = text.match(pattern);
            if (hit) offenders.push(`${where}: "${hit[0]}" ${why}`);
        }
    }
    return offenders;
};

describe('feature copy makes no medical claims', () => {
    it('has copy to scan', () => {
        expect(featureCopy().length).toBeGreaterThan(20);
    });

    it('makes no forbidden claim in any user-facing feature string', () => {
        expect(scan(featureCopy())).toEqual([]);
    });

    /**
     * The specific regression: benefit bullets are the easiest place to slip into
     * promising an outcome, because the format invites short confident phrases.
     */
    it('keeps every benefit bullet free of outcome promises', () => {
        const bullets = featureCopy().filter(e => e.where.includes('.benefits['));
        expect(bullets.length).toBeGreaterThan(20);
        expect(scan(bullets)).toEqual([]);
    });
});

describe('science facts stay hedged', () => {
    it('has facts to scan', () => {
        expect(SCIENCE_FACTS.length).toBeGreaterThan(10);
    });

    it('makes no forbidden claim', () => {
        const entries = SCIENCE_FACTS.map(f => ({ where: `SCIENCE_FACTS.${f.id}`, text: f.fact }));
        expect(scan(entries)).toEqual([]);
    });
});
