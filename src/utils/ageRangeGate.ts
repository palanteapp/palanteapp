// Apple's Declared Age Range API (iOS 26+, see PalanteAgeRangeBridge). This is an
// additional, OS-verified/guardian-declared signal layered on top of the existing
// self-reported birth-year gate (AgeVerificationModal, CinematicIntro step 1) — it
// never replaces it. It can only make the gate MORE strict: a confirmed-under-13
// signal blocks hard, but any other outcome (13+, declined, or unavailable on
// older iOS/Simulator/Android/web) leaves today's self-report flow untouched.
import { Capacitor } from '@capacitor/core';
import { PalanteAgeRangeBridge, type AgeRangeResult } from '../plugins/PalanteAgeRangeBridge';

export function isConfirmedUnder13(result: AgeRangeResult): boolean {
    // Deliberately conservative: `upperBound <= 13` (not `< 13`). This is the single
    // point of failure for the entire hard COPPA block, and Apple's DeclaredAgeRange
    // framework docs did not confirm (as of writing, pages not fully crawlable) whether
    // the "younger than 13" bucket reports its upperBound as 12 or 13. Treating an
    // ambiguous boundary value of exactly 13 as blocking is the fail-safe direction —
    // getting this wrong permissively would let real under-13 users through.
    // TODO(compliance): verify against a real device/TestFlight build. If Apple's real
    // semantics turn out to mean upperBound=13 represents "13 and under 14" (i.e. an
    // actual 13-year-old, who should NOT be blocked), tighten this back to `< 13` —
    // flagging here so a human reviewer makes that call with real device testing.
    return result.outcome === 'shared' && result.upperBound !== undefined && result.upperBound <= 13;
}

export async function checkDeclaredAgeRange(): Promise<AgeRangeResult> {
    if (!Capacitor.isNativePlatform()) return { outcome: 'unavailable' };
    try {
        return await PalanteAgeRangeBridge.requestAgeRange();
    } catch {
        return { outcome: 'unavailable' };
    }
}
