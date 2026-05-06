import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flame, Sparkles, HelpCircle } from 'lucide-react';
import {
  getUnlockedStreakMilestones,
  getUnlockedPointsMilestones,
} from '../data/gardenMilestones';

// ─── Stable noise so plants don't jump on re-render ──────────────────────────
const PLANT_JITTER = Array.from({ length: 12 }).map((_, i) => ({
  rx: ((i * 37 + 11) % 100) / 100,
  ry: ((i * 53 + 7) % 100) / 100,
  rs: ((i * 71 + 19) % 100) / 100,
}));

// ─── Stable firefly positions ─────────────────────────────────────────────────
const FIREFLY_DATA = Array.from({ length: 20 }).map((_, i) => ({
  x: ((i * 47 + 13) % 100) + '%',
  y: ((i * 61 + 9) % 80) + '%',
  dur: 4 + (i % 5),
  delay: (i * 0.7) % 8,
}));

// ─── Sky configs (same as before) ────────────────────────────────────────────
const STAR_POSITIONS = Array.from({ length: 30 }).map((_, i) => ({
  x: (i * 37 + 11) % 100,
  y: (i * 53 + 7) % 55,
  r: 0.5 + (i % 3) * 0.4,
  op: 0.4 + (i % 4) * 0.15,
}));
const CLOUD_POSITIONS = [
  { x: 12, y: 18, scale: 1 },
  { x: 55, y: 12, scale: 0.7 },
  { x: 80, y: 22, scale: 0.85 },
];

type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';
const SKY: Record<TimeOfDay, {
  sky: string; ground: string;
  showSun: boolean; showMoon: boolean; showStars: boolean; showClouds: boolean;
  sunY: number; sunX: string; sunColor: string; sunGlow: string;
}> = {
  morning: {
    sky: 'linear-gradient(to bottom, #87CEEB 0%, #B8E4F7 45%, #FDE68A 80%, #FDBA74 100%)',
    ground: 'linear-gradient(to top, #4D7C0F 0%, #65A30D 40%, transparent 100%)',
    showSun: true, showMoon: false, showStars: false, showClouds: true,
    sunY: 65, sunX: '15%', sunColor: '#FCD34D', sunGlow: 'rgba(252,211,77,0.5)',
  },
  afternoon: {
    sky: 'linear-gradient(to bottom, #3B82F6 0%, #60A5FA 50%, #93C5FD 100%)',
    ground: 'linear-gradient(to top, #4D7C0F 0%, #65A30D 40%, transparent 100%)',
    showSun: true, showMoon: false, showStars: false, showClouds: true,
    sunY: 20, sunX: '75%', sunColor: '#FFF7CD', sunGlow: 'rgba(255,247,205,0.6)',
  },
  evening: {
    sky: 'linear-gradient(to bottom, #1E3A5F 0%, #7C3AED 30%, #C2410C 60%, #F97316 80%, #FDBA74 100%)',
    ground: 'linear-gradient(to top, #1C1917 0%, #292524 40%, transparent 100%)',
    showSun: true, showMoon: false, showStars: false, showClouds: false,
    sunY: 75, sunX: '15%', sunColor: '#F97316', sunGlow: 'rgba(249,115,22,0.6)',
  },
  night: {
    sky: 'linear-gradient(to bottom, #0F0C29 0%, #1a1a4e 40%, #24243e 100%)',
    ground: 'linear-gradient(to top, #0f172a 0%, #1e293b 40%, transparent 100%)',
    showSun: false, showMoon: true, showStars: true, showClouds: false,
    sunY: 20, sunX: '15%', sunColor: '#E2E8F0', sunGlow: 'rgba(226,232,240,0.3)',
  },
};

