import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anchor, Zap, Moon, Waves, Target, BookOpen, Wind, Music, ArrowRight, Leaf } from 'lucide-react';

type Feeling = 'grounded' | 'energized' | 'tired' | 'overwhelmed';
export type CheckInDestination = 'focus' | 'reflect' | 'breath' | 'soundscapes';

interface CheckInModalProps {
  isOpen: boolean;
  userName: string;
  onFeelingSaved: (mood: string, energy: number) => void;
  onNavigate: (dest: CheckInDestination) => void;
  onDismiss: () => void;
}

const FEELINGS: { id: Feeling; label: string; Icon: typeof Anchor }[] = [
  { id: 'grounded',    label: 'Grounded',    Icon: Anchor },
  { id: 'energized',   label: 'Energized',   Icon: Zap },
  { id: 'tired',       label: 'Tired',       Icon: Moon },
  { id: 'overwhelmed', label: 'Overwhelmed', Icon: Waves },
];

const RESPONSES: Record<Feeling, {
  message: string;
  boldPhrase: string;
  Icon: typeof Target;
  title: string;
  sub: string;
  cta: string;
  dest: CheckInDestination;
  mood: string;
  energy: number;
}> = {
  grounded: {
    message: "That's the foundation everything else is built on.",
    boldPhrase: "You're in a good place right now",
    Icon: Target,
    title: 'Set a focus for the afternoon',
    sub: '2 min · Add one intention',
    cta: 'Add intention',
    dest: 'focus',
    mood: 'Calm',
    energy: 4,
  },
  energized: {
    message: "You've been consistent and it's showing. Want to channel it somewhere before the afternoon winds down?",
    boldPhrase: 'That energy is real.',
    Icon: BookOpen,
    title: 'Quick journal entry',
    sub: '3 min · Capture the momentum',
    cta: 'Open journal',
    dest: 'reflect',
    mood: 'Energetic',
    energy: 5,
  },
  tired: {
    message: "You've been giving a lot today. That's worth acknowledging.",
    boldPhrase: "Let's take two minutes",
    Icon: Wind,
    title: 'Box Breathing',
    sub: '2 min · Reset your system',
    cta: 'Start breathing',
    dest: 'breath',
    mood: 'Tired',
    energy: 2,
  },
  overwhelmed: {
    message: "That feeling is information, not a verdict.",
    boldPhrase: "Let's slow it down for just a moment",
    Icon: Music,
    title: 'Stabilize with Soundscapes',
    sub: '5 min · Calm the noise',
    cta: 'Play soundscape',
    dest: 'soundscapes',
    mood: 'Stressed',
    energy: 2,
  },
};

