/**
 * Garden of Growth — accumulative lotus mandala.
 * 90 single petal slots arranged in 4 interlocking rings.
 * One completed practice day = one petal placed.
 * Ghost outlines show the full mandala waiting to be earned.
 */
import { motion } from 'framer-motion';

interface Props {
  isDarkMode: boolean;
  completedDays?: number; // 0–90; defaults to 90 for full-bloom demo
}

// Brand palette
const T  = '#C96A3A';   // terracotta
const T2 = '#B85030';   // deep terracotta
const S  = '#415D43';   // forest sage
const S2 = '#576355';   // mid sage
const G  = '#E5D6A7';   // pale gold
const G2 = '#D4B87A';   // warm gold

const CX = 108, CY = 108;

// ─── Ring geometry ───────────────────────────────────────────
// Each ring's base orbit ≈ previous ring's tip orbit → interlocking
const RINGS = [
  { n: 9,  orbit: 20, h: 15, wRatio: 0.32 }, // tips at 35
  { n: 18, orbit: 35, h: 18, wRatio: 0.30 }, // tips at 53; base=35 = R1 tip
  { n: 27, orbit: 53, h: 20, wRatio: 0.28 }, // tips at 73; base=53 = R2 tip
  { n: 35, orbit: 72, h: 18, wRatio: 0.26 }, // tips at 90; base=72 ≈ R3 tip
];
// Total slots: 1 (center) + 9 + 18 + 27 + 35 = 90

// Per-ring petal fill colors (alternating across n petals)
const RING_FILLS = [
  (i: number) => i % 2 === 0 ? T  : T2,
  (i: number) => i % 3 === 0 ? T  : i % 3 === 1 ? T2 : S2,
  (i: number) => i % 4 === 0 ? T  : i % 4 === 1 ? S  : i % 4 === 2 ? S2 : T2,
  (i: number) => i % 3 === 0 ? S  : i % 3 === 1 ? S2 : T,
];
const RING_ACCENTS = [
  (_i: number) => G,
  (i: number) => i % 2 === 0 ? G  : G2,
  (i: number) => i % 3 === 1 ? G2 : G,
  (i: number) => i % 2 === 0 ? G2 : G,
];
const RING_OFFSETS = [0, 8, 3, 1]; // angular offsets per ring

// ─── Build flat position list (index = practice session #) ───
interface PetalPos {
  x: number; y: number;
  angle: number;
  h: number; w: number;
  fill: string; accent: string;
  delay: number;
}

function buildPositions(): PetalPos[] {
  const out: PetalPos[] = [];
  let seq = 0;

  // Center (special — rendered separately, not in this list)

  // Rings 1-4
  RINGS.forEach((ring, ri) => {
    const step = 360 / ring.n;
    const offset = RING_OFFSETS[ri];
    for (let i = 0; i < ring.n; i++) {
      const angleDeg = i * step + offset;
      const rad = (angleDeg - 90) * Math.PI / 180;
      out.push({
        x: CX + Math.cos(rad) * ring.orbit,
        y: CY + Math.sin(rad) * ring.orbit,
        angle: angleDeg,
        h: ring.h,
        w: ring.h * ring.wRatio,
        fill: RING_FILLS[ri](i),
        accent: RING_ACCENTS[ri](i),
        delay: 0.3 + seq * 0.018,
      });
      seq++;
    }
  });

  return out;
}

const POSITIONS = buildPositions(); // 89 petal slots; #90 = center piece

// ─── SVG path helpers ────────────────────────────────────────
// Outer petal: pointed top, rounded base at (0,0)
function petalOuter(h: number, w: number) {
  return `M0,0 C${w},${-h * 0.10} ${w * 0.86},-${h * 0.52} 0,-${h} C-${w * 0.86},-${h * 0.52} -${w},-${h * 0.10} 0,0`;
}
// Inner highlight (narrower, slightly inset from base)
function petalInner(h: number, w: number) {
  const w2 = w * 0.52, h2 = h * 0.88;
  return `M0,${-h * 0.06} C${w2},${-h * 0.10} ${w2 * 0.9},-${h * 0.48} 0,-${h2} C-${w2 * 0.9},-${h * 0.48} -${w2},-${h * 0.10} 0,${-h * 0.06}`;
}

