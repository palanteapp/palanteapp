import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { haptics } from '../utils/haptics';
import {
    startCapture,
    stopCapture,
    getCaptureState,
    type CaptureResult,
    type StartCaptureOptions,
    type CaptureState,
    type ActiveSound,
} from '../utils/audioCapture';

/**
 * The developer-facing half of "the ears" (src/utils/audioCapture.ts).
 *
 * Deliberately not discoverable: it is mounted only by SoundMixer and only
 * shown after a deliberate long-press on the Soundscapes title, because the
 * files it produces are tens of megabytes and mean nothing to anyone who is not
 * about to run scripts/analyze-capture.mjs on them. There is no entry in
 * Settings, no gesture hint, and nothing on screen until it is opened.
 *
 * It has to survive a production TestFlight build rather than being gated to
 * DEV, since the dropout it exists to measure only reproduces on a real device
 * over real minutes — which is precisely why the gesture, not a build flag, is
 * what keeps it out of a normal user's way.
 */

interface AudioCapturePanelProps {
    open: boolean;
    onClose: () => void;
    /** The sounds currently supposed to be audible, id plus asset path. */
    describeActive: () => ActiveSound[];
}

const fmtElapsed = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

export const AudioCapturePanel: React.FC<AudioCapturePanelProps> = ({ open, onClose, describeActive }) => {
    const [busy, setBusy] = useState(false);
    const [note, setNote] = useState<string>('');
    const [result, setResult] = useState<CaptureResult | null>(null);
    const [lossless, setLossless] = useState(false);
    const [state, setState] = useState<CaptureState>(() => getCaptureState());
    const [elapsedMs, setElapsedMs] = useState(0);
    const describeRef = useRef(describeActive);
    useEffect(() => { describeRef.current = describeActive; }, [describeActive]);

    // The capture owns its own state (it can auto-stop on the duration cap
    // without the panel being involved), so the panel polls rather than trying
    // to mirror it. 500ms is enough for a seconds counter and costs nothing.
    // The elapsed clock is read here rather than during render because
    // performance.now() in a render body is not idempotent.
    useEffect(() => {
        if (!open) return;
        const read = () => {
            const s = getCaptureState();
            setState(s);
            setElapsedMs(s.phase === 'recording' ? performance.now() - s.startedAt : 0);
        };
        read();
        const t = setInterval(read, 500);
        return () => clearInterval(t);
    }, [open]);

    const recording = state.phase === 'recording';

    const onStart = useCallback(async () => {
        setBusy(true);
        setResult(null);
        haptics.medium();
        const opts: StartCaptureOptions = {
            describeActive: () => describeRef.current(),
            backend: lossless ? 'pcm' : 'auto',
        };
        const outcome = await startCapture(opts);
        setNote(outcome.note);
        if (!outcome.ok) haptics.error();
        setState(getCaptureState());
        setBusy(false);
    }, [lossless]);

    const onStop = useCallback(async () => {
        setBusy(true);
        haptics.medium();
        try {
            const r = await stopCapture();
            setResult(r);
            setNote(r ? `${r.bytes.toLocaleString()} bytes written` : 'nothing was recording');
        } catch (e) {
            setNote(`stop failed: ${e}`);
            haptics.error();
        }
        setState(getCaptureState());
        setBusy(false);
    }, []);

    if (!open) return null;

    return (
        <div
            className="fixed inset-x-0 bottom-0 z-[70] px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-3 pointer-events-none"
            role="dialog"
            aria-label="Audio capture"
        >
            <div className="pointer-events-auto max-w-md mx-auto rounded-3xl bg-sage-mid border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl p-5 text-white">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                        <h3 className="font-display font-medium text-[17px] leading-tight">Audio capture</h3>
                        <p className="font-body text-[12px] text-white/60 leading-snug mt-0.5">
                            Records the master bus and a sidecar of context state, then shares both.
                        </p>
                    </div>
                    <button
                        onClick={() => { onClose(); }}
                        aria-label="Close audio capture"
                        className="flex-shrink-0 p-2 rounded-xl bg-white/5 text-white/70 active:scale-[0.97] transition-transform"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="rounded-2xl bg-black/20 border border-white/5 px-4 py-3 mb-4">
                    <div className="flex items-baseline justify-between gap-3">
                        <span className="font-body text-[11px] uppercase tracking-[0.2em] font-bold text-white/50">
                            {recording ? 'Recording' : result ? 'Saved' : 'Idle'}
                        </span>
                        <span className="font-mono tabular-nums text-[18px] text-pale-gold">
                            {recording ? fmtElapsed(elapsedMs) : result ? `${result.durationSec.toFixed(1)}s` : '00:00'}
                        </span>
                    </div>
                    {recording && (
                        <p className="font-body text-[11px] text-white/50 mt-1.5 leading-snug">
                            {state.backend} · auto-stops at {Math.round(state.maxSeconds / 60)} min
                        </p>
                    )}
                    {!!note && (
                        <p className="font-body text-[11px] text-white/60 mt-1.5 leading-snug break-words">{note}</p>
                    )}
                    {result && (
                        <p className="font-mono text-[10px] text-white/40 mt-1.5 leading-snug break-all">
                            {result.audioFile} + {result.sidecarFile}
                        </p>
                    )}
                </div>

                {!recording && (
                    <button
                        onClick={() => setLossless(v => !v)}
                        className={`w-full mb-3 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-[0.15em] border transition-colors ${lossless
                            ? 'bg-white/10 text-white border-white/20'
                            : 'bg-transparent text-white/50 border-white/10'
                            }`}
                    >
                        {lossless ? 'Lossless PCM, 5 min cap' : 'Auto backend, 15 min cap'}
                    </button>
                )}

                <button
                    onClick={recording ? onStop : onStart}
                    disabled={busy}
                    className="w-full px-6 py-3.5 rounded-2xl bg-pale-gold text-sage-dark font-body font-bold text-[13px] uppercase tracking-[0.15em] active:scale-[0.98] transition-transform disabled:opacity-50"
                >
                    {busy ? 'Working' : recording ? 'Stop and share' : 'Start capture'}
                </button>
            </div>
        </div>
    );
};
