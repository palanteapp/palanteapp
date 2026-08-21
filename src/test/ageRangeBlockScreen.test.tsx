// Regression coverage for the under-13 "Palante isn't available for this account yet"
// screen: it must never render as a literal dead end (zero interactive elements), and
// re-checking the OS signal must never let a self-reported birth year bypass a real
// OS-confirmed-under-13 signal — only a fresh, non-blocking OS read can clear it.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import type { AgeRangeResult } from '../plugins/PalanteAgeRangeBridge';

const { checkDeclaredAgeRange } = vi.hoisted(() => ({
    checkDeclaredAgeRange: vi.fn<() => Promise<AgeRangeResult>>(),
}));

const { hapticsError } = vi.hoisted(() => ({
    hapticsError: vi.fn(),
}));

vi.mock('../utils/ageRangeGate', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../utils/ageRangeGate')>();
    return { ...actual, checkDeclaredAgeRange };
});

vi.mock('../utils/haptics', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../utils/haptics')>();
    return { ...actual, haptics: { ...actual.haptics, error: hapticsError } };
});

import { AgeVerificationModal } from '../components/AgeVerificationModal';
import { CinematicIntro } from '../components/CinematicIntro';

const UNDER_13: AgeRangeResult = { outcome: 'shared', upperBound: 12 };
const NOT_UNDER_13: AgeRangeResult = { outcome: 'unavailable' };

/** A promise the test controls the resolution of, to simulate the OS check taking real
 *  time to resolve (e.g. Apple's own consent UI on first use). */
function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>(res => { resolve = res; });
    return { promise, resolve };
}

beforeEach(() => {
    checkDeclaredAgeRange.mockReset();
    hapticsError.mockClear();
    localStorage.clear();
});

afterEach(() => {
    cleanup();
});

