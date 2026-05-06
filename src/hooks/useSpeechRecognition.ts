import { useState, useEffect, useCallback, useRef } from 'react';


export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [_error, _setError] = useState<string | null>(null);

    // Refs to track state across re-renders without triggering them
    const recognitionRef = useRef<{ stop: () => void } | null>(null);
    const finalTranscriptRef = useRef('');

    useEffect(() => {
        const recognition = recognitionRef.current;
        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        // Voice input not available in this build — do nothing silently
    }, []);

    const stopListening = useCallback(() => {
        // if (recognitionRef.current) {
        //     recognitionRef.current.stop();
        // }
        setIsListening(false);
    }, []);

    const resetTranscript = useCallback(() => {
        finalTranscriptRef.current = '';
        setTranscript('');
    }, []);

    return {
        isListening,
        transcript,
        startListening,
        stopListening,
        resetTranscript,
        isSupported: false, // Force false as per instruction
        error: 'Speech recognition is disabled.' // Dummy error
    };
};
