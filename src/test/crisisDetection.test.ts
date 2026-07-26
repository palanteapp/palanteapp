import { describe, it, expect } from 'vitest';
import { detectCrisisSignal } from '../utils/crisisDetection';

describe('detectCrisisSignal, active signals', () => {
    const active = [
        'i want to kill myself',
        'I want to KILL MYSELF',
        "i've been thinking about killing myself",
        'i am going to end my life',
        'thinking about taking my own life',
        'i just want to die',
        'i wanna die honestly',
        'i think everyone would be better off dead',
        'i feel suicidal today',
        'been thinking about suicide a lot',
        'i want to hurt myself',
        'im thinking about cutting myself',
        'i want to overdose',
        'there is no reason to live',
        'i have nothing to live for',
        "i don't want to wake up tomorrow",
    ];

    it.each(active)('flags %j as active', (text) => {
        const signal = detectCrisisSignal(text);
        expect(signal).not.toBeNull();
        expect(signal?.severity).toBe('active');
    });
});

describe('detectCrisisSignal, passive signals', () => {
    const passive = [
        'my family would be better off without me',
        'everyone would be happier without me',
        "i don't want to be here anymore",
        'im done with life',
        'im so tired of living',
        'i want to give up on life',
        "i can't go on anymore",
        'sometimes i wish i was never born',
    ];

    it.each(passive)('flags %j as passive', (text) => {
        const signal = detectCrisisSignal(text);
        expect(signal).not.toBeNull();
        expect(signal?.severity).toBe('passive');
    });
});

describe('detectCrisisSignal, everyday language must not fire', () => {
    const benign = [
        // Hyperbole sharing crisis vocabulary
        'im dying to see how this week goes',
        'i would kill for a nap right now',
        'this deadline is killing me',
        'my workout was killing me today',
        'you killed it out there',
        'im killing it at work lately',
        'i was dead tired after the shift',
        'im dead serious about this goal',
        'that would be career suicide',
        'i volunteer at a suicide prevention line',
        'i watched suicide squad last night',
        'i ran 5 kms this morning',
        'i did 10 kms on the bike',

        // Ordinary distress that is NOT ideation: these should stay quiet
        'i am so stressed out today',
        'work has been really hard lately',
        'i feel exhausted and unmotivated',
        'i had a fight with my brother',
        'i hurt myself lifting weights yesterday',
        'my back is killing me from the gym',
        'i cant do this anymore, this project is too much',
        'im feeling really down today',
        'i failed my exam and i feel awful',

        // Empty / junk
        '',
        '   ',
        '!!!???',
    ];

    it.each(benign)('stays silent on %j', (text) => {
        expect(detectCrisisSignal(text)).toBeNull();
    });
});

describe('detectCrisisSignal, Spanish active signals', () => {
    const active = [
        'quiero morir',
        'quiero estar muerta',
        'mejor muerto que seguir asi',
        'me siento suicida hoy',
        'he pensado en cometer suicidio',
        'llevo tiempo pensando en el suicidio',
        'quiero suicidarme',
        'me quiero suicidar',
        'quiero matarme',
        'me quiero matar',
        'quiero hacerme daño',
        'no quiero seguir viviendo',
        'no tengo razón para vivir',
        'no tengo nada por lo que vivir',
        'no quiero despertar mañana',
        'quiero acabar con mi vida',
        'quiero quitarme la vida',
    ];

    it.each(active)('flags %j as active', (text) => {
        const signal = detectCrisisSignal(text);
        expect(signal).not.toBeNull();
        expect(signal?.severity).toBe('active');
    });
});

describe('detectCrisisSignal, Spanish passive signals', () => {
    const passive = [
        'mi familia estaría mejor sin mí',
        'todos serían más felices sin mí',
        'ya no quiero estar aquí',
        'estoy tan cansada de vivir',
        'estoy harto de la vida',
        'no puedo más con la vida',
        'quiero renunciar a la vida',
        'ojalá nunca hubiera nacido',
        'nadie se daría cuenta si yo desapareciera',
    ];

    it.each(passive)('flags %j as passive', (text) => {
        const signal = detectCrisisSignal(text);
        expect(signal).not.toBeNull();
        expect(signal?.severity).toBe('passive');
    });
});

describe('detectCrisisSignal, Spanish everyday language must not fire', () => {
    const benign = [
        // Hyperbole sharing crisis vocabulary
        'me muero de ganas de verte',
        'esto me está matando con este calor',
        'lo mataste en el escenario',
        'estoy muerta de risa con este meme',
        'tengo un cansancio mortal hoy',
        'eso sería un suicidio profesional',
        'corrí 5 kms esta mañana',

        // Ordinary distress that is NOT ideation: these should stay quiet
        'estoy muy estresada hoy',
        'el trabajo ha sido muy difícil últimamente',
        'me siento agotada y sin motivación',
        'tuve una pelea con mi hermano',
        'me lastimé haciendo ejercicio ayer',
        'no puedo más con este proyecto, es demasiado',
        'me siento muy triste hoy',
    ];

    it.each(benign)('stays silent on %j', (text) => {
        expect(detectCrisisSignal(text)).toBeNull();
    });
});

describe('detectCrisisSignal, bilingual coverage does not depend on a language toggle', () => {
    it('flags a Spanish crisis phrase even without any app-language setting involved', () => {
        expect(detectCrisisSignal('quiero matarme')?.severity).toBe('active');
    });

    it('flags an English crisis phrase alongside Spanish coverage in the same detector', () => {
        expect(detectCrisisSignal('i want to kill myself')?.severity).toBe('active');
    });
});

describe('detectCrisisSignal, robustness', () => {
    it('handles punctuation and curly apostrophes', () => {
        expect(detectCrisisSignal("I don’t want to be here anymore...")).not.toBeNull();
    });

    it('handles accented input', () => {
        expect(detectCrisisSignal('i wánt to díe')).not.toBeNull();
    });

    it('finds the signal inside a longer message', () => {
        const text =
            'today was fine at work, the meeting went ok, but honestly i keep thinking about killing myself and i dont know what to do';
        expect(detectCrisisSignal(text)?.severity).toBe('active');
    });

    it('prefers active over passive when both appear', () => {
        const text = "everyone would be better off without me, i want to die";
        expect(detectCrisisSignal(text)?.severity).toBe('active');
    });

    it('never throws on non-string input', () => {
        // @ts-expect-error, guarding runtime callers that lose types
        expect(detectCrisisSignal(null)).toBeNull();
        // @ts-expect-error, guarding runtime callers that lose types
        expect(detectCrisisSignal(undefined)).toBeNull();
        // @ts-expect-error, guarding runtime callers that lose types
        expect(detectCrisisSignal(42)).toBeNull();
    });

    it('is stable across repeated calls (no regex lastIndex leakage)', () => {
        const text = 'i want to kill myself';
        expect(detectCrisisSignal(text)?.severity).toBe('active');
        expect(detectCrisisSignal(text)?.severity).toBe('active');
        expect(detectCrisisSignal(text)?.severity).toBe('active');
    });
});
