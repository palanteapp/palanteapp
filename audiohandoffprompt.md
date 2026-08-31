Palante (Capacitor 7 + React + TS, iOS). Soundscapes have a recurring ~1 second
audio dropout on a real device. SIX fix attempts have now failed. I ship October
1 and I am close to pulling the Soundscapes feature entirely, which I do not
want to do. Read this whole prompt before touching anything.

## DO NOT WRITE CODE UNTIL YOU HAVE MEASURED

Every previous attempt failed because someone reasoned from my verbal
description of a sound and then rewrote a layer. Ear-timed reports cannot
localize a fault in this pipeline. There is already tooling to measure it; your
first job is to use it, not to add a seventh theory.

## What has been RULED OUT, with evidence. Do not re-investigate these.

1. NOT the loop seam or the loop engine. Buffer-path sounds wrap on the Web
   Audio rendering thread via AudioBufferSourceNode.loop with zero JavaScript
   per cycle. The dropout hits cat-purring (10.9s loop) and box-fan (53.9s loop)
   at the same felt rhythm; nothing synchronised to a seam can do that.
2. NOT the audio files. `node scripts/verify-seams.mjs` measures the SHIPPED
   .m4a files after the AAC round trip: 37 PASS / 0 FAIL across the whole
   library, on step, click, level, spectral and digital-silence axes.
3. NOT the runtime slicing. Every track slices to its full length (6.5s to
   105s). Verified by running the real planLoopBuffer() against real decoded
   audio. Nothing produces a short buffer.
4. NOT memory pressure any more. Whole-library decoded footprint went 2672MB ->
   485MB, largest single sound 413.6MB -> 40.4MB, audio on disk 134MB -> 27MB.
5. NOT the streaming path. It was deleted; every file now fits in memory and
   takes one path. A test asserts every shipped file stays under the in-memory
   gate.
6. NOT the audio-capture rig. It only starts on an explicit button press.

## What was FOUND and fixed (real bugs, but they did not fix the dropout)

- Nothing observed AVAudioSession.interruptionNotification anywhere in the app.
  Now handled in ios/App/App/PalanteAudioBridge.swift, with route-change and
  mediaServicesWereReset handling and a delayed retry on reactivation.
- setPlaying() reconfigured a LIVE audio session on every change of the active
  sound count, and playBell() did the same on every interval bell. Both rebuild
  the audio unit WKWebView renders into. Now no-ops unless state actually
  changed.
- KoiPond crossfaded at element.duration (which includes AAC encoder padding),
  used an equal-power curve on correlated tail-vs-head content (summing to about
  +3dB), and bypassed the master limiter entirely. It now routes through
  startLoop() and getMasterLimiter().

## A regression I caused and reverted, so you do not repeat it

I added src/utils/audioWatchdog.ts, which inferred "silence" from an
AnalyserNode and REBUILT every voice on a 5s cooldown. That analyser tap reads
correctly in Chromium and was never validated in WKWebView. On device it
reported silence while audio played fine and restarted the entire library every
few seconds. The watchdog is now observation-only and must stay that way unless
a device capture proves its `sawSignal` flag turns true in WKWebView.

Lesson: a diagnostic must not be an actor.

## The key remaining fact, and the most likely direction

The koi pond plays flowing-river through a SINGLE AudioBufferSourceNode with
loop=true into gain -> DynamicsCompressor -> destination. That is the simplest
possible Web Audio graph and it still drops out. A single looping buffer node
physically cannot gap on the render thread.

So the fault is almost certainly one of:
  (a) the AudioContext being suspended or interrupted periodically on device
      (WebKit on iOS has a non-standard state 'interrupted'), or
  (b) the audio render thread underrunning from CPU starvation, or
  (c) something outside the app taking the audio session.

The highest-value first measurement is therefore: does AudioContext.state
change, and does ctx.currentTime stop advancing against wall clock, at the
moments audio drops? Nothing about that measurement needs the AnalyserNode.

## Tools that already exist. Use them.

- `scripts/README-ears.md` is the end-to-end capture procedure.
- On device: open Soundscapes, start a sound, LONG-PRESS the word "Soundscapes"
  in the header for 1.5s to open the capture panel. Prefer the lossless PCM
  backend. Stop, then share the audio file and its .json sidecar to the Mac.
  Also driveable from Safari Web Inspector via
  `window.__palanteEars.start({backend:'pcm'})` / `.stop()`, which is the only
  way to drive it while testing a backgrounded app.
- Then: `node scripts/analyze-capture.mjs <recording> <sidecar.json>`
  It reports every dropout with start, duration in ms and depth in dBFS, the
  mean interval between them, and whether that interval matches any loopSeconds
  in the manifest. That single line settles "is this the loop or not".
- The sidecar carries a passive 100ms trace of ctx.state, ctx.currentTime vs
  wall clock, and document.hidden. That trace is where the answer most likely
  is. A gap in the trace ITSELF means the main thread was blocked.
- `window.__palanteAudioLog()` in Web Inspector dumps the watchdog ring buffer.
- `node scripts/verify-seams.mjs [id]` re-checks any shipped asset.

If the capture cannot be produced on device for some reason, the next best move
is reproducing in the iOS Simulator (there is a simulator control tool), driving
the UI, triggering capture, then reading the file out of the simulator's app
container on disk and analysing it. Do not skip to code.

## Ground rules

- Measure, then diagnose, then propose. Tell me the root cause and your
  evidence BEFORE you write a fix.
- Do not rewrite the loop engine. It is 333 lines with one path and it is not
  the problem.
- Do not add anything that can restart, stop or rebuild audio based on inference.
- `npm run build && npm run sync:ios && npx cap open ios`. Never bare
  `npx cap sync ios` - it strips the app-local Swift bridges, including
  PalanteAudioBridgePlugin, and HealthKit, audio and the widget then fail
  silently at runtime.
- Typecheck with `npx tsc --noEmit -p tsconfig.app.json`. A bare `tsc --noEmit`
  no-ops in this repo.
- `npx vitest run` - 442 tests currently pass. Keep them passing.

## Where things stand

Branch `fix/audio-interruptions-memory-and-loop-collapse`, four commits, nothing
pushed. Everything above is committed and building. Seam verification 37/37, all
442 tests green.

Start by telling me exactly what measurement you want and how to get it to you.
