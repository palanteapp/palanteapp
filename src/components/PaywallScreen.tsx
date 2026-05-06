import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Leaf, Sparkles, X } from 'lucide-react';
import { useSubscription } from '../contexts/SubscriptionContext';

const FEATURES = [
  'Daily morning & evening practices',
  'Mandala of Growth — watch your practice bloom',
  'AI coach guidance & reflections',
  'Soundscapes, breathing & meditation',
  'Streak tracking & weekly insights',
  'Village accountability partners',
];

interface PaywallScreenProps {
  onDismiss?: () => void;
}

export function PaywallScreen({ onDismiss }: PaywallScreenProps) {
  const { purchaseMonthly, purchaseAnnual, restorePurchases } = useSubscription();
  const [loading, setLoading] = useState<'monthly' | 'annual' | 'restore' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (type: 'monthly' | 'annual') => {
    setError(null);
    setLoading(type);
    const result = type === 'annual' ? await purchaseAnnual() : await purchaseMonthly();
    setLoading(null);
    if (result.error) setError(result.error);
  };

  const handleRestore = async () => {
    setError(null);
    setLoading('restore');
    const result = await restorePurchases();
    setLoading(null);
    if (result.error) setError(result.error);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'linear-gradient(160deg, #415D43 0%, #2A3D2C 100%)' }}
    >
      {/* Grain overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.03] pointer-events-none" aria-hidden>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>

      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-12 right-5 z-10 p-2 rounded-full"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          aria-label="Close"
        >
          <X size={18} color="#FAF7F3" />
        </button>
      )}

      <div className="flex-1 overflow-y-auto px-6 pt-16 pb-8">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(212,184,130,0.12)', border: '1px solid rgba(212,184,130,0.35)' }}>
              <Leaf size={28} color="#D4B882" />
            </div>
          </div>
          <h1
            className="text-3xl mb-2"
            style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#FAF7F3', letterSpacing: '-0.02em' }}
          >
            Keep going. Stay Palante.
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, color: 'rgba(250,247,243,0.65)', fontSize: '15px' }}>
            7 days free, then choose your plan.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-5 mb-6"
          style={{ background: 'rgba(250,247,243,0.06)', border: '1px solid rgba(212,184,130,0.2)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} color="#D4B882" />
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#D4B882', fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Everything included
            </span>
          </div>
          <ul className="space-y-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <Check size={15} color="#D4B882" strokeWidth={2.5} />
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, color: 'rgba(250,247,243,0.85)', fontSize: '14px' }}>
                  {f}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Annual CTA — primary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-3"
        >
          <div
            className="text-center mb-2 px-3 py-1 rounded-full inline-flex mx-auto"
            style={{ background: 'rgba(201,106,58,0.15)', border: '1px solid rgba(201,106,58,0.3)', display: 'flex', justifyContent: 'center' }}
          >
            <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#C96A3A', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Best value — save 50%
            </span>
          </div>
          <button
            onClick={() => handle('annual')}
            disabled={loading !== null}
            className="w-full rounded-2xl py-4 px-6 flex items-center justify-between transition-opacity"
            style={{
              background: loading === 'annual' ? 'rgba(201,106,58,0.7)' : '#C96A3A',
              opacity: loading !== null && loading !== 'annual' ? 0.5 : 1,
            }}
          >
            <div className="text-left">
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, color: '#FAF7F3', fontSize: '17px' }}>
                {loading === 'annual' ? 'Starting trial…' : 'Annual — $59.99/year'}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, color: 'rgba(250,247,243,0.8)', fontSize: '13px' }}>
                Just $4.99/month
              </div>
            </div>
            <div
              className="rounded-xl px-3 py-1"
              style={{ background: 'rgba(0,0,0,0.2)' }}
            >
              <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 600, color: '#FAF7F3', fontSize: '12px' }}>
                7 days free
              </span>
            </div>
          </button>
        </motion.div>

        {/* Monthly CTA — secondary */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mb-5"
        >
          <button
            onClick={() => handle('monthly')}
            disabled={loading !== null}
            className="w-full rounded-2xl py-4 px-6 flex items-center justify-between transition-opacity"
            style={{
              background: 'transparent',
              border: '1.5px solid rgba(87,99,85,0.7)',
              opacity: loading !== null && loading !== 'monthly' ? 0.5 : 1,
            }}
          >
            <div className="text-left">
              <div style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#FAF7F3', fontSize: '17px' }}>
                {loading === 'monthly' ? 'Starting trial…' : 'Monthly — $9.99/month'}
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, color: 'rgba(250,247,243,0.6)', fontSize: '13px' }}>
                7 days free · cancel anytime
              </div>
            </div>
          </button>
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4"
            style={{ fontFamily: 'Inter, sans-serif', color: '#E57373', fontSize: '13px' }}
          >
            {error}
          </motion.p>
        )}

        {/* Fine print */}
        <div className="text-center space-y-3">
          <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 400, color: 'rgba(250,247,243,0.4)', fontSize: '12px', lineHeight: 1.5 }}>
            Cancel anytime before day 7 — no charge, no hassle.{'\n'}
            Billed through Apple. Subscription renews automatically.
          </p>
          <button
            onClick={handleRestore}
            disabled={loading !== null}
            style={{ fontFamily: 'Inter, sans-serif', fontWeight: 500, color: 'rgba(250,247,243,0.45)', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {loading === 'restore' ? 'Restoring…' : 'Restore purchases'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
