/**
 * Crisis Detection: deterministic, model-independent.
 *
 * The partner's system prompt asks the model to surface the 988 line when someone
 * is in distress. That is a request, not a guarantee: the model can miss it, soften
 * it, or talk around it. This module is the floor underneath that, plain pattern
 * matching on what the user actually typed, so the resources appear regardless of
 * what the model decides to say.
 *
 * Deliberate bias: FALSE POSITIVES ARE CHEAP, FALSE NEGATIVES ARE NOT.
 * A wrong match shows someone a support card they did not need. A miss means someone
 * in real trouble sees nothing. When a pattern is ambiguous, we let it fire. The exception is
 * for the specific everyday idioms in IDIOMS below, which are common enough that
 * matching them would train users to ignore the card entirely.
 *
 * This is not a clinical screening instrument and does not try to be one. It is a
 * tripwire that makes help visible.
 */

export type CrisisSeverity = 'active' | 'passive';

export interface CrisisSignal {
    severity: CrisisSeverity;
    /** The normalized phrase that matched. For local debugging only, never sent anywhere. */
    matched: string;
}

/**
 * Everyday hyperbole that shares vocabulary with crisis language.
 * These spans are removed from the text before matching. Order matters only in that
 * every entry is stripped before any pattern is tested.
 */
const IDIOMS: RegExp[] = [
    /\bdying (?:to|for)\b/g,            // "dying to see it", "dying for coffee"
    /\bdie for\b/g,                      // "I'd die for a nap"
    /\bkill(?:ing)? (?:it|this|that)\b/g, // "killing it", "kill this workout"
    /\bkilled it\b/g,
    /\bkill for\b/g,                     // "I'd kill for five minutes"
    /\b(?:is|are|was|were)? ?killing me\b/g, // "this deadline is killing me"
    /\bdead (?:tired|serious|set|weight|end|line)\b/g,
    /\bdrop dead\b/g,
    /\bsuicide (?:squad|mission|prevention|hotline|lifeline|line)\b/g,
    /\bcommercial suicide\b/g,
    /\bcareer suicide\b/g,
    /\bpolitical suicide\b/g,
    // "ran 5 kms" is distance, not the abbreviation. Fitness talk is common here.
    /\b\d+\s*kms?\b/g,
];

/**
 * Ways people phrase intent. "to" is optional because both "want to die" and
 * "wanna die" / "thinking about hurting myself" are common.
 */
const INTENT = String.raw`(?:want|wanna|going|gonna|need|ready|plan|planning|thinking about)\s+(?:to\s+)?`;

/** Self-directed harm verbs, including their -ing forms. */
const HARM_VERB = String.raw`(?:hurt(?:ing)?|harm(?:ing)?|cut(?:ting)?)`;

/**
 * Explicit intent or ideation. Highest confidence.
 */
const ACTIVE_PATTERNS: RegExp[] = [
    /\bkill(?:ing)? (?:myself|my ?self)\b/,
    /\bkms\b/,
    /\b(?:end|ending|ended) (?:my|this) life\b/,
    /\btak(?:e|ing) my own life\b/,
    new RegExp(String.raw`\b${INTENT}die\b`),
    /\bi (?:want|wish) (?:to be|i was|i were) dead\b/,
    /\bbetter off dead\b/,
    /\bsuicidal\b/,
    /\bcommit suicide\b/,
    /\bthink(?:ing)? about suicide\b/,
    new RegExp(String.raw`\b${INTENT}${HARM_VERB}\s+(?:myself|my ?self)\b`),
    new RegExp(String.raw`\b${INTENT}(?:overdos|od)`),
    /\bno (?:reason|point) (?:to|in) liv/,
    /\bnothing (?:left )?to live for\b/,
    /\bdon'?t (?:want|wanna) to? ?wake up\b/,
];

/**
 * Passive ideation and hopelessness. Lower confidence, still worth surfacing.
 */
const PASSIVE_PATTERNS: RegExp[] = [
    /\bbetter off without me\b/,
    /\bhappier without me\b/,
    /\bdon'?t (?:want|wanna) to? ?be here (?:anymore|any longer|no more)\b/,
    /\bdone with (?:life|living)\b/,
    /\btired of (?:living|being alive)\b/,
    /\bgive up on life\b/,
    /\bcan'?t (?:go on|keep going) (?:anymore|any longer)\b/,
    /\bwish i (?:was|were) never born\b/,
    /\bno one would (?:notice|care) if i\b/,
];

/**
 * Lowercase, strip diacritics and most punctuation, collapse whitespace.
 * Keeps apostrophes so contractions still match, and normalizes the curly variant.
 */
function normalize(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[‘’]/g, "'")
        .replace(/[^a-z0-9'\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Scan a single piece of user-authored text for crisis language.
 * Returns null when nothing matches. Never throws.
 */
export function detectCrisisSignal(text: string): CrisisSignal | null {
    if (!text || typeof text !== 'string') return null;

    let scannable = normalize(text);
    if (!scannable) return null;

    // Strip everyday idioms before matching so they cannot trip a pattern.
    for (const idiom of IDIOMS) {
        scannable = scannable.replace(idiom, ' ');
    }
    scannable = scannable.replace(/\s+/g, ' ').trim();
    if (!scannable) return null;

    for (const pattern of ACTIVE_PATTERNS) {
        const hit = scannable.match(pattern);
        if (hit) return { severity: 'active', matched: hit[0] };
    }

    for (const pattern of PASSIVE_PATTERNS) {
        const hit = scannable.match(pattern);
        if (hit) return { severity: 'passive', matched: hit[0] };
    }

    return null;
}
