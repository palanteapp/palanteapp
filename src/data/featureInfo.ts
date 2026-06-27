// Centralized feature information content
// This ensures consistency across the app and makes content updates easy

export interface FeatureInfo {
    howToUse: {
        title: string;
        description: string;
        steps: string[];
        tips?: string[];
    };
    theScience?: {
        title: string;
        overview: string;
        benefits: string[];
        research?: string;
    };
}

export const FEATURE_INFO: Record<string, FeatureInfo> = {
    breathwork: {
        howToUse: {
            title: "Master Your Breath, Master Your State",
            description: "Breathwork Station offers scientifically-designed breathing patterns to help you energize, relax, or find balance - all through the power of controlled breathing.",
            steps: [
                "Choose your desired state: Energy, Relax, or Balance",
                "Find a comfortable seated or lying position",
                "Follow the visual guide and breathe in sync with the animation",
                "Continue for the recommended duration (3-10 minutes)",
                "Notice the shift in your mental and physical state"
            ],
            tips: [
                "Practice in a quiet space free from distractions",
                "Use headphones with soundscapes for deeper immersion",
                "Start with Balance breathing if you're new to breathwork",
                "Practice Energy breathing in the morning, Relax breathing before bed"
            ]
        },
        theScience: {
            title: "How Breath Controls Your Nervous System",
            overview: "Controlled breathing directly influences your autonomic nervous system, allowing you to consciously shift between states of alertness and relaxation through vagal nerve stimulation.",
            benefits: [
                "Rapid stress reduction through parasympathetic activation",
                "Improved focus and mental clarity via increased oxygen delivery",
                "Better sleep quality through relaxation response triggering",
                "Reduced anxiety and cortisol levels",
                "Enhanced emotional regulation and resilience",
                "Improved cardiovascular health and HRV (heart rate variability)"
            ],
            research: "Research from Stanford's Huberman Lab shows that specific breathing patterns can rapidly shift physiological states. Box breathing is used by Navy SEALs for stress management, while 4-7-8 breathing activates the parasympathetic nervous system for deep relaxation."
        }
    },

    koiPond: {
        howToUse: {
            title: "Your Digital Oasis",
            description: "Koi Pond is a meditative micro-break tool designed to calm your mind and reset your nervous system through gentle interaction and natural beauty.",
            steps: [
                "Tap the Koi Pond icon whenever you need a mental reset",
                "Watch the koi swim peacefully across the pond",
                "Tap the water to create ripples and feed the fish",
                "Observe the lily pads, lotus flowers, and gentle rain",
                "Take slow, deep breaths and let your mind settle"
            ],
            tips: [
                "Use between deep work sessions as a 'palate cleanser' for your mind",
                "Combine with slow breathing for maximum relaxation",
                "Enable soundscapes for an immersive experience",
                "Even 60 seconds can significantly reduce stress hormones"
            ]
        },
        theScience: {
            title: "The Neuroscience of Micro-Breaks",
            overview: "Brief visual meditation and nature exposure trigger measurable reductions in cortisol and activation of the default mode network, essential for creativity and mental restoration.",
            benefits: [
                "Rapid cortisol reduction (stress hormone) within 60 seconds",
                "Activation of the parasympathetic 'rest and digest' system",
                "Improved focus and cognitive performance after breaks",
                "Enhanced creativity through default mode network activation",
                "Reduced mental fatigue and decision exhaustion",
                "Improved mood through dopamine and serotonin regulation"
            ],
            research: "Studies from the University of Michigan show that even brief nature exposure (including digital nature scenes) significantly reduces stress markers. Research on micro-breaks demonstrates that 60-second mental resets improve sustained attention and reduce cognitive fatigue."
        }
    },

    reflections: {
        howToUse: {
            title: "Process Your Day with Intention",
            description: "Daily Reflections help you extract wisdom from your experiences, celebrate wins, and identify growth opportunities through guided journaling.",
            steps: [
                "Set aside 5-10 minutes at the end of your day",
                "Answer the reflection prompts honestly and thoughtfully",
                "Celebrate your wins - no achievement is too small",
                "Identify one key lesson or insight from the day",
                "Note what you'll do differently tomorrow"
            ],
            tips: [
                "Write freely without self-editing - this is for you",
                "Focus on progress, not perfection",
                "Review past reflections weekly to see patterns and growth",
                "Use voice-to-text if typing feels like a barrier"
            ]
        },
        theScience: {
            title: "The Power of Reflective Practice",
            overview: "Structured reflection activates metacognition and consolidates learning, turning experiences into wisdom through deliberate processing and meaning-making.",
            benefits: [
                "Enhanced learning and memory consolidation",
                "Improved emotional regulation and self-awareness",
                "Greater sense of progress and accomplishment",
                "Reduced rumination and anxiety through structured processing",
                "Better decision-making through pattern recognition",
                "Increased gratitude and life satisfaction"
            ],
            research: "Harvard Business School research shows that 15 minutes of daily reflection improves performance by 23%. Journaling has been shown to reduce intrusive thoughts, improve working memory, and enhance psychological well-being in numerous clinical studies."
        }
    },

    momentum: {
        howToUse: {
            title: "Your Accountability Partner & Progress Tracker",
            description: "Momentum combines energy check-ins, focus management, and progress tracking to help you build sustainable habits and stay accountable to your goals.",
            steps: [
                "Start each session with an Energy Check-In to match tasks to your current state",
                "Add daily focus goals based on your energy level and priorities",
                "Check in with your partner for personalized guidance",
                "Track your progress and celebrate completed goals",
                "Review weekly insights to identify patterns and optimize your routine"
            ],
            tips: [
                "Be honest with your energy check-ins - they help match you with the right tasks",
                "Focus on 1-3 key goals per day rather than overwhelming yourself",
                "Use your partner for accountability, not just tracking",
                "Celebrate small wins - progress compounds over time",
                "Review weekly insights to spot your peak productivity windows"
            ]
        },
        theScience: {
            title: "The Psychology of Progress & Accountability",
            overview: "Combining energy awareness, goal tracking, and external accountability creates a powerful system for behavior change. Research shows that tracking progress and having an accountability partner significantly increases goal completion rates.",
            benefits: [
                "23% higher goal achievement with daily progress tracking",
                "Energy-matched task selection improves completion rates by 40%",
                "Accountability partnerships double your chances of success",
                "Visual progress tracking activates reward circuits in the brain",
                "Streak tracking leverages loss aversion to maintain consistency",
                "Weekly insights enable data-driven habit optimization"
            ],
            research: "Studies from the American Society of Training and Development show that having an accountability partner increases your chance of success by 95%. Research on energy management demonstrates that matching task difficulty to energy levels significantly improves both productivity and well-being."
        }
    },

    meditation: {
        howToUse: {
            title: "Guided Meditation Practice",
            description: "Meditation helps you cultivate inner stillness, reduce stress, and develop mindfulness through focused attention and intentional breathing.",
            steps: [
                "Set a clear intention for your practice (peace, clarity, focus, etc.)",
                "Choose your meditation duration (5-60 minutes)",
                "Find a comfortable seated position in a quiet space",
                "Focus on your breath and selected mantra",
                "When your mind wanders, gently return to your breath"
            ],
            tips: [
                "Start with shorter sessions (5-10 minutes) and gradually increase",
                "Practice at the same time each day to build consistency",
                "Use the mantra as an anchor when your mind drifts",
                "Don't judge yourself for wandering thoughts - it's normal",
                "Reflect on your practice afterward to deepen insights"
            ]
        },
        theScience: {
            title: "The Neuroscience of Meditation",
            overview: "Regular meditation practice physically changes your brain structure, increasing gray matter density in areas associated with learning, memory, emotional regulation, and perspective-taking.",
            benefits: [
                "Reduces activity in the default mode network (reduces mind-wandering)",
                "Increases gray matter in the prefrontal cortex (better decision-making)",
                "Strengthens the hippocampus (improved memory and learning)",
                "Decreases amygdala size (reduced stress and anxiety responses)",
                "Enhances connectivity between brain regions (better emotional regulation)",
                "Increases GABA and serotonin production (improved mood)"
            ],
            research: "Harvard neuroscientist Sara Lazar's research shows that just 8 weeks of meditation practice can measurably change brain structure. Studies from MIT and Stanford demonstrate that meditation improves attention span, reduces cortisol levels, and enhances overall well-being."
        }
    }
};