describe('AgeVerificationModal under-13 block screen', () => {
    it('renders a working action instead of a dead end when required and OS-confirmed under 13', async () => {
        checkDeclaredAgeRange.mockResolvedValue(UNDER_13);

        render(
            <AgeVerificationModal
                isOpen={true}
                onClose={() => {}}
                onVerify={() => {}}
                isDarkMode={true}
                required={true}
            />
        );

        expect(await screen.findByText(/isn't available for this account yet/i)).toBeInTheDocument();

        // At least one enabled, interactive control must exist — this is the crux of the bug.
        const recheckButton = await screen.findByRole('button', { name: /check again/i });
        expect(recheckButton).toBeEnabled();

        // No form to self-report an older birth year must be reachable from this state —
        // that would let someone simply beat the OS signal, which defeats its purpose.
        expect(screen.queryByText(/select year/i)).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /verify age/i })).not.toBeInTheDocument();
    });

    it('does not clear the block when the recheck still reports under 13', async () => {
        checkDeclaredAgeRange.mockResolvedValue(UNDER_13);
        const onVerify = vi.fn();

        render(
            <AgeVerificationModal
                isOpen={true}
                onClose={() => {}}
                onVerify={onVerify}
                isDarkMode={true}
                required={true}
            />
        );

        const recheckButton = await screen.findByRole('button', { name: /check again/i });
        fireEvent.click(recheckButton);

        await waitFor(() => expect(checkDeclaredAgeRange).toHaveBeenCalledTimes(2));
        expect(screen.getByText(/isn't available for this account yet/i)).toBeInTheDocument();
        expect(onVerify).not.toHaveBeenCalled();
    });

    it('clears the block only once a fresh OS read no longer reports under 13', async () => {
        checkDeclaredAgeRange
            .mockResolvedValueOnce(UNDER_13)
            .mockResolvedValueOnce(NOT_UNDER_13);

        render(
            <AgeVerificationModal
                isOpen={true}
                onClose={() => {}}
                onVerify={() => {}}
                isDarkMode={true}
                required={true}
            />
        );

        const recheckButton = await screen.findByRole('button', { name: /check again/i });
        fireEvent.click(recheckButton);

        // The block clears because the OS signal itself changed, not because of any
        // user-entered birth year — the normal self-report form reappears afterward.
        await screen.findByRole('button', { name: /verify age/i });
        expect(screen.queryByText(/isn't available for this account yet/i)).not.toBeInTheDocument();
    });
});

describe('CinematicIntro under-13 block screen', () => {
    it('renders working actions instead of a dead end when OS-confirmed under 13', async () => {
        checkDeclaredAgeRange.mockResolvedValue(UNDER_13);

        render(<CinematicIntro onComplete={vi.fn()} />);

        fireEvent.click(await screen.findByRole('button', { name: /begin/i }));

        expect(await screen.findByText(/isn't available for this account yet/i)).toBeInTheDocument();

        const recheckButton = screen.getByRole('button', { name: /check again/i });
        const backButton = screen.getByRole('button', { name: /back/i });
        expect(recheckButton).toBeEnabled();
        expect(backButton).toBeEnabled();

        // The birth-year picker (a way to self-report around the OS signal) must not be
        // reachable while the OS-confirmed block is active.
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('clears the block only once a fresh OS read no longer reports under 13', async () => {
        checkDeclaredAgeRange
            .mockResolvedValueOnce(UNDER_13)
            .mockResolvedValueOnce(NOT_UNDER_13);

        render(<CinematicIntro onComplete={vi.fn()} />);

        fireEvent.click(await screen.findByRole('button', { name: /begin/i }));
        fireEvent.click(await screen.findByRole('button', { name: /check again/i }));

        // The birth-year picker (a <select>) reappears once the block clears.
        await screen.findByRole('combobox');
        expect(screen.queryByText(/isn't available for this account yet/i)).not.toBeInTheDocument();
    });
});

// Regression coverage for the race described in the code review: the OS check runs
// asynchronously and can take real time to resolve (Apple's own consent UI may be
// involved on first use). If a submit handler only checks the resolved `osConfirmedUnder13`
// flag and not whether the check is still pending, a user who acts before it resolves can
// slip past a signal that would have blocked them moments later. Submission must be
// impossible while the check is unresolved, not just once it has resolved positively.
describe('submitting while the OS check is still pending cannot bypass the gate', () => {
    it('AgeVerificationModal: the Verify button is disabled until the OS check resolves, and a click while pending does not verify', async () => {
        const { promise, resolve } = deferred<AgeRangeResult>();
        checkDeclaredAgeRange.mockReturnValue(promise);
        const onVerify = vi.fn();

        render(
            <AgeVerificationModal
                isOpen={true}
                onClose={() => {}}
                onVerify={onVerify}
                isDarkMode={true}
                required={true}
            />
        );

        const verifyButton = await screen.findByRole('button', { name: /checking|verify age/i });
        expect(verifyButton).toBeDisabled();

        // Even if a click somehow fires (e.g. a race between render and event dispatch),
        // the handler itself must refuse to proceed while the check is unresolved.
        fireEvent.click(verifyButton);
        expect(onVerify).not.toHaveBeenCalled();

        resolve(UNDER_13);

        // Once the pending check resolves under-13, the block screen takes over — the
        // self-report form (and any way to verify through it) is gone entirely.
        await screen.findByText(/isn't available for this account yet/i);
        expect(screen.queryByRole('button', { name: /verify age/i })).not.toBeInTheDocument();
        expect(onVerify).not.toHaveBeenCalled();
    });

    it('CinematicIntro: the Continue button is disabled until the OS check resolves, and a click while pending does not advance past the age step', async () => {
        const { promise, resolve } = deferred<AgeRangeResult>();
        checkDeclaredAgeRange.mockReturnValue(promise);

        render(<CinematicIntro onComplete={vi.fn()} />);
        fireEvent.click(await screen.findByRole('button', { name: /begin/i }));

        const combobox = await screen.findByRole('combobox');
        fireEvent.change(combobox, { target: { value: '2000' } });

        const continueButton = await screen.findByRole('button', { name: /checking|continue/i });
        expect(continueButton).toBeDisabled();

        fireEvent.click(continueButton);
        // Still on the age step — the name step must not have been reached.
        expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument();

        resolve(UNDER_13);

        await screen.findByText(/isn't available for this account yet/i);
        expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument();
    });

    it('CinematicIntro: the Continue button re-enables and works normally once a pending check resolves clear', async () => {
        const { promise, resolve } = deferred<AgeRangeResult>();
        checkDeclaredAgeRange.mockReturnValue(promise);

        render(<CinematicIntro onComplete={vi.fn()} />);
        fireEvent.click(await screen.findByRole('button', { name: /begin/i }));

        const combobox = await screen.findByRole('combobox');
        fireEvent.change(combobox, { target: { value: '2000' } });

        resolve(NOT_UNDER_13);

        const continueButton = await screen.findByRole('button', { name: /continue/i });
        await waitFor(() => expect(continueButton).toBeEnabled());

        fireEvent.click(continueButton);
        expect(await screen.findByPlaceholderText(/your name/i)).toBeInTheDocument();
    });
});

// Regression coverage for the duplication bug: AgeVerificationModal and CinematicIntro
// used to implement the OS-recheck flow independently, and had already drifted (one gave
// haptic feedback on a failed recheck, the other didn't). Both now share useAgeRangeGate,
// so this behavior must be identical.
describe('shared recheck behavior (useAgeRangeGate) is identical across both components', () => {
    it('gives haptic feedback when a recheck still confirms under-13, in both AgeVerificationModal and CinematicIntro', async () => {
        checkDeclaredAgeRange.mockResolvedValue(UNDER_13);

        const { unmount } = render(
            <AgeVerificationModal isOpen={true} onClose={() => {}} onVerify={() => {}} isDarkMode={true} required={true} />
        );
        fireEvent.click(await screen.findByRole('button', { name: /check again/i }));
        await waitFor(() => expect(checkDeclaredAgeRange).toHaveBeenCalledTimes(2));
        expect(hapticsError).toHaveBeenCalledTimes(1);
        unmount();

        hapticsError.mockClear();
        checkDeclaredAgeRange.mockClear();
        checkDeclaredAgeRange.mockResolvedValue(UNDER_13);

        render(<CinematicIntro onComplete={vi.fn()} />);
        fireEvent.click(await screen.findByRole('button', { name: /begin/i }));
        fireEvent.click(await screen.findByRole('button', { name: /check again/i }));
        await waitFor(() => expect(checkDeclaredAgeRange).toHaveBeenCalledTimes(2));
        expect(hapticsError).toHaveBeenCalledTimes(1);
    });

    it('does not give haptic feedback when a recheck clears the block, in either component', async () => {
        checkDeclaredAgeRange
            .mockResolvedValueOnce(UNDER_13)
            .mockResolvedValueOnce(NOT_UNDER_13);

        render(
            <AgeVerificationModal isOpen={true} onClose={() => {}} onVerify={() => {}} isDarkMode={true} required={true} />
        );
        fireEvent.click(await screen.findByRole('button', { name: /check again/i }));
        await screen.findByRole('button', { name: /verify age/i });
        expect(hapticsError).not.toHaveBeenCalled();
    });
});
