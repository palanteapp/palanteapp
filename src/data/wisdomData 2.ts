
export interface WisdomPrinciple {
    id: string;
    title: string;
    kanji: string;
    meaning: string;
    description: string;
    science: string;
    howToUse: string;
    actionLabel: string;
    suggestions: string[];
}


export const WISDOM_PRINCIPLES: WisdomPrinciple[] = [
    {
        id: 'kaizen',
        title: 'Kaizen',
        kanji: '改善',
        meaning: 'Continuous Improvement',
        description: 'Start so small your brain can’t resist. One push-up. One sentence. One minute.',
        science: 'Harvard research shows tiny habits bypass mental resistance (amygdala hijack) and compound over time. Progress beats pressure.',
        howToUse: 'Set a 60-second timer for a task you’ve been avoiding. Commit to only that one minute. Usually, the momentum carries you further.',
        actionLabel: 'One Minute Rule',
        suggestions: ['One push-up', 'Write one sentence', 'Clear one email']
    },

    {
        id: 'ikigai',
        title: 'Ikigai',
        kanji: '生き甲斐',
        meaning: 'Reason to Wake Up',
        description: 'The Japanese don’t ask "What do you do?" They ask "Why do you get up?"',
        science: 'Studies on purpose (Harvard, longevity research) show meaning increases energy, reduces cortisol, and builds discipline.',
        howToUse: 'Identify one core reason for your action today. Write it down. When your "why" is clear, effort feels lighter.',
        actionLabel: 'Purpose Check',
        suggestions: ['Who am I helping today?', 'Why does this matter?', 'What is my win today?']
    },

    {
        id: 'hara-hachi-bu',
        title: 'Hara Hachi Bu',
        kanji: '腹八分目',
        meaning: 'Eat until 80% full',
        description: 'Overeating kills focus, mood, and drive. Stop before you are completely full.',
        science: 'Research links lighter digestion to better energy and mental clarity. Most "laziness" is actually physical overload or energy crashes.',
        howToUse: 'During your next meal or task, stop when you feel 80% satisfied. Notice the difference in your mental energy 30 minutes later.',
        actionLabel: '80% Rule',
        suggestions: ['Leave one bite on the plate', 'Drink a glass of water first', 'Stop eating before feeling full']
    },

    {
        id: 'anchored-focus',
        title: 'Anchored Focus',
        kanji: '集中',
        meaning: 'Condensed Concentration',
        description: '25 minutes work, 5 minutes rest. Add a physical ritual to trigger the state.',
        science: 'Neuroscience calls this Pavlovian conditioning. A specific gesture or breath signal tells the brain: "this signal = focus."',
        howToUse: 'Before starting a 25-minute sprint, perform a specific ritual: 3 deep breaths, a specific sound, or a hand gesture.',
        actionLabel: 'Start Sprint',
        suggestions: ['25m Deep Work', '25m Passion Sprint', '25m Writing Blast']
    },

    {
        id: 'seiri-seiton',
        title: 'Seiri & Seiton',
        kanji: '整理•整頓',
        meaning: 'Clear Space, Clear Mind',
        description: 'A messy room creates mental noise. Treat clutter like pollution.',
        science: 'Princeton studies show physical clutter competes for your attention, reducing focus and increasing stress hormones.',
        howToUse: 'Spend 2 minutes organizing your immediate physical environment. Clean space leads to clean action.',
        actionLabel: 'Clear Space',
        suggestions: ['Clean my desk', 'Organize desktop', 'Clear 5 items']
    },

    {
        id: 'kintsugi',
        title: 'Kintsugi',
        kanji: '金継ぎ',
        meaning: 'Golden Joinery',
        description: 'Laziness hides behind fear of failure. Flaws aren’t mistakes—they’re part of your progress.',
        science: 'Psychology shows completion builds momentum, not perfection. Finishing an imperfect task is better for the brain than an unfinished perfect one.',
        howToUse: 'Choose a "broken" project. Finish it today, intentionally leaving it imperfect. Adjust later; movement creates clarity.',
        actionLabel: 'Finish Imperfectly',
        suggestions: ['Submit "Good Enough" draft', 'Post that WIP', 'Accept the flaws']
    },

    {
        id: 'wabi-sabi',
        title: 'Wabi-Sabi',
        kanji: '侘寂',
        meaning: 'Imperfect Beauty',
        description: 'Don’t wait for ideal conditions. Move with what you have. Movement creates clarity.',
        science: 'Perfection delays action. Behavioral activation shows that the act of moving—even in flawed conditions—reduces procrastination.',
        howToUse: 'Take one action toward a goal right now with zero preparation. Use only the tools currently in front of you.',
        actionLabel: 'Act Now',
        suggestions: ['Start outline now', 'Open the project file', 'Take the first step']
    },

];
