#!/usr/bin/env node
// Onboard a brand-new soundscape master (e.g. a WAV pulled from Artlist) into
// the existing seamless-loop pipeline — see scripts/bake-loops.mjs for what
// actually finds the loop point (correlation search, not a hand-picked cut)
// and scripts/verify-seams.mjs for what proves it on the shipped file. This
// script exists only to remove the tedious, error-prone setup in front of
// those: seeding audio-raw/, writing a loopManifest.json job by hand, and
// remembering to run both scripts in order every time.
//
// What it does NOT do: pick a Lucide icon or a UI category, or edit
// SoundMixer.tsx / soundSources.ts. Those are a two-line, taste-based step
// (which icon reads as "storm"?) that isn't worth automating — the script
// prints the exact lines to paste once the audio itself passes verification.
//
// Usage:
//   node scripts/import-sound.mjs --id ocean-storm --file ~/Downloads/artlist-storm.wav \
//        --category Nature --label "Ocean Storm"
//
//   Optional:
//     --fade 2            crossfade width in seconds handed to the loop search (default 2)
//     --kind periodic     'texture' (default) or 'periodic' — periodic demands a
//                          tighter tail/head match, for material with an audible cycle
//                          (waves, a bell, anything non-stochastic)
//     --target-sec 30     cap the baked loop length; omitted defaults to 30s for any
//                          master over 45s (keeps it on the in-memory decode path — see
//                          the `targetLen` comment in bake-loops.mjs for why that matters)
//     --out sounds/x.m4a  shipped path under public/ (default sounds/<id>.m4a)
//     --longform          8-18 minute piece — goes in the `longform` manifest list and
//                          keeps streaming instead of decoding to memory
//     --rotate            opt a longform track into head-damage rotation (off by default
//                          for longform — see bake-loops.mjs, "Not applied to longform...")
//
// Re-running with a different --fade/--kind/--target-sec on the same --id: edit the
// job in loopManifest.json directly and re-run
//   node scripts/bake-loops.mjs --write --verify <id>
// This script refuses to touch an --id that's already in the manifest, so it can't
// silently overwrite tuning you already did.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RAW_DIR = path.join(ROOT, 'audio-raw');
const MANIFEST_PATH = path.join(ROOT, 'src/constants/loopManifest.json');

function arg(name, def) {
    const i = process.argv.indexOf(`--${name}`);
    return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
function flag(name) { return process.argv.includes(`--${name}`); }

const id = arg('id');
const file = arg('file');
if (!id || !file) {
    console.error('Usage: node scripts/import-sound.mjs --id <kebab-id> --file <path-to-wav> [--category Nature] [--label "Ocean Storm"] [--fade 2] [--kind texture|periodic] [--target-sec 30] [--out sounds/x.m4a] [--longform] [--rotate]');
    process.exit(1);
}
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
    console.error(`--id "${id}" should be kebab-case, e.g. ocean-storm`);
    process.exit(1);
}
const filePath = path.resolve(file);
if (!existsSync(filePath)) { console.error(`file not found: ${filePath}`); process.exit(1); }

const fade = parseFloat(arg('fade', '2'));
const kind = arg('kind', 'texture');
if (kind !== 'texture' && kind !== 'periodic') {
    console.warn(`--kind "${kind}" is neither "texture" nor "periodic" — bake-loops.mjs will treat it as texture.`);
}
const longform = flag('longform');
const category = arg('category', null);
const label = arg('label', null);

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
const list = longform ? manifest.longform : manifest.baked;
if ([...manifest.baked, ...manifest.longform].some(j => j.id === id)) {
    console.error(`"${id}" already exists in loopManifest.json — pick a new id, or edit that job directly and re-run bake-loops.mjs on it.`);
    process.exit(1);
}

// Seed the untouched master in audio-raw/ under the id. bake-loops.mjs snapshots
// a master here itself on first run for an EXISTING file (by copying out of
// public/), but a brand-new sound has no public/ file yet to copy from — so we
// seed it directly and bake-loops.mjs's own snapshot step is skipped because
// the path already exists.
const ext = path.extname(filePath) || '.wav';
if (ext.toLowerCase() !== '.wav') {
    console.warn(`warning: importing a ${ext} master, not .wav. If this file started life as a compressed preview (an MP3 export, say), re-download the WAV from Artlist instead — a lossy master can't be re-trimmed cleanly later, and there's no undo once it's the thing in audio-raw/.`);
}
mkdirSync(RAW_DIR, { recursive: true });
const rawPath = path.join(RAW_DIR, id + ext);
if (existsSync(rawPath)) { console.error(`audio-raw/${id}${ext} already exists — remove it first if you mean to replace it.`); process.exit(1); }
copyFileSync(filePath, rawPath);
console.log(`seeded audio-raw/${id}${ext}`);

// Probe the master's duration so a long file gets a sane targetSec by default —
// this mirrors the existing library: every texture bed sourced from a >45s
// master caps at 30s in loopManifest.json today.
const durSec = parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', rawPath]).toString().trim());
const explicitTargetSec = arg('target-sec', null);
const targetSec = explicitTargetSec ? parseFloat(explicitTargetSec) : (durSec > 45 ? 30 : undefined);

const out = arg('out', `sounds/${id}.m4a`);
const job = { id, src: `sounds/${id}${ext}`, out, fade, kind };
if (targetSec) job.targetSec = targetSec;
if (longform && flag('rotate')) job.rotate = true;
list.push(job);
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 4) + '\n');
console.log(`added "${id}" to loopManifest.json (${longform ? 'longform' : 'baked'}) — master ${durSec.toFixed(1)}s${targetSec ? `, capped to a ${targetSec}s loop` : ''}`);

// Bake: correlation-search the loop point, crossfade it, level loudness,
// encode AAC with head-damage rotation, and re-prove the seam on the decoded
// output — not the pre-encode PCM, which is always clean and would lie.
console.log('\nbaking...\n');
execFileSync('node', ['scripts/bake-loops.mjs', '--write', '--verify', id], { cwd: ROOT, stdio: 'inherit' });

console.log('\nverifying the shipped file...\n');
try {
    execFileSync('node', ['scripts/verify-seams.mjs', id], { cwd: ROOT, stdio: 'inherit' });
} catch {
    console.error(`\n"${id}" failed the seam gate — see the metrics above. The manifest job is already written, so you can retune it directly: try a different --fade, --kind periodic, or a tighter --target-sec, then re-run\n  node scripts/bake-loops.mjs --write --verify ${id}\nwithout going through this script again.`);
    process.exit(1);
}

const cat = category || '<Category>';
const lbl = label || id.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
console.log(`\n${id}: baked and verified. Wire it in:\n`);
console.log(`  src/constants/soundSources.ts:\n    ${id}: '/${out}',\n`);
console.log(`  src/components/SoundMixer.tsx SOUNDS array (under the // ${cat} block):\n    { id: '${id}', label: '${lbl}', category: '${cat}', src: '/${out}', icon: <pick a lucide-react icon> },\n`);
console.log(`Then: npm run build && npm run sync:ios to hear it on device.`);