// ─── Ghost petal (unfilled) ───────────────────────────────────
function GhostPetal({ h, w, isDarkMode }: { h: number; w: number; isDarkMode: boolean }) {
  const strokeColor = isDarkMode ? G : S;
  return (
    <path
      d={petalOuter(h, w)}
      fill={isDarkMode ? 'rgba(229,214,167,0.04)' : 'rgba(65,93,67,0.05)'}
      stroke={strokeColor}
      strokeWidth="0.4"
      strokeOpacity={isDarkMode ? 0.14 : 0.12}
    />
  );
}

// ─── Filled petal (earned) ────────────────────────────────────
function FilledPetal({ h, w, fill, accent, delay }: {
  h: number; w: number; fill: string; accent: string; delay: number;
}) {
  return (
    <motion.g
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.55, delay }}
    >
      {/* Outer body */}
      <path d={petalOuter(h, w)} fill={fill} fillOpacity={0.90} />
      {/* Inner highlight */}
      <path d={petalInner(h, w)} fill={fill} fillOpacity={0.38}
        style={{ filter: 'brightness(1.45)' }} />
      {/* Gem accent */}
      <ellipse cx={0} cy={-h * 0.53} rx={w * 0.30} ry={h * 0.10}
        fill={accent} fillOpacity={0.88} />
    </motion.g>
  );
}

// ─── Center piece (the first practice — the seed) ────────────
function CenterPiece({ fill, accent, delay }: { fill: string; accent: string; delay: number }) {
  const h = 13, n = 8;
  return (
    <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, delay }}>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} transform={`rotate(${i * (360 / n)})`}>
          <path d={petalOuter(h, h * 0.36)} fill={fill} fillOpacity={0.92} />
          <path d={petalInner(h, h * 0.36)} fill={fill} fillOpacity={0.40}
            style={{ filter: 'brightness(1.5)' }} />
          <ellipse cx={0} cy={-h * 0.53} rx={h * 0.10} ry={h * 0.09}
            fill={accent} fillOpacity={0.90} />
        </g>
      ))}
      <circle cx={0} cy={0} r={h * 0.28} fill={accent} />
    </motion.g>
  );
}

