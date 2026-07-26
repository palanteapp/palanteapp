import { Phone, MessageSquare, X } from 'lucide-react';
import { haptics } from '../utils/haptics';
import type { CrisisSeverity } from '../utils/crisisDetection';
import type { AppLanguage } from '../types';

/**
 * Surfaced by a deterministic keyword tripwire (utils/crisisDetection), not by the
 * model. It appears whether or not the partner's reply mentions getting help, and it
 * stays until the person dismisses it.
 *
 * Deliberately parchment on a dark chat: this should be the most visible thing on
 * the screen when it appears.
 *
 * tel: and sms: are plain anchors so iOS hands them to the system dialer and Messages.
 * Routing them through @capacitor/browser would open an in-app web view instead.
 */

interface CrisisResourceCardProps {
    severity: CrisisSeverity;
    partnerName: string;
    onDismiss: () => void;
    language?: AppLanguage;
}

export function CrisisResourceCard({ severity, partnerName, onDismiss, language = 'en' }: CrisisResourceCardProps) {
    const isEs = language === 'es';

    const heading = isEs
        ? (severity === 'active' ? 'Por favor, habla con alguien ahora mismo' : 'No tienes que cargar con esto sola')
        : (severity === 'active' ? 'Please talk to someone right now' : "You don't have to carry this alone");

    const body = isEs
        ? (severity === 'active'
            ? `Lo que acabas de escribir importa, y es más grande de lo que ${partnerName} puede sostener. Hay personas capacitadas exactamente para esto, disponibles ahora mismo, gratis y confidencial.`
            : `${partnerName} está aquí para ti, pero no sustituye a una persona real. Si hoy pesa más de lo usual, hablar con alguien vale la pena.`)
        : (severity === 'active'
            ? `What you just wrote matters, and it's bigger than what ${partnerName} can hold. There are people trained for exactly this, available right now, free and confidential.`
            : `${partnerName} is here for you, but not as a substitute for a person. If today is heavier than usual, talking to someone real is worth it.`);

    return (
        <div
            role="alert"
            aria-live="assertive"
            className="max-w-xl mx-auto my-5 rounded-2xl overflow-hidden"
            style={{
                background: '#FAF7F3',
                border: '1px solid rgba(212,184,130,0.5)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            }}
        >
            <div className="px-5 pt-5 pb-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                    <h3
                        style={{
                            fontFamily: 'Poppins, sans-serif',
                            fontWeight: 700,
                            color: '#2D3E33',
                            fontSize: '17px',
                            lineHeight: 1.3,
                            letterSpacing: '-0.01em',
                        }}
                    >
                        {heading}
                    </h3>
                    <button
                        onClick={() => { haptics.selection(); onDismiss(); }}
                        aria-label={isEs ? 'Cerrar recursos de apoyo' : 'Dismiss support resources'}
                        className="flex-shrink-0 -mt-1 -mr-1 p-1.5 rounded-full transition-colors hover:bg-black/5"
                    >
                        <X size={16} color="rgba(45,62,51,0.4)" />
                    </button>
                </div>

                <p
                    style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        color: 'rgba(45,62,51,0.75)',
                        fontSize: '13.5px',
                        lineHeight: 1.55,
                    }}
                >
                    {body}
                </p>
            </div>

            <div className="px-5 pb-5 space-y-2.5">
                <a
                    href="tel:988"
                    onClick={() => haptics.medium()}
                    className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl transition-opacity active:opacity-80"
                    style={{ background: '#C96A3A' }}
                >
                    <Phone size={16} color="#FAF7F3" strokeWidth={2.5} />
                    <span
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 600,
                            color: '#FAF7F3',
                            fontSize: '14.5px',
                        }}
                    >
                        {isEs ? 'Llama al 988: Línea de Crisis y Prevención del Suicidio' : 'Call 988: Suicide & Crisis Lifeline'}
                    </span>
                </a>
                {isEs && (
                    <p
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 400,
                            color: 'rgba(45,62,51,0.45)',
                            fontSize: '11px',
                            lineHeight: 1.4,
                            textAlign: 'center',
                            marginTop: -6,
                        }}
                    >
                        Presiona 2 para español.
                    </p>
                )}

                <a
                    href="sms:741741&body=HOME"
                    onClick={() => haptics.light()}
                    className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl transition-colors active:bg-black/10"
                    style={{ border: '1px solid rgba(45,62,51,0.18)' }}
                >
                    <MessageSquare size={15} color="rgba(45,62,51,0.6)" strokeWidth={2} />
                    <span
                        style={{
                            fontFamily: 'Inter, sans-serif',
                            fontWeight: 500,
                            color: 'rgba(45,62,51,0.75)',
                            fontSize: '13.5px',
                        }}
                    >
                        Text HOME to 741741
                    </span>
                </a>

                <p
                    style={{
                        fontFamily: 'Inter, sans-serif',
                        fontWeight: 400,
                        color: 'rgba(45,62,51,0.45)',
                        fontSize: '11px',
                        lineHeight: 1.5,
                        textAlign: 'center',
                        paddingTop: 4,
                    }}
                >
                    {isEs
                        ? 'Gratis, confidencial, 24/7. Si estás en peligro inmediato, llama al 911.'
                        : 'Free, confidential, 24/7. If you are in immediate danger, call 911.'}
                </p>
            </div>
        </div>
    );
}
