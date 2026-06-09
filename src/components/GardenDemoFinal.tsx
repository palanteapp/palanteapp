/**
 * Garden of Growth — accumulative lotus mandala.
 * 90 single petal slots arranged in 4 interlocking rings.
 * One completed practice day = one petal placed.
 * Ghost outlines show the full mandala waiting to be earned.
 */
import { useMemo } from 'react';
import { motion } from 'framer-motion';

interface Props {
  isDarkMode: boolean;
  completedDays?: number; // 0–90; defaults to 90 for full-bloom demo
  colorCycle?: number;    // 0=terracotta (default), 1=indigo, 2=gold, 3=rose
}

// ─── Color palettes — one per 90-day cycle ────────────────────
// Each palette: [primary, deep, sage/secondary, sage-mid, accent, accent2]
const PALETTES = [
  // 0 — Terracotta (original)
  { T: '#C96A3A', T2: '#B85030', S: '#415D43', S2: '#576355', G: '#E5D6A7', G2: '#D4B87A',
    bg0: '#2A1508', bg1: '#1C2D1E', bg2: '#142018',
    bgL0: '#EDD9BC', bgL1: '#C6D1C3', bgL2: '#B8CAB8' },
  // 1 — Indigo bloom
  { T: '#6B4FBB', T2: '#5A3FA0', S: '#2D3E6B', S2: '#4A5580', G: '#C5C0F0', G2: '#A89FD8',
    bg0: '#12103A', bg1: '#1A1B42', bg2: '#0F0D30',
    bgL0: '#DDD8F5', bgL1: '#C0C4E8', bgL2: '#B2B6DC' },
  // 2 — Amber gold
  { T: '#C89030', T2: '#A87020', S: '#5C4A10', S2: '#7A6030', G: '#F5E8B0', G2: '#E8CF80',
    bg0: '#2A1E04', bg1: '#2C220A', bg2: '#1E1604',
    bgL0: '#F5EDD0', bgL1: '#E8DFB0', bgL2: '#DDD5A0' },
  // 3 — Rose quartz
  { T: '#C95080', T2: '#A83860', S: '#6B2A3A', S2: '#884455', G: '#F0C8D8', G2: '#D8A0B8',
    bg0: '#2A0A14', bg1: '#2C101A', bg2: '#200810',
    bgL0: '#F5D8E8', bgL1: '#E8C0D0', bgL2: '#DDB0C0' },
] as const;

// Default palette constants (used in module-level helpers that need them before render)
const T  = PALETTES[0].T;
const T2 = PALETTES[0].T2;
const S  = PALETTES[0].S;
const S2 = PALETTES[0].S2;
const G  = PALETTES[0].G;
const G2 = PALETTES[0].G2;

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

const RING_OFFSETS = [0, 8, 3, 1]; // angular offsets per ring

// ─── Build flat position list (index = practice session #) ───
interface PetalPos {
  x: number; y: number;
  angle: number;
  h: number; w: number;
  fill: string; accent: string;
  delay: number;
}

type Pal = typeof PALETTES[number];

function buildPositions(p: Pal): PetalPos[] {
  const fills = [
    (i: number) => i % 2 === 0 ? p.T  : p.T2,
    (i: number) => i % 3 === 0 ? p.T  : i % 3 === 1 ? p.T2 : p.S2,
    (i: number) => i % 4 === 0 ? p.T  : i % 4 === 1 ? p.S  : i % 4 === 2 ? p.S2 : p.T2,
    (i: number) => i % 3 === 0 ? p.S  : i % 3 === 1 ? p.S2 : p.T,
  ];
  const accents = [
    (_i: number) => p.G,
    (i: number) => i % 2 === 0 ? p.G  : p.G2,
    (i: number) => i % 3 === 1 ? p.G2 : p.G,
    (i: number) => i % 2 === 0 ? p.G2 : p.G,
  ];

  const out: PetalPos[] = [];
  let seq = 0;
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
        fill: fills[ri](i),
        accent: accents[ri](i),
        delay: 0.3 + seq * 0.018,
      });
      seq++;
    }
  });
  return out;
}

// Default positions for module-level consumers (palette 0)
const POSITIONS = buildPositions(PALETTES[0]); // 89 petal slots; #90 = center piece

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
// Lens/almond petal — pointed at BOTH ends (r1=outer tip, r2=inner tip, w=half-width)
function lensPath(r1: number, r2: number, w: number) {
  const m1 = r1 * 0.72 + r2 * 0.28;
  const m2 = r1 * 0.28 + r2 * 0.72;
  return `M0,${-r1} C${w},${-m1} ${w},${-m2} 0,${-r2} C${-w},${-m2} ${-w},${-m1} 0,${-r1}`;
}
// 8-pointed star (octagram) — alternates R (outer) and r (inner) every 22.5°
function octagramPath(R: number, r: number) {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i * 22.5 - 90) * (Math.PI / 180);
    const rad = i % 2 === 0 ? R : r;
    pts.push(`${(rad * Math.cos(a)).toFixed(3)},${(rad * Math.sin(a)).toFixed(3)}`);
  }
  return `M${pts.join('L')}Z`;
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

