// Generates the jittered teardrop marking paths used by the 'grad' pattern in
// KoiFishSVG (src/components/KoiPond.tsx). A clean teardrop outline (circle +
// tangent lines to an apex) is sampled into points, each point is nudged along
// its radial direction by a seeded random amount, then a Catmull-Rom spline is
// fit through the result — that noise is what makes the edge read as an
// organic hand-drawn shape instead of a repeatable geometric curve. Run with
// `node scripts/koi-blob-gen.js`, tune the seed/amount per patch, and paste
// the printed `d` values into the component.

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Sample points around a teardrop outline: circle radius r at origin, apex at (0, L).
function teardropOutline(r, L, nArc, nTail) {
  const phi = Math.acos(r / L);
  const points = [];
  // Arc from tangent point on the right (a=phi), the long way round through the
  // back of the circle (a=pi, i.e. the rounded top, away from the apex), to the
  // tangent point on the left (a=2pi-phi).
  for (let i = 0; i <= nArc; i++) {
    const a = phi + (2 * Math.PI - 2 * phi) * (i / nArc);
    points.push([r * Math.sin(a), r * Math.cos(a)]);
  }
  // Tangent line from the left tangent point to the apex (excluding the shared endpoint)
  const TL = points[points.length - 1];
  for (let i = 1; i < nTail; i++) {
    const t = i / nTail;
    points.push([TL[0] + (0 - TL[0]) * t, TL[1] + (L - TL[1]) * t]);
  }
  points.push([0, L]); // apex
  // Tangent line from apex back to the right tangent point (excluding both endpoints,
  // since T_right is points[0] and will close the loop)
  const TR = points[0];
  for (let i = 1; i < nTail; i++) {
    const t = i / nTail;
    points.push([0 + (TR[0] - 0) * t, L + (TR[1] - L) * t]);
  }
  return points;
}

// Jitter each point along its own radial direction from the shape's rough center,
// using a seeded RNG so results are deterministic and reproducible.
function jitter(points, amount, seed, centerY) {
  const rng = mulberry32(seed);
  return points.map(([x, y]) => {
    const dx = x - 0, dy = y - centerY;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;
    const k = 1 + (rng() * 2 - 1) * amount;
    return [x + nx * (k - 1) * d * 0.5, y + ny * (k - 1) * d * 0.5];
  });
}

function catmullRomPath(points, closed = true) {
  const n = points.length;
  const get = (i) => points[((i % n) + n) % n];
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  if (closed) d += ' Z';
  return d;
}

function makeBlob(r, L, seed, amount) {
  const raw = teardropOutline(r, L, 10, 4);
  const centerY = L * 0.35; // rough visual centroid, biases jitter direction sensibly
  const j = jitter(raw, amount, seed, centerY);
  return catmullRomPath(j, true);
}

const patches = [
  { name: 'accent (main)', r: 5.5, L: 30, seed: 101, amount: 0.16 },
  { name: 'black (head)',  r: 5,   L: 8,  seed: 202, amount: 0.18 },
  { name: 'white',         r: 4,   L: 16, seed: 303, amount: 0.16 },
  { name: 'orange',        r: 3.5, L: 10, seed: 404, amount: 0.18 },
  { name: 'black (tail)',  r: 2.8, L: 7,  seed: 505, amount: 0.2 },
];

for (const p of patches) {
  console.log(`\n${p.name}:`);
  console.log(makeBlob(p.r, p.L, p.seed, p.amount));
}

// second variant seed set for cross-check
console.log('\n--- variant 2 seeds ---');
const patches2 = [
  { name: 'accent (main)', r: 5.5, L: 30, seed: 111, amount: 0.16 },
  { name: 'black (head)',  r: 5,   L: 8,  seed: 212, amount: 0.18 },
  { name: 'white',         r: 4,   L: 16, seed: 313, amount: 0.16 },
  { name: 'orange',        r: 3.5, L: 10, seed: 414, amount: 0.18 },
  { name: 'black (tail)',  r: 2.8, L: 7,  seed: 515, amount: 0.2 },
];
for (const p of patches2) {
  console.log(`\n${p.name}:`);
  console.log(makeBlob(p.r, p.L, p.seed, p.amount));
}