export function CheckInModal({ isOpen, userName, onFeelingSaved, onNavigate, onDismiss }: CheckInModalProps) {
  const [selected, setSelected] = useState<Feeling | null>(null);
  const [stage, setStage] = useState<'question' | 'response'>('question');

  const firstName = userName?.split(' ')[0] || 'there';

  const timeOfDay = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }, []);

  const handleSelect = (feeling: Feeling) => {
    setSelected(feeling);
    const r = RESPONSES[feeling];
    onFeelingSaved(r.mood, r.energy);
    setTimeout(() => setStage('response'), 340);
  };

  const handleNavigate = () => {
    if (!selected) return;
    onNavigate(RESPONSES[selected].dest);
    handleClose();
  };

  const handleClose = () => {
    onDismiss();
    // Reset after sheet animates out
    setTimeout(() => { setSelected(null); setStage('question'); }, 500);
  };

  const response = selected ? RESPONSES[selected] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[80]"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={handleClose}
          />

          {/* Bottom sheet */}
          <motion.div
            key="sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[81] overflow-hidden"
            style={{
              borderRadius: '32px 32px 0 0',
              background: '#1E3A28',
              maxWidth: 480,
              margin: '0 auto',
              paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
            }}
          >
            {/* Decorative ring art */}
            <svg
              aria-hidden
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
              viewBox="0 0 400 560"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="xMidYMid slice"
            >
              <circle cx="420" cy="50"  r="230" fill="none" stroke="#C96A3A" strokeWidth="58" />
              <circle cx="420" cy="50"  r="165" fill="none" stroke="#D4B882" strokeWidth="1.5" />
              <circle cx="-20" cy="30"  r="180" fill="none" stroke="#4A7050" strokeWidth="52" />
              <circle cx="-20" cy="30"  r="118" fill="none" stroke="#7AAD80" strokeWidth="1.5" />
            </svg>

            <div style={{ position: 'relative', zIndex: 1, padding: '28px 24px 0' }}>
              {/* Handle */}
              <div style={{ width: 40, height: 4, background: '#4A7050', borderRadius: 99, margin: '0 auto 28px' }} />

              {/* Coach row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 13,
                  background: '#2A4E34', border: '1.5px solid #D4B882',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Leaf size={18} color="#D4B882" />
                </div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#D4B882' }}>
                  Palante Coach
                </span>
              </div>

              {/* Stage: question */}
              <AnimatePresence mode="wait">
                {stage === 'question' && (
                  <motion.div
                    key="question"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: '#FAF7F3', lineHeight: 1.3, letterSpacing: '-0.02em', marginBottom: 26 }}>
                      Hey {firstName}, how are you holding up this {timeOfDay}?
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {FEELINGS.map(({ id, label, Icon }) => (
                        <button
                          key={id}
                          onClick={() => handleSelect(id)}
                          style={{
                            padding: '15px 14px',
                            borderRadius: 18,
                            border: `1.5px solid ${selected === id ? '#C96A3A' : '#3A5E42'}`,
                            background: selected === id ? '#C96A3A' : '#243E2C',
                            color: '#FAF7F3',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: 14,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            transition: 'all 0.2s ease',
                            boxShadow: selected === id ? '0 0 22px rgba(201,106,58,0.45)' : 'none',
                            WebkitTapHighlightColor: 'transparent',
                          }}
                        >
                          <Icon size={18} color={selected === id ? '#E5D6A7' : '#7AAD80'} />
                          {label}
                        </button>
                      ))}
                    </div>

                    <button onClick={handleClose} style={{ display: 'block', width: '100%', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#4A7050', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                      Maybe later
                    </button>
                  </motion.div>
                )}

                {/* Stage: response */}
                {stage === 'response' && response && (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
                  >
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 15, color: '#C8E0CA', lineHeight: 1.65 }}>
                      <strong style={{ color: '#FAF7F3', fontWeight: 700 }}>{response.boldPhrase}</strong>{' '}
                      {response.message}
                    </p>

                    {/* Suggestion card */}
                    <button
                      onClick={handleNavigate}
                      style={{
                        borderRadius: 20,
                        background: '#243E2C',
                        border: '1.5px solid #D4B882',
                        padding: 18,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        cursor: 'pointer',
                        width: '100%',
                        textAlign: 'left',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      <div style={{ width: 50, height: 50, borderRadius: 15, background: '#C96A3A', border: '1.5px solid #D4845A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <response.Icon size={24} color="#FAF7F3" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, color: '#FAF7F3', marginBottom: 3 }}>{response.title}</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 500, color: '#D4B882' }}>{response.sub}</div>
                      </div>
                      <ArrowRight size={18} color="#C96A3A" />
                    </button>

                    {/* CTA */}
                    <button
                      onClick={handleNavigate}
                      style={{
                        width: '100%', padding: 17, borderRadius: 18, background: '#C96A3A', border: 'none',
                        color: '#FAF7F3', fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 16,
                        cursor: 'pointer', boxShadow: '0 4px 24px rgba(201,106,58,0.45)',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {response.cta}
                    </button>

                    <button onClick={handleClose} style={{ display: 'block', width: '100%', textAlign: 'center', fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#4A7050', background: 'none', border: 'none', cursor: 'pointer', padding: 8 }}>
                      I'm good, thanks
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