// ─── Ghost center — rosette outline waiting to bloom ──────────
function GhostCenter({ isDarkMode }: { isDarkMode: boolean }) {
  const stroke = isDarkMode ? G : S;
  const fill = isDarkMode ? 'rgba(229,214,167,0.03)' : 'rgba(65,93,67,0.04)';
  const sop = isDarkMode ? 0.13 : 0.11;
  return (
    <g>
      {Array.from({ length: 8 }, (_, i) => (
        <g key={`gop-${i}`} transform={`rotate(${i * 45})`}>
          <path d={lensPath(20, 4.8, 6.2)} fill={fill} stroke={stroke} strokeWidth={0.4} strokeOpacity={sop} />
        </g>
      ))}
      {Array.from({ length: 8 }, (_, i) => (
        <g key={`gip-${i}`} transform={`rotate(${i * 45 + 22.5})`}>
          <path d={lensPath(13, 4.8, 4.2)} fill={fill} stroke={stroke} strokeWidth={0.4} strokeOpacity={sop} />
        </g>
      ))}
      <path d={octagramPath(5.0, 2.8)} fill={fill} stroke={stroke} strokeWidth={0.4} strokeOpacity={sop} />
    </g>
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

// ─── Center piece — 8-petal lotus rosette with octagram heart ─
function CenterPiece({ fill, accent, delay }: { fill: string; accent: string; delay: number }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.55 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.4, delay, ease: 'easeOut' }}
      style={{ originX: '0px', originY: '0px' }}
    >
      {/* ── Ripple waves — 3 staggered rings that pulse outward from center ── */}
      {[0, 1, 2].map((i) => (
        <motion.circle
          key={`ripple-${i}`}
          cx={0} cy={0}
          r={0}
          fill="none"
          stroke={accent}
          strokeWidth={0.6}
          initial={{ r: 0, opacity: 0 }}
          animate={{ r: [0, 28], opacity: [0.35, 0] }}
          transition={{
            repeat: Infinity,
            duration: 12.5,
            delay: i * (12.5 / 3),
            ease: 'easeOut',
          }}
        />
      ))}

      {/* ── Scaled-down petal group (75% size, 50% opacity) ── */}
      <g transform="scale(0.75)" opacity={0.5}>
        {/* ── Warm ambient glow (breathes slowly) ── */}
        <motion.circle cx={0} cy={0} r={22}
          fill={fill} fillOpacity={0.13}
          animate={{ r: [19, 24, 19], opacity: [0.13, 0.22, 0.13] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        />

        {/* ── Outer 8 petals (double-pointed lens, r1=20 → r2=4.8) ── */}
        {Array.from({ length: 8 }, (_, i) => (
          <g key={`op-${i}`} transform={`rotate(${i * 45})`}>
            <path d={lensPath(20, 4.8, 6.2)} fill={fill} fillOpacity={0.88} />
            <path d={lensPath(19, 5.6, 2.8)} fill={accent} fillOpacity={0.18} />
          </g>
        ))}

        {/* ── Inner 8 petals (22.5° offset, shorter: r1=13 → r2=4.8) ── */}
        {Array.from({ length: 8 }, (_, i) => (
          <g key={`ip-${i}`} transform={`rotate(${i * 45 + 22.5})`}>
            <path d={lensPath(13, 4.8, 4.2)} fill={fill} fillOpacity={0.72} />
            <path d={lensPath(12.2, 5.4, 2.0)} fill={accent} fillOpacity={0.14} />
          </g>
        ))}

        {/* ── Octagram star at the very center ── */}
        <motion.path
          d={octagramPath(5.0, 2.8)}
          fill={accent}
          fillOpacity={0.95}
          animate={{ opacity: [0.85, 1, 0.85] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        />

        {/* ── Breathing pulse ring ── */}
        <motion.circle cx={0} cy={0} r={21} fill="none"
          stroke={accent} strokeWidth={0.55}
          animate={{ r: [19, 24, 19], opacity: [0.45, 0, 0.45] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
        />
      </g>
    </motion.g>
  );
}

// ─── Main component ───────────────────────────────────────────
export const GardenDemoFinal: React.FC<Props> = ({ isDarkMode, completedDays = 90, colorCycle = 0 }) => {
  // Pick palette from cycle — wraps around every 4 completions
  const pal = PALETTES[colorCycle % PALETTES.length];
  // Rebuild positions only when palette changes
  const positions = useMemo(
    () => colorCycle === 0 ? POSITIONS : buildPositions(pal),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colorCycle]
  );

  // slot 0 = center piece; slots 1–89 = outer petals in positions order
  const centerEarned = completedDays >= 1;
  const earnedPetals = Math.min(completedDays - 1, 89); // how many of the 89 ring petals are earned

  // gradient center ~44% aligns with mandala center (167/380)
  const bg = isDarkMode
    ? `radial-gradient(ellipse at 50% 44%, ${pal.bg0} 0%, ${pal.bg1} 58%, ${pal.bg2} 100%)`
    : `radial-gradient(ellipse at 50% 44%, ${pal.bgL0} 0%, ${pal.bgL1} 58%, ${pal.bgL2} 100%)`;

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
  const FOL_R = 29;  // reduced 10% from 32
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
  const folStroke = isDarkMode ? pal.G : pal.S;
  const folOp = isDarkMode ? 0.06 : 0.05;

  // Hex → rgba helper for dynamic glow colors
  const hexAlpha = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1,3),16), g2 = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g2},${b},${a})`;
  };

  return (
    <div
      className="relative w-full rounded-[2.5rem] overflow-hidden"
      style={{
        height: 380,
        background: bg,
        border: isDarkMode
          ? `1px solid ${hexAlpha(pal.G, 0.09)}`
          : `1px solid ${hexAlpha(pal.T, 0.20)}`,
        boxShadow: isDarkMode
          ? '0 20px 60px rgba(0,0,0,0.65)'
          : '0 12px 40px rgba(65,93,67,0.16)',
      }}
    >
      {/* Ambient center glow — aligned to mandala center (~44% from top of 380px card) */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: isDarkMode
          ? `radial-gradient(ellipse 70% 60% at 50% 44%, ${hexAlpha(pal.T, 0.20)} 0%, transparent 68%)`
          : `radial-gradient(ellipse 70% 60% at 50% 44%, ${hexAlpha(pal.T, 0.13)} 0%, transparent 68%)`,
      }} />

      {/* Mandala SVG — outer ring centered between card top and streak pill */}
      <div style={{
        position: 'absolute', top: 23, left: 0, right: 0, bottom: 69,
      }}>
        <svg
          width="100%" height="100%"
          viewBox="10 10 196 196"
          preserveAspectRatio="xMidYMid meet"
          overflow="visible"
        >
          <defs>
            <radialGradient id="cgMain" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="white"    stopOpacity="1" />
              <stop offset="38%"  stopColor={pal.G}    stopOpacity="0.94" />
              <stop offset="100%" stopColor={pal.T}    stopOpacity="0" />
            </radialGradient>
            <filter id="gfMain" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="1.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* ── Flower of Life background ──────────────────── */}
          <g stroke={folStroke} fill="none" opacity={folOp}>
            <circle cx={CX} cy={CY} r={FOL_BOUND} strokeWidth="0.7" />
            {folCircles.map((c, i) => (
              <circle key={i} cx={c.x} cy={c.y} r={FOL_R} strokeWidth="0.4" />
            ))}
          </g>

          {/* ── Ghost layer (all unearned petals) ─────────── */}
          {positions.map((p, idx) => {
            if (idx < earnedPetals) return null;
            return (
              <g key={`ghost-${idx}`}
                transform={`translate(${p.x},${p.y}) rotate(${p.angle})`}>
                <GhostPetal h={p.h} w={p.w} isDarkMode={isDarkMode} />
              </g>
            );
          })}

          {/* ── Earned petals (back rings first) ──────────── */}
          {positions.map((p, idx) => {
            if (idx >= earnedPetals) return null;
            return (
              <g key={`petal-${idx}`}
                transform={`translate(${p.x},${p.y}) rotate(${p.angle})`}>
                <FilledPetal h={p.h} w={p.w} fill={p.fill} accent={p.accent} delay={p.delay} />
              </g>
            );
          })}

          {/* ── Center piece ───────────────────────────────── */}
          <g transform={`translate(${CX},${CY})`}>
            {/* Subtle glow disc behind the petals — not on top */}
            <motion.circle
              cx={0} cy={0} r={16}
              fill="url(#cgMain)" fillOpacity={0.35}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.05 }}
            />
            {centerEarned
              ? <CenterPiece fill={pal.T} accent={pal.G} delay={0.1} />
              : <GhostCenter isDarkMode={isDarkMode} />
            }
          </g>

          {/* Breathing pulse */}
          <motion.circle cx={CX} cy={CY} r={6}
            fill="none" stroke={pal.G} strokeWidth="1" strokeOpacity={0.45}
            animate={{ r: [6, 20, 6], opacity: [0.45, 0, 0.45] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* ── Ripple waves — Framer Motion for reliable cross-platform looping ── */}
          {/* 4 rings, each 4 s apart in a 16 s cycle. delay < 0 not supported by  */}
          {/* Framer Motion, so we pre-offset with repeatDelay + initial delay.     */}
          {[0, 1, 2, 3].map((i) => (
            <motion.circle
              key={`ripple-${i}`}
              cx={CX} cy={CY}
              fill="none"
              stroke={pal.G}
              strokeWidth={0.65}
              initial={{ r: 8, opacity: 0 }}
              animate={{ r: [8, 14, 55, 90], opacity: [0, 0.40, 0.26, 0] }}
              transition={{
                duration: 16,
                delay: i * 4,
                repeat: Infinity,
                repeatDelay: 0,
                ease: 'linear',
                times: [0, 0.08, 0.50, 1],
              }}
            />
          ))}

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