// ─── Plant SVGs ───────────────────────────────────────────────────────────────
const Sprout = () => (
  <svg width="18" height="28" viewBox="0 0 18 28" fill="none">
    <path d="M9 28C9 28 7 18 9 6" stroke="#355E3B" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 20C9 20 4 18 3 14C2 10 6 9 9 14" fill="#4D7C0F" fillOpacity="0.6" />
    <path d="M9 14C9 14 14 12 15 8C16 4 12 3 9 8" fill="#4D7C0F" fillOpacity="0.5" />
  </svg>
);
const Fern = () => (
  <svg width="36" height="60" viewBox="0 0 36 60" fill="none">
    <path d="M18 60C18 60 14 36 18 8" stroke="#355E3B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />
    {[8, 18, 28, 38, 48].map(y => (
      <g key={y}>
        <path d={`M18 ${y + 8} C18 ${y + 8} 32 ${y} 35 ${y - 4}`} stroke="#355E3B" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
        <path d={`M18 ${y + 8} C18 ${y + 8} 4 ${y} 1 ${y - 4}`} stroke="#355E3B" strokeWidth="1" strokeOpacity="0.5" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);
const Wildflower = ({ color }: { color: string }) => (
  <svg width="28" height="48" viewBox="0 0 28 48" fill="none">
    <path d="M14 48C14 48 11 32 14 18" stroke="#355E3B" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 36C14 36 7 34 6 30C5 26 9 25 14 30" fill="#355E3B" fillOpacity="0.4" />
    <g transform="translate(14,18)">
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} rx="4" ry="7" fill={color} transform={`rotate(${a}) translate(0,-6)`} />
      ))}
      <circle r="3" fill="#E5D6A7" />
    </g>
  </svg>
);
const Lotus = ({ color }: { color: string }) => (
  <svg width="56" height="42" viewBox="0 0 56 42" fill="none" className="drop-shadow-sm">
    <path d="M28 38C18 38 8 30 8 18C8 6 18 0 28 0C38 0 48 6 48 18C48 30 38 38 28 38Z" fill={color} fillOpacity="0.18" />
    <path d="M28 33C22 33 16 26 16 16C16 6 22 1 28 1C34 1 40 6 40 16C40 26 34 33 28 33Z" fill={color} fillOpacity="0.38" />
    <path d="M28 28C24 28 20 23 20 16C20 9 24 5 28 5C32 5 36 9 36 16C36 23 32 28 28 28Z" fill={color} fillOpacity="0.58" />
    <circle cx="28" cy="16" r="3.5" fill="#E5D6A7" className="animate-pulse" />
  </svg>
);
const Butterfly = () => (
  <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
    <path d="M16 12C16 12 8 4 2 6C-4 8 2 18 16 12Z" fill="#D4A3C5" fillOpacity="0.7" />
    <path d="M16 12C16 12 24 4 30 6C36 8 30 18 16 12Z" fill="#A3B5D4" fillOpacity="0.7" />
    <path d="M16 12C16 12 10 16 6 14C2 12 6 20 16 14Z" fill="#D4A3C5" fillOpacity="0.5" />
    <path d="M16 12C16 12 22 16 26 14C30 12 26 20 16 14Z" fill="#A3B5D4" fillOpacity="0.5" />
    <line x1="16" y1="8" x2="14" y2="4" stroke="#6B4C3B" strokeWidth="0.8" />
    <line x1="16" y1="8" x2="18" y2="4" stroke="#6B4C3B" strokeWidth="0.8" />
  </svg>
);
const KoiFish = ({ color, flip }: { color: string; flip?: boolean }) => (
  <svg width="36" height="16" viewBox="0 0 36 16" fill="none" style={{ transform: flip ? 'scaleX(-1)' : undefined }}>
    <path d="M4 8C4 8 14 2 24 8C14 14 4 8 4 8Z" fill={color} fillOpacity="0.85" />
    <path d="M24 8C28 8 34 4 36 8C34 12 28 8 24 8Z" fill={color} fillOpacity="0.6" />
    <circle cx="8" cy="7" r="1.2" fill="white" fillOpacity="0.8" />
  </svg>
);
const BirdOfParadise = () => (
  <svg width="44" height="70" viewBox="0 0 44 70" fill="none">
    <path d="M22 70C22 70 18 44 22 10" stroke="#355E3B" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 50C22 50 8 46 4 38C0 30 8 26 22 38" fill="#4D7C0F" fillOpacity="0.5" />
    <path d="M22 38C22 38 36 34 40 26C44 18 36 14 22 26" fill="#4D7C0F" fillOpacity="0.45" />
    <path d="M18 18C18 18 10 10 14 4C16 2 20 4 18 18Z" fill="#F97316" fillOpacity="0.8" />
    <path d="M22 16C22 16 22 6 26 2C28 0 32 2 22 16Z" fill="#C96A3A" fillOpacity="0.8" />
    <path d="M26 20C26 20 34 14 36 8C37 5 34 4 26 20Z" fill="#A855F7" fillOpacity="0.7" />
  </svg>
);
const CherryBlossomTree = () => (
  <svg width="80" height="100" viewBox="0 0 80 100" fill="none">
    <path d="M40 100C40 100 36 70 40 30" stroke="#6B4C3B" strokeWidth="3" strokeLinecap="round" />
    <path d="M40 60C40 60 24 54 18 42C12 30 22 24 40 38" stroke="#6B4C3B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M40 48C40 48 56 42 62 30C68 18 58 12 40 26" stroke="#6B4C3B" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    {[
      [40, 16, 22], [28, 24, 18], [52, 22, 18],
      [20, 36, 16], [58, 34, 16], [32, 12, 14],
      [48, 10, 14], [40, 30, 20], [26, 44, 14], [54, 42, 14],
    ].map(([cx, cy, r], i) => (
      <circle key={i} cx={cx} cy={cy} r={r} fill="#F9A8D4" fillOpacity="0.65" />
    ))}
    {[
      [30, 20], [44, 14], [52, 26], [22, 40], [48, 38],
    ].map(([cx, cy], i) => (
      <circle key={`c${i}`} cx={cx} cy={cy} r="2" fill="#FBCFE8" fillOpacity="0.9" />
    ))}
  </svg>
);
const StonePath = () => (
  <svg width="120" height="20" viewBox="0 0 120 20" fill="none" className="opacity-50">
    {[0, 22, 44, 66, 88].map((x, i) => (
      <ellipse key={i} cx={x + 11} cy="12" rx="10" ry="6" fill="#9CA3AF" fillOpacity="0.6" />
    ))}
  </svg>
);
const KoiPond = ({ isDarkMode }: { isDarkMode: boolean }) => (
  <svg width="100" height="44" viewBox="0 0 100 44" fill="none">
    <ellipse cx="50" cy="28" rx="46" ry="16" fill={isDarkMode ? '#1E3A5F' : '#60A5FA'} fillOpacity="0.55" />
    <ellipse cx="50" cy="28" rx="46" ry="16" stroke={isDarkMode ? '#93C5FD' : '#3B82F6'} strokeWidth="0.8" strokeOpacity="0.4" />
    <ellipse cx="50" cy="28" rx="30" ry="10" fill={isDarkMode ? '#1D4ED8' : '#93C5FD'} fillOpacity="0.3" />
    <g transform="translate(20, 24)"><KoiFish color="#C96A3A" /></g>
    <g transform="translate(48, 30)"><KoiFish color="#E5D6A7" flip /></g>
    <ellipse cx="50" cy="14" rx="14" ry="10" fill="white" fillOpacity="0.06" />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────
interface GardenOfGrowthProps {
  points: number;
  streak: number;
  name: string;
  isDarkMode: boolean;
  timeOfDay?: TimeOfDay;
  onShowLegend?: () => void;
}

export const GardenOfGrowth: React.FC<GardenOfGrowthProps> = ({
  points, streak, name, isDarkMode, timeOfDay = 'morning', onShowLegend,
}) => {
  const sky = SKY[timeOfDay];

  // Which milestone plants are unlocked
  const unlockedStreak = useMemo(() => getUnlockedStreakMilestones(streak), [streak]);
  const unlockedPoints = useMemo(() => getUnlockedPointsMilestones(points), [points]);

  const hasFireflies   = unlockedPoints.some(m => m.id === 'fireflies');
  const hasStonePath   = unlockedPoints.some(m => m.id === 'stone_path');
  const hasKoi         = unlockedStreak.some(m => m.id === 'koi');
  const hasButterfly   = unlockedStreak.some(m => m.id === 'butterfly');
  const hasBOP         = unlockedStreak.some(m => m.id === 'bird_of_paradise');
  const hasCherry      = unlockedStreak.some(m => m.id === 'cherry_blossom');
  const hasLotus       = unlockedStreak.some(m => m.id === 'lotus');
  const hasWildflower  = unlockedStreak.some(m => m.id === 'wildflower');
  const hasFern        = unlockedStreak.some(m => m.id === 'fern');
  const hasSprout      = unlockedStreak.some(m => m.id === 'sprout');

  // Firefly count from streak (even before the "fireflies" point unlock)
  const fireflyCount = hasFireflies ? Math.min(streak, 16) : 0;

  // Terracotta blooms unlock changes wildflower colors
  const bloomColor = unlockedPoints.some(m => m.id === 'terracotta_blooms')
    ? '#C96A3A'
    : '#D4A3C5';

  return (
    <div
      className="relative w-full h-72 rounded-[2.5rem] overflow-hidden border transition-all duration-700"
      style={{
        background: sky.sky,
        borderColor: timeOfDay === 'night' ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.25)',
        boxShadow: timeOfDay === 'night'
          ? '0 20px 60px rgba(0,0,0,0.7)'
          : '0 12px 40px rgba(0,0,0,0.18)',
      }}
    >
      {/* Sky atmosphere blur */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: sky.sky, opacity: 0.25, filter: 'blur(10px)' }} />

      {/* Stars */}
      {sky.showStars && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {STAR_POSITIONS.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="white" opacity={s.op} />
          ))}
        </svg>
      )}

      {/* Moon */}
      {sky.showMoon && (
        <div className="absolute pointer-events-none" style={{ top: '10%', right: '14%' }}>
          <svg width="28" height="28" viewBox="0 0 28 28">
            <circle cx="14" cy="14" r="10" fill="#E2E8F0" opacity="0.92" />
            <circle cx="18" cy="10" r="8" fill="#1a1a4e" />
          </svg>
        </div>
      )}

      {/* Sun */}
      {sky.showSun && (
        <div className="absolute pointer-events-none" style={{ top: `${sky.sunY}%`, left: sky.sunX, transform: 'translate(-50%,-50%)' }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: sky.sunColor, boxShadow: `0 0 18px 8px ${sky.sunGlow}` }} />
        </div>
      )}

      {/* Clouds */}
      {sky.showClouds && CLOUD_POSITIONS.map((c, i) => (
        <div key={i} className="absolute pointer-events-none" style={{ left: `${c.x}%`, top: `${c.y}%`, transform: `scale(${c.scale})` }}>
          <svg width="60" height="24" viewBox="0 0 60 24" fill="none">
            <ellipse cx="30" cy="18" rx="28" ry="6" fill="white" fillOpacity="0.7" />
            <ellipse cx="22" cy="14" rx="14" ry="10" fill="white" fillOpacity="0.8" />
            <ellipse cx="38" cy="15" rx="12" ry="9" fill="white" fillOpacity="0.75" />
            <ellipse cx="30" cy="12" rx="10" ry="8" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
      ))}

      {/* Ground */}
      <div className="absolute bottom-0 inset-x-0 h-2/5 pointer-events-none" style={{ background: sky.ground }} />

      {/* Stone path */}
      {hasStonePath && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none">
          <StonePath />
        </div>
      )}

      {/* Koi pond */}
      {hasKoi && (
        <motion.div
          className="absolute pointer-events-none"
          style={{ bottom: '18%', left: '50%', x: '-50%' }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        >
          <KoiPond isDarkMode={isDarkMode} />
        </motion.div>
      )}

      {/* Plants — distributed left to right by unlock order */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Sprout — far left */}
        {hasSprout && (
          <motion.div className="absolute origin-bottom" style={{ left: '8%', bottom: '22%' }}
            initial={{ scale: 0 }} animate={{ scale: 0.9, rotate: [0, 2, -2, 0] }}
            transition={{ scale: { duration: 1.2, type: 'spring' }, rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}>
            <Sprout />
          </motion.div>
        )}

        {/* Fern — left */}
        {hasFern && (
          <motion.div className="absolute origin-bottom" style={{ left: '16%', bottom: '20%' }}
            initial={{ scale: 0 }} animate={{ scale: 0.85, rotate: [0, 1.5, -1.5, 0] }}
            transition={{ scale: { duration: 1.3, type: 'spring', delay: 0.1 }, rotate: { duration: 7, repeat: Infinity, ease: 'easeInOut' } }}>
            <Fern />
          </motion.div>
        )}

        {/* Wildflower — center-left */}
        {hasWildflower && (
          <motion.div className="absolute origin-bottom" style={{ left: '30%', bottom: '20%' }}
            initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 3, -3, 0] }}
            transition={{ scale: { duration: 1.4, type: 'spring', delay: 0.15 }, rotate: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }}>
            <Wildflower color={bloomColor} />
          </motion.div>
        )}

        {/* Lotus — center */}
        {hasLotus && (
          <motion.div className="absolute origin-bottom" style={{ left: '44%', bottom: hasKoi ? '38%' : '22%' }}
            initial={{ scale: 0 }} animate={{ scale: 1.1, rotate: [0, 2, -2, 0] }}
            transition={{ scale: { duration: 1.5, type: 'spring', delay: 0.2 }, rotate: { duration: 8, repeat: Infinity, ease: 'easeInOut' } }}>
            <Lotus color={bloomColor} />
          </motion.div>
        )}

        {/* Second wildflower — center-right */}
        {hasWildflower && (
          <motion.div className="absolute origin-bottom" style={{ left: '60%', bottom: '22%' }}
            initial={{ scale: 0 }} animate={{ scale: 0.9, rotate: [0, -2, 2, 0] }}
            transition={{ scale: { duration: 1.3, type: 'spring', delay: 0.25 }, rotate: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}>
            <Wildflower color={bloomColor} />
          </motion.div>
        )}

        {/* Bird of paradise — right */}
        {hasBOP && (
          <motion.div className="absolute origin-bottom" style={{ left: '72%', bottom: '20%' }}
            initial={{ scale: 0 }} animate={{ scale: 0.85, rotate: [0, 1, -1, 0] }}
            transition={{ scale: { duration: 1.6, type: 'spring', delay: 0.3 }, rotate: { duration: 9, repeat: Infinity, ease: 'easeInOut' } }}>
            <BirdOfParadise />
          </motion.div>
        )}

        {/* Cherry blossom — far right, tall */}
        {hasCherry && (
          <motion.div className="absolute origin-bottom" style={{ left: '80%', bottom: '18%' }}
            initial={{ scale: 0 }} animate={{ scale: 0.9 }}
            transition={{ duration: 1.8, type: 'spring', delay: 0.35 }}>
            <CherryBlossomTree />
          </motion.div>
        )}

        {/* Butterfly — hovers above center */}
        {hasButterfly && (
          <motion.div
            className="absolute pointer-events-none"
            style={{ left: '45%', top: '30%' }}
            animate={{ y: [0, -8, 0], x: [0, 6, 0], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Butterfly />
          </motion.div>
        )}
      </div>

      {/* Fireflies */}
      {fireflyCount > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          {FIREFLY_DATA.slice(0, fireflyCount).map((ff, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full"
              style={{ left: ff.x, top: ff.y, background: timeOfDay === 'night' ? '#E5D6A7' : 'white', filter: 'blur(0.5px)' }}
              animate={{ opacity: [0, 0.7, 0], scale: [0, 1.4, 0] }}
              transition={{ duration: ff.dur, repeat: Infinity, delay: ff.delay }}
            />
          ))}
        </div>
      )}

      {/* HUD — streak + points */}
      <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-4 px-4">
        <motion.div
          className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-black/25 backdrop-blur-md border border-white/10"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-1.5">
            <Flame size={13} className="text-orange-400" />
            <span className="text-xs font-bold text-white tabular-nums">{streak}</span>
            <span className="text-[9px] text-white/40 uppercase tracking-widest">days</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-pale-gold" />
            <span className="text-xs font-bold text-white tabular-nums">{points.toLocaleString()}</span>
            <span className="text-[9px] text-white/40 uppercase tracking-widest">pts</span>
          </div>
          <div className="w-px h-3 bg-white/20" />
          <span className="text-[9px] font-bold text-pale-gold/70 uppercase tracking-widest">{name.split(' ')[0]}</span>
        </motion.div>
      </div>

      {/* Legend button */}
      {onShowLegend && (
        <button
          onClick={onShowLegend}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/20 backdrop-blur-sm border border-white/15 flex items-center justify-center hover:bg-black/35 transition-all"
          title="Garden guide"
        >
          <HelpCircle size={14} className="text-white/70" />
        </button>
      )}
    </div>
  );
};
