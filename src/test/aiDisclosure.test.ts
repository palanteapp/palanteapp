/**
 * The disclosure is a compliance surface, so these tests cover the two ways it can
 * quietly stop working: the consent record failing to re-prompt after a material
 * change, and the copy drifting out of sync with what the app actually does.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    AI_DISCLOSURE,
    AI_DISCLOSURE_VERSION,
    hasAcknowledgedAIDisclosure,
    recordAIDisclosureAcknowledgment,
} from '../data/aiDisclosure';
import { LEGAL_DISCLAIMER } from '../data/legalDisclaimer';
import { STORAGE_KEYS } from '../constants/storageKeys';

describe('AI disclosure consent record', () => {
    beforeEach(() => localStorage.clear());

    it('is unacknowledged on a fresh install', () => {
        expect(hasAcknowledgedAIDisclosure()).toBe(false);
    });

    it('is acknowledged after recording', () => {
        recordAIDisclosureAcknowledgment();
        expect(hasAcknowledgedAIDisclosure()).toBe(true);
    });

    it('stores the version and a timestamp', () => {
        recordAIDisclosureAcknowledgment();
        const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_DISCLOSURE_ACKNOWLEDGED)!);
        expect(parsed.acknowledged).toBe(true);
        expect(parsed.version).toBe(AI_DISCLOSURE_VERSION);
        expect(Number.isNaN(Date.parse(parsed.timestamp))).toBe(false);
    });

    it('re-prompts when the disclosure version has moved on', () => {
        localStorage.setItem(
            STORAGE_KEYS.AI_DISCLOSURE_ACKNOWLEDGED,
            JSON.stringify({ acknowledged: true, timestamp: new Date().toISOString(), version: '2020-01-01' }),
        );
        expect(hasAcknowledgedAIDisclosure()).toBe(false);
    });

    it('re-prompts rather than assuming consent when the record is corrupt', () => {
        localStorage.setItem(STORAGE_KEYS.AI_DISCLOSURE_ACKNOWLEDGED, 'not json');
        expect(hasAcknowledgedAIDisclosure()).toBe(false);
    });

    it('re-prompts when a record exists but was never actually acknowledged', () => {
        localStorage.setItem(
            STORAGE_KEYS.AI_DISCLOSURE_ACKNOWLEDGED,
            JSON.stringify({ acknowledged: false, timestamp: new Date().toISOString(), version: AI_DISCLOSURE_VERSION }),
        );
        expect(hasAcknowledgedAIDisclosure()).toBe(false);
    });
});

describe('AI disclosure copy', () => {
    const allText = [
        AI_DISCLOSURE.intro,
        ...AI_DISCLOSURE.sections.flatMap(s => [s.heading, s.body]),
    ].join(' ');

    it('names every provider that receives user text', () => {
        expect(allText).toContain('Anthropic');
        expect(allText).toContain('OpenAI');
    });

    it('states the three commitments that make the disclosure meaningful', () => {
        expect(allText).toMatch(/not used to train/i);
        expect(allText).toMatch(/not sold/i);
        expect(allText).toMatch(/advertising/i);
    });

    it('tells the user AI can be wrong and is not professional advice', () => {
        expect(allText).toMatch(/not true|can be wrong/i);
        expect(allText).toMatch(/not a therapist/i);
    });

    it('tells the user how to opt out', () => {
        expect(allText).toMatch(/turn it off|turn off/i);
        expect(allText).toContain('Settings');
    });

    it('carries no emojis, per the design system', () => {
        expect(allText).not.toMatch(/\p{Extended_Pictographic}/u);
    });

    // The popup is the readable summary; the legal document is the binding text. If one
    // names a provider the other doesn't, a user reading either one is misinformed.
    it('agrees with the legal document on who receives data', () => {
        const privacy = LEGAL_DISCLAIMER.sections.find(s => s.heading.includes('PRIVACY POLICY'))!;
        expect(privacy.content).toContain('Anthropic');
        expect(privacy.content).toContain('OpenAI');
    });

    it('is backed by a legal document that documents the opt-out', () => {
        const aiSection = LEGAL_DISCLAIMER.sections.find(s => s.heading.includes('AI-GENERATED'))!;
        expect(aiSection.content).toMatch(/disable all AI features/i);
    });
});
