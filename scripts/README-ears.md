# The ears

A rig for finding out **when** a soundscape dropout happens, **how long** it lasts,
**how deep** it goes, and **whether it is periodic** — from a real recording made on a
real device, rather than from anyone's memory of what it sounded like.

Five previous fixes for the recurring ~1s dropout were aimed by ear and none landed.
This exists so the next one is aimed at a measurement.

## What it is made of

| Piece | Where | Does what |
| --- | --- | --- |
| Capture module | `src/utils/audioCapture.ts` | Taps the master limiter in parallel, records the live output, writes a JSON sidecar of everything the recording cannot show |
| PCM worklet | `public/audio/capture-processor.js` | Lossless sample tap on the audio thread, used when MediaRecorder is unusable or when you ask for it |
| Debug panel | `src/components/AudioCapturePanel.tsx` | The start/stop UI. Hidden behind a long-press |
| Analysis | `scripts/analyze-capture.mjs` | Decodes the recording, finds every dropout, reports the interval and a verdict |
| Shared DSP | `scripts/lib/audio-dsp.mjs` | Decode and statistics, shared with `scripts/verify-seams.mjs` |

The capture is a **parallel branch off the master limiter**. The limiter's existing edge
to `ctx.destination` is never touched, so recording cannot change what you hear. If it
could, it would be useless: an instrument that can cause the fault cannot measure it.

## Procedure

### 1. Get a build on the device

```bash
cd /Users/michaelvargas/Developer/Palante
npm run build && npm run sync:ios && npx cap open ios
```

Then run on a real iPhone. The simulator will not reproduce this: the fault involves the
real audio session, real backgrounding, and real thermal and memory pressure.

### 2. Start the sounds first, then the capture

Open **Soundscapes** and start the mix that reproduces the problem. Let it settle.

### 3. Open the hidden panel

**Press and hold the word "Soundscapes"** in the panel header for **1.5 seconds**. A
strong haptic fires and the capture panel slides up from the bottom. There is no other
way in and nothing on screen hints at it.

The panel has one toggle:

- **Auto backend, 15 min cap** (default). Uses `MediaRecorder`, which encodes off the
  main thread. Cheap, long captures, lossy AAC.
- **Lossless PCM, 5 min cap**. Records raw samples through an AudioWorklet and writes a
  WAV. Use this when the exact **length in samples** of a gap matters, since 1024 samples
  is an AAC frame, 128 is a render quantum and 4096 is a ScriptProcessor block, and only
  the lossless path can tell those apart.

Tap **Start capture**. The panel shows the backend and a running clock. You can leave it
open or close it with the X: the capture keeps running either way, and reopening it with
the same long-press shows the clock still counting.

### 4. Reproduce

Use the app normally for **at least 5 minutes**, and longer if the dropout is rare. The
analysis needs **four or more dropouts** before it can call an interval periodic, so if
you expect a gap every ~45s, give it six or seven minutes.

Do whatever it takes to provoke it: lock the screen, take a call, switch apps, let the
phone get warm. The sidecar records backgrounding and context suspensions, so anything
you do is part of the evidence rather than a contaminant.

### 5. Stop and send

Long-press the title again if you closed the panel, then tap **Stop and share**. The iOS
share sheet opens with **two files**:

```
palante-ears-2026-08-28T14-31-07.m4a    (or .wav on the lossless backend)
palante-ears-2026-08-28T14-31-07.json
```

**Send both.** AirDrop to the Mac is easiest. The JSON is the half that turns "there is a
gap here" into "there is a gap here *because*", and without it every dropout comes back
labelled `no-sidecar`.

If the share sheet is dismissed by accident, the files are still written to the app's
Cache directory and can be pulled with Xcode's Devices and Simulators window
(Window > Devices and Simulators > select the device > Palante > Download Container).

### 6. Analyse on the Mac

```bash
cd /Users/michaelvargas/Developer/Palante
node scripts/analyze-capture.mjs ~/Downloads/palante-ears-2026-08-28T14-31-07.m4a \
                                 ~/Downloads/palante-ears-2026-08-28T14-31-07.json
```

Requires `ffmpeg` and `ffprobe` on the PATH (both are at `/opt/homebrew/bin`).

Machine-readable instead:

```bash
node scripts/analyze-capture.mjs recording.m4a sidecar.json --json          # to stdout
node scripts/analyze-capture.mjs recording.m4a sidecar.json --json out.json # to a file
```

## Reading the output

```
#      start s   dur ms  samples  depth dB  rel dB  type    cause                       detail
1       20.000     1020    48960    -240.0  -228.5  silence ctx-suspended               watchdog: ctx-suspended
2       67.000     1020    48960    -240.0  -228.5  silence silence-with-healthy-graph
```

