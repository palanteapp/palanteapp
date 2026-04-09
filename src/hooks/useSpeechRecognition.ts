/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback, useRef } from 'react';


export const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Refs to track state across re-renders without triggering them
    const recognitionRef = useRef<any>(null);
    const finalTranscriptRef = useRef('');

    // Check browser support
    const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const startListening = useCallback(() => {

        //         if (newFinal) {
        //             // Intelligent spacing
        //             const needsSpace = finalTranscriptRef.current && !finalTranscriptRef.current.endsWith(' ') && !newFinal.startsWith(' ');
        //             finalTranscriptRef.current += (needsSpace ? ' ' : '') + newFinal;
        //         }

        //         // Update visible transcript with both final and interim results
        //         // This ensures the user sees text appear immediately as they speak
        //         const currentFull = (finalTranscriptRef.current + ' ' + interimTranscript).trim();
        //         setTranscript(currentFull);
        //     };

        //     recognition.onerror = (event: any) => {
        //         console.error('Speech recognition error:', event.error);
        //         if (event.error === 'no-speech') return;
        //         setError(event.error);
        //         setIsListening(false);
        //     };

        setIsListening(true); // Simulate listening
        setTranscript('Speech recognition is disabled.');
        setError('Speech recognition is currently disabled.');
    }, [isSupported]);

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
