import { useCallback, useEffect, useState } from 'react';
import { haptics } from '../utils/haptics';
import { checkDeclaredAgeRange, isConfirmedUnder13 } from '../utils/ageRangeGate';

interface UseAgeRangeGateOptions {
    /**
     * Whether the initial OS check should be in flight right now. Pass `true` from
     * mount to fire immediately (e.g. AgeVerificationModal's `isOpen`), or a derived
     * condition that flips false -> true once a specific onboarding step is reached
     * (e.g. CinematicIntro's `step >= 1`) so Apple's consent sheet can't appear before
     * the user has any onboarding context. Flipping back to `false` and later `true`
     * again (e.g. modal closes/reopens) re-runs the check.
     */
    active: boolean;
}

interface UseAgeRangeGateResult {
    /** True once an OS read (initial or recheck) has confirmed the account as under 13. */
    osConfirmedUnder13: boolean;
    /**
     * True while the initial OS check is in flight. Callers MUST treat this the same
     * as `osConfirmedUnder13` for gating purposes: a submit handler that only checks
     * `osConfirmedUnder13` can race a self-reported birth year past a still-pending OS
     * signal that resolves under-13 moments later. Disable/guard submission while this
     * is true, not just while `osConfirmedUnder13` is true.
     */
    isChecking: boolean;
    /** True while a user-initiated recheck (the "Check Again" button) is in flight. */
    isRechecking: boolean;
    /**
     * Re-queries the OS signal on demand (e.g. "Check Again" on the blocked screen,
     * after a parent updates Family Sharing / declared age range). Never lets a
     * self-reported birth year override the OS signal — it only clears the block when
     * the OS itself no longer reports under-13, and gives haptic feedback when a
     * recheck confirms the block still stands.
     */
    recheck: () => Promise<void>;
}

/**
 * Shared OS-verified age-signal gate (Apple's Declared Age Range API, iOS 26+) used by
 * both AgeVerificationModal (legacy fallback path) and CinematicIntro (primary onboarding
 * path). This signal is authoritative and can only ever make the birth-year self-report
 * gate MORE strict: a confirmed-under-13 signal blocks hard regardless of what birth year
 * someone types, but any other outcome (13+, declined, or unavailable on older iOS /
 * Simulator / Android / web) leaves the self-report flow untouched.
 */
export function useAgeRangeGate({ active }: UseAgeRangeGateOptions): UseAgeRangeGateResult {
    const [osConfirmedUnder13, setOsConfirmedUnder13] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [isRechecking, setIsRechecking] = useState(false);

    useEffect(() => {
        if (!active) return;
        let cancelled = false;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time OS age-signal check when the gate becomes active, can't be known during render
        setIsChecking(true);
        checkDeclaredAgeRange().then(result => {
            if (cancelled) return;
            if (isConfirmedUnder13(result)) setOsConfirmedUnder13(true);
            setIsChecking(false);
        });
        return () => { cancelled = true; };
    }, [active]);

    const recheck = useCallback(async () => {
        setIsRechecking(true);
        try {
            const result = await checkDeclaredAgeRange();
            if (isConfirmedUnder13(result)) {
                haptics.error();
                setOsConfirmedUnder13(true);
            } else {
                setOsConfirmedUnder13(false);
            }
        } finally {
            setIsRechecking(false);
        }
    }, []);

    return { osConfirmedUnder13, isChecking, isRechecking, recheck };
}