// ─── Main component ───────────────────────────────────────────
export const GardenDemoFinal: React.FC<Props> = ({ isDarkMode, completedDays = 90 }) => {
  // slot 0 = center piece; slots 1–89 = outer petals in POSITIONS order
  const centerEarned = completedDays >= 1;
  const earnedPetals = Math.min(completedDays - 1, 89); // how many of the 89 ring petals are earned

  const bg = isDarkMode
    ? 'linear-gradient(145deg, #252B1C 0%, #1C2116 60%, #22200E 100%)'
    : 'linear-gradient(145deg, #E8DDD0 0%, #DCCFBA 55%, #D2DACC 100%)';

  // Progress label
  let ringLabel = 'Full bloom';
  if (completedDays < 2)  ringLabel = 'The seed';
  else if (completedDays < 10) ringLabel = 'Taking root';
  else if (completedDays < 28) ringLabel = 'Ring 1 done';
  else if (completedDays < 55) ringLabel = 'Ring 2 done';
  else if (completedDays < 90) ringLabel = 'Ring 3 done';

  // Flower of Life circles — same coordinate space as the mandala (center at CX, CY)
  // r = lattice constant = circle radius → each circle passes through its 6 neighbours' centers
  // bound = 90 = mandala outer ring radius → FoL bounding circle matches mandala edge exactly
  const FOL_R = 32;
  const FOL_BOUND = 90;
  const folA2y = FOL_R * (Math.sqrt(3) / 2);
  const folCircles: { x: number; y: number }[] = [];
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      const x = CX + i * FOL_R + j * FOL_R * 0.5;
      const y = CY + j * folA2y;
      if (Math.sqrt((x - CX) ** 2 + (y - CY) ** 2) <= FOL_BOUND) {
        folCircles.push({ x, y });
      }
    }
  }
  const folStroke = isDarkMode ? G : S;
  const folOp = isDarkMode ? 0.10 : 0.08;

  return (
    <div
      className="relative w-full rounded-[2.5rem] overflow-hidden"
      style={{
        height: 380,
        background: bg,
        border: isDarkMode
          ? '1px solid rgba(229,214,167,0.09)'
          : '1px solid rgba(201,106,58,0.20)',
        boxShadow: isDarkMode
          ? '0 20px 60px rgba(0,0,0,0.65)'
          : '0 12px 40px rgba(65,93,67,0.16)',
      }}
    >
      {/* Ambient center glow — aligned to mandala center (~43% from top of 380px card) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: isDarkMode
          ? 'radial-gradient(ellipse 70% 60% at 50% 43%, rgba(201,106,58,0.20) 0%, transparent 68%)'
          : 'radial-gradient(ellipse 70% 60% at 50% 43%, rgba(201,106,58,0.13) 0%, transparent 68%)',
      }} />

      {/* Mandala SVG — centered between card top and pill */}
      {/* Pill top = 326px from card top; container centered in that 326px = 18px margin each side */}
      <div style={{
        position: 'absolute', top: 18, left: 0, right: 0, bottom: 72,
      }}>
        <svg
          width="100%" height="100%"
          viewBox="10 10 196 196"
          preserveAspectRatio="xMidYMid meet"
          overflow="visible"
        >
          <defs>
            <radialGradient id="cgMain" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="white"  stopOpacity="1" />
              <stop offset="38%"  stopColor={G}      stopOpacity="0.94" />
              <stop offset="100%" stopColor={T}       stopOpacity="0" />
            </radialGradient>
            <filter id="gfMain" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Flower of Life background ──────────────────── */}
          <g stroke={folStroke} fill="none" opacity={folOp}>
            <circle cx={CX} cy={CY} r={FOL_BOUND} strokeWidth="0.9" />
            {folCircles.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={FOL_R} strokeWidth="0.55" />
            ))}
          </g>

          {/* ── Ghost layer (all unearned petals) ─────────── */}
          {POSITIONS.map((p, idx) => {
            if (idx < earnedPetals) return null;
            return (
              <g key={`ghost-${idx}`}
                transform={`translate(${p.x},${p.y}) rotate(${p.angle})`}>
                <GhostPetal h={p.h} w={p.w} isDarkMode={isDarkMode} />
              </g>
            );
          })}

          {/* ── Earned petals (back rings first) ──────────── */}
          {POSITIONS.map((p, idx) => {
            if (idx >= earnedPetals) return null;
            return (
              <g key={`petal-${idx}`}
                transform={`translate(${p.x},${p.y}) rotate(${p.angle})`}>
                <FilledPetal h={p.h} w={p.w} fill={p.fill} accent={p.accent} delay={p.delay} />
              </g>
            );
          })}

          {/* ── Center piece ───────────────────────────────── */}
          <g transform={`translate(${CX},${CY})`} filter="url(#gfMain)">
            {centerEarned
              ? <CenterPiece fill={T} accent={G} delay={0.1} />
              : <GhostPetal h={13} w={13 * 0.36} isDarkMode={isDarkMode} />
            }
          </g>

          {/* Center glow disc */}
          <motion.circle cx={CX} cy={CY} r={9} fill="url(#cgMain)"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.05 }}
            filter="url(#gfMain)"
          />

          {/* Breathing pulse */}
          <motion.circle cx={CX} cy={CY} r={6}
            fill="none" stroke={G} strokeWidth="1" strokeOpacity={0.45}
            animate={{ r: [6, 20, 6], opacity: [0.45, 0, 0.45] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        </svg>
      </div>

      {/* HUD */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: completedDays === 90 ? 2.2 : 0.5 }}
        style={{
          position: 'absolute', bottom: 18, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '0 24px',
          pointerEvents: 'none',
        }}
      >
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 18px', borderRadius: 999, whiteSpace: 'nowrap',
          background: isDarkMode ? 'rgba(0,0,0,0.40)' : 'rgba(255,255,255,0.60)',
          backdropFilter: 'blur(10px)',
          border: isDarkMode
            ? '1px solid rgba(229,214,167,0.10)'
            : '1px solid rgba(201,106,58,0.20)',
        }}>

        <span style={{ fontSize: 11, fontWeight: 700, color: T }}>
          {completedDays} / 90
        </span>
        <div style={{
          width: 1, height: 12,
          background: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(65,93,67,0.20)',
        }} />
        <span style={{
          fontSize: 10, fontWeight: 600, letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: isDarkMode ? 'rgba(229,214,167,0.55)' : S2,
        }}>
          {ringLabel}
        </span>
        </div>
      </motion.div>

    </div>
  );
};
