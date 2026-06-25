// Safety net: remove the seamless-loop QA harness before any build.
// public/_loopqa/ is gitignored, but Vite copies all of public/ into the
// bundle, so without this the ~150MB of A/B audition audio would ship.
// No-op when the directory doesn't exist.
import { rmSync } from 'node:fs';

rmSync(new URL('../public/_loopqa', import.meta.url), { recursive: true, force: true });