- **type** `silence` means the samples were actually zero, so the graph stopped
  producing. `duck` means something applied gain: the graph kept running and turned the
  level down. These have different causes and the fix for one is never the fix for the
  other.
- **depth dB** is the quietest level reached. `-240.0` is exact digital zero.
- **rel dB** is how far below the surrounding programme level it went.
- **samples** is the gap length in samples, refined to sample resolution for `silence`
  dropouts. Look for 128, 1024, 4096, or a suspiciously round number of milliseconds.
- **cause** is one of `ctx-suspended`, `ctx-stalled`, `silence-with-healthy-graph`, or
  `unexplained`, correlated against the sidecar. `unexplained` usually means the trace
  itself went missing, which means the main thread was blocked, which is itself a
  candidate cause and is printed in **detail**.

Then the part that actually decides the argument:

```
intervals between dropouts
  all dropouts                 n= 5  mean    37.600s  stddev   14.686s  cv 0.391  not periodic
> full digital silence only    n= 4  mean    47.000s  stddev    0.000s  cv 0.000  PERIODIC
```

Intervals are computed per dropout **type** as well as over everything, because two
faults can be present at once and interleaving them destroys both periods. The `>` marks
the series the verdict speaks about.

```
loopSeconds correlation
  NO MATCH: no loopSeconds in the manifest lands within tolerance at any multiple 1..4.
```

A loop seam produces a gap once per wrap and no more often. If the observed period is not
a whole-number multiple of some `loopSeconds` in `src/constants/loopManifest.json`, the
seam is not the cause, however much it sounds like one. Sounds that were not playing
during the capture are labelled as such, so a numerical coincidence with a file that was
never on can be dismissed on sight.

## Thresholds, when the defaults are wrong

```bash
# a shallower or shorter dropout than the defaults catch
node scripts/analyze-capture.mjs rec.m4a side.json --min-ms 40 --duck-db 10

# a noisy result: tighten the duck trigger
node scripts/analyze-capture.mjs rec.m4a side.json --duck-db 24
```

| Flag | Default | Meaning |
| --- | --- | --- |
| `--silence-db` | `-60` | Absolute level at or below which a frame counts as silent |
| `--duck-db` | `18` | dB below the local programme reference that counts as a duck |
| `--min-ms` | `150` | Shortest run reported as a dropout |
| `--window-ms` | `10` | Envelope window |
| `--hop-ms` | `2` | Envelope hop |
| `--merge-ms` | `40` | Gaps closer together than this are one dropout |
| `--context-sec` | `8` | Half-width of the local reference median |
| `--periodic-cv` | `0.10` | stddev/mean at or below this reads as periodic |
| `--manifest` | `src/constants/loopManifest.json` | Alternate manifest |

Put flags **after** the two filenames.

## Driving it from Safari Web Inspector

Attach Web Inspector to the device build and the same capture is reachable without the
UI, which matters when the reproduction involves backgrounding the app:

```js
await window.__palanteEars.start({ backend: 'pcm', maxSeconds: 600 });
window.__palanteEars.state();
await window.__palanteEars.stop();   // still opens the share sheet
window.__palanteAudioLog();          // the watchdog's own ring buffer
```

## Things that will bite you

- **`window.__palanteAudioLog()` can be empty for two completely different reasons.**
  Either the graph stayed healthy, or `startAudioWatchdog()` was never called. The
  sidecar records `watchdog.running` to tell those apart, and the analysis prints a
  warning when the watchdog was idle. Do not read an empty log as a clean bill of health.
- **The MediaRecorder backend cannot show true digital zero** and blurs an edge by up to
  one codec frame (~21ms at 48kHz). Fine for "is there a hole every 47 seconds", useless
  for "is this hole exactly 1024 samples". Switch to lossless PCM for the second question.
- **The PCM backend preallocates its buffer**: about 11.5MB per minute of capture. The
  5 minute cap is not arbitrary. Longer runs belong on the MediaRecorder backend.
- **If the analysis reports `pcm-scriptprocessor` as the backend**, treat the result with
  suspicion. That path runs the tap on the main thread and can produce dropouts of its
  own. It is a last resort for a WebView with neither MediaRecorder nor AudioWorklet, and
  the sidecar says so in `backendCaveat`.
- **`src/constants/loopManifest.json` currently disagrees with the shipped assets** for a
  number of entries (`npm test` fails on `loopManifest.test.ts` and `loopSeam.test.ts` for
  this reason, independently of this rig). Until that is reconciled, treat a loopSeconds
  match or non-match as a strong hint rather than proof, and check the entry against the
  file with `node scripts/verify-seams.mjs <id>`.
