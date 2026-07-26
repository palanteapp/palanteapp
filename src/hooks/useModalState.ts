import { useState } from 'react';

/**
 * Centralizes all boolean modal open/close state from AppContent.
 * Each modal has a show flag and a setter: consumed via destructuring.
 */
export const useModalState = () => {
    const [showProfile, setShowProfile] = useState(false);
    const [showKoiPond, setShowKoiPond] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [showWelcome, setShowWelcome] = useState(
        () => localStorage.getItem('palante_onboarding_completed') !== 'true'
    );
    const [showSoundMixer, setShowSoundMixer] = useState(false);
    const [mixerSource, setMixerSource] = useState<'meditation' | 'dashboard'>('dashboard');
    const [showMorningPractice, setShowMorningPractice] = useState(false);
    const [showMorningMode, setShowMorningMode] = useState(false);
    const [showLetterWrite, setShowLetterWrite] = useState(false);
    const [showLetterRead, setShowLetterRead] = useState(false);
    const [showHomeCoachSettings, setShowHomeCoachSettings] = useState(false);
    const [showWelcomeOrientation, setShowWelcomeOrientation] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [showWeeklyReport, setShowWeeklyReport] = useState(false);

    return {
        showProfile, setShowProfile,
        showKoiPond, setShowKoiPond,
        showHistory, setShowHistory,
        showWelcome, setShowWelcome,
        showSoundMixer, setShowSoundMixer,
        mixerSource, setMixerSource,
        showMorningPractice, setShowMorningPractice,
        showMorningMode, setShowMorningMode,
        showLetterWrite, setShowLetterWrite,
        showLetterRead, setShowLetterRead,
        showHomeCoachSettings, setShowHomeCoachSettings,
        showWelcomeOrientation, setShowWelcomeOrientation,
        showCelebration, setShowCelebration,
        showWeeklyReport, setShowWeeklyReport,
    };
};
