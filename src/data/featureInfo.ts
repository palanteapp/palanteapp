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
            description: "Breathwork Station offers structured breathing patterns to help you energize, relax, or find balance, all through the pace and ratio of your own breath.",
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
            overview: "Controlled breathing is one of the few levers you have on your own autonomic nervous system. Changing the pace and ratio of your breath can shift you toward alertness or toward calm.",
            benefits: [
                "A body that settles faster than you can talk yourself calm",
                "Attention that sharpens once the breathing steadies",
                "An easier landing at the end of the day, for many people",
                "Less of the keyed-up feeling, without needing a reason for it",
                "A pause you can take anywhere, in front of anyone",
                "A steadier rhythm you can sometimes feel in your chest"
            ],
            research: "Paced breathing is among the more consistently studied self-regulation practices. Making your exhale longer than your inhale is associated with greater parasympathetic activity (the 'rest and digest' side of the nervous system), which is why slow-breathing protocols appear in both clinical anxiety work and high-stress occupational training. Effects differ from person to person, and this is not a treatment for any condition."
        }
    },

    koiPond: {
        howToUse: {
            title: "Your Digital Oasis",
            description: "Koi Pond is a meditative micro-break: somewhere to put your attention for a minute, with gentle interaction and something pleasant to look at.",
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
                "Even a minute of genuine pause is worth more than none"
            ]
        },
        theScience: {
            title: "Why Micro-Breaks Work",
            overview: "Short, deliberate pauses give attention a chance to recover. Nature imagery is one of the more reliable ways to make a brief pause feel restorative rather than like more screen time.",
            benefits: [
                "A deliberate pause in a stretch of focused work",
                "Slower breathing and a settled body, if you let it",
                "Attention that recovers instead of grinding down",
                "Less of the fatigue that builds across a long day",
                "A moment that is genuinely yours",
                "A gentler transition between demanding tasks"
            ],
            research: "Attention-restoration research links brief exposure to natural scenes (including images and video, not only time outdoors) with lower self-reported stress and better sustained attention afterward. Work on micro-breaks points the same direction: short pauses during demanding tasks tend to help more than pushing straight through. Reported effects are modest and vary by person."
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
                "The day sorted into something you can actually recall",
                "A clearer read on what you were feeling at the time",
                "Evidence of progress you would otherwise forget",
                "Fewer loops, because the thought is on the page instead of circling",
                "Patterns you only see once they are written down",
                "More of the good days noticed while they are still happening"
            ],
            research: "Reflective writing is one of the better-supported practices in this space. Expressive-writing studies associate it with fewer intrusive thoughts and freed-up working memory, and structured end-of-day reflection is linked to better consolidation of what you learned. Findings vary in strength, and none of this is a treatment for any condition."
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
            overview: "Energy awareness, visible progress, and another person who knows what you committed to are three of the most dependable ingredients in behavior change. None of them is complicated. Together they hold better than motivation does.",
            benefits: [
                "Progress you can see instead of guess at",
                "Tasks matched to the energy you actually have today",
                "A commitment someone else knows about",
                "Consistency that survives low-motivation days",
                "Patterns you would not notice week to week",
                "A record of showing up, not just intending to"
            ],
            research: "Making progress visible and sharing a goal with another person are both long-standing findings in behavior-change research: people follow through more often when they track and when someone else is aware of the commitment. How large that effect is depends heavily on the person, the goal, and the relationship. The specific percentages that circulate online are not well sourced, so we do not repeat them."
        }
    },

    meditation: {
        howToUse: {
            title: "Guided Meditation Practice",
            description: "Meditation is practice at holding your attention where you put it, and at noticing when it has wandered off, through focused attention and intentional breathing.",
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
            title: "What Meditation Practice Does",
            overview: "Meditation is attention training. You practice noticing where your mind went and bringing it back, and over weeks that noticing gets easier, in practice and outside of it.",
            benefits: [
                "Attention that wanders less, and returns faster when it does",
                "More space between a feeling and your reaction to it",
                "A calmer baseline on ordinary days",
                "Practice at noticing your own thoughts as thoughts",
                "Sleep that comes more easily for many people",
                "A reliable way to interrupt a spiraling day"
            ],
            research: "Mindfulness and meditation training have been studied extensively. Consistent practice over a period of weeks is associated with measurable gains in attention and emotional regulation, and some imaging work reports differences in brain regions tied to memory and stress response. The strength of these findings varies across studies, and meditation is not a substitute for professional care."
        }
    }
};
