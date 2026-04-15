export interface ScienceFact {
    id: string;
    category: 'Breath' | 'Meditation' | 'Reflect' | 'Energy' | 'Productivity' | 'Coach' | 'Fasting';
    fact: string;
    source?: string;
}

export const SCIENCE_FACTS: ScienceFact[] = [
    // Breathwork
    {
        id: 'breath-nitric-oxide',
        category: 'Breath',
        fact: "Nasal breathing hums with health benefits! It significantly boosts the production of Nitric Oxide, a molecule that dilates blood vessels, improves oxygen circulation, and strengthens your immune system."
    },
    {
        id: 'breath-exhale',
        category: 'Breath',
        fact: "Extending your exhale longer than your inhale triggers the vagus nerve to activate your parasympathetic nervous system, instantly lowering your heart rate and reducing stress."
    },
    {
        id: 'breath-coherence',
        category: 'Breath',
        fact: "Coherent breathing (balancing inhale and exhale) synchronizes your heart rate variability (HRV) with your breath, putting your brain and heart in a state of peak efficiency and emotional stability."
    },

    // Meditation
    {
        id: 'meditation-gray-matter',
        category: 'Meditation',
        fact: "Just 8 weeks of daily meditation can increase gray matter density in the hippocampus, the brain area responsible for learning, memory, and emotional regulation."
    },
    {
        id: 'meditation-amygdala',
        category: 'Meditation',
        fact: "Regular meditation shrinks the amygdala, the brain's 'fight or flight' center, making you physically less reactive to stress and anxiety over time."
    },
    {
        id: 'meditation-focus',
        category: 'Meditation',
        fact: "Mindfulness training improves the brain's ability to filter out distractions, measurably enhancing cognitive control and focus stamina in as little as 4 days."
    },

    // Reflection / Journaling
    {
        id: 'reflect-labeling',
        category: 'Reflect',
        fact: "'Affect Labeling'—putting your feelings into words—has been shown to dampen the response of the amygdala, literally calming your brain's emotional alarm system."
    },
    {
        id: 'reflect-gratitude',
        category: 'Reflect',
        fact: "Writing down three things you're grateful for releases dopamine and serotonin, rewiring your brain to scan the world for positives rather than threats."
    },
    {
        id: 'reflect-clarity',
        category: 'Reflect',
        fact: "Expressive writing about stressful events improves working memory and frees up cognitive resources that were previously tied up in suppressing negative emotions."
    },

    // Energy
    {
        id: 'energy-ultradian',
        category: 'Energy',
        fact: "Human energy naturally fluctuates in 90-120 minute cycles called 'ultradian rhythms'. A dip in energy is often just a biological signal to take a restorative break, not a failure of willpower."
    },
    {
        id: 'energy-rest',
        category: 'Energy',
        fact: "Strategic rest (like a 20-minute nap or non-sleep deep rest) can restore alertness and learning capacity more effectively than caffeine by clearing adenosine from the brain."
    },
    {
        id: 'energy-decisions',
        category: 'Energy',
        fact: "Decision fatigue is real. Your brain has a finite daily supply of executive function. Tracking your energy helps you match high-focus tasks to your peak biological windows."
    },

    // Productivity (Goal Setting / Focus)
    {
        id: 'prod-goals',
        category: 'Productivity',
        fact: "Writing down your goals increases the likelihood of achieving them by 42% (Dominican University Study)."
    },
    {
        id: 'prod-zeigarnik',
        category: 'Productivity',
        fact: "The Zeigarnik Effect: Your brain remembers uncompleted tasks better than completed ones. Writing them down clears mental RAM."
    },
    {
        id: 'prod-dopamine',
        category: 'Productivity',
        fact: "Checking off a task releases dopamine, the brain's 'reward' chemical, motivating you to repeat the behavior."
    },
    {
        id: 'prod-micro',
        category: 'Productivity',
        fact: "Breaking big goals into micro-tasks reduces procrastination by lowering the brain's 'threat' response."
    },
    {
        id: 'prod-singletask',
        category: 'Productivity',
        fact: "Single-tasking is 50% more efficient than multitasking, which actually lowers functional IQ during the task."
    },
    {
        id: 'prod-2min',
        category: 'Productivity',
        fact: "The '2-Minute Rule': If a task takes less than 2 minutes, do it immediately. This prevents mental clutter."
    },
    {
        id: 'prod-decision',
        category: 'Productivity',
        fact: "Decision fatigue is real. Planning your day the night before saves mental energy for high-value work in the morning."
    },
    {
        id: 'prod-parkinson',
        category: 'Productivity',
        fact: "Parkinson's Law: Work expands to fill the time available for its completion. Set shorter deadlines to increase focus."
    },
    {
        id: 'prod-flow',
        category: 'Productivity',
        fact: "Flow state requires about 15-20 minutes of uninterrupted focus to achieve. Protect your deep work time."
    },
    {
        id: 'prod-visualize',
        category: 'Productivity',
        fact: "Visualizing the process (the steps) is actually more effective than visualizing the outcome alone (UCLA Study)."
    },
    {
        id: 'prod-pomodoro',
        category: 'Productivity',
        fact: "The 'Pomodoro Technique' works because it aligns with your body's ultradian rhythms of focus and rest."
    },
    {
        id: 'prod-accountability',
        category: 'Productivity',
        fact: "Accountability increases goal success rates to 65%. With specific appointments, it rises to 95% (ASTD Study)."
    },
    {
        id: 'prod-frog',
        category: 'Productivity',
        fact: "Willpower is a depletable resource. Tackle your hardest task first thing in the morning ('Eat the Frog')."
    },
    {
        id: 'prod-batching',
        category: 'Productivity',
        fact: "Batching similar tasks (like email or calls) reduces the 'switching cost' that drains mental energy."
    },
    {
        id: 'prod-environment',
        category: 'Productivity',
        fact: "A clean workspace improves focus. Visual clutter competes for your attention limits (Princeton Neuroscience)."
    },
    {
        id: 'prod-breaks',
        category: 'Productivity',
        fact: "Regular breaks prevent 'decision fatigue' and sustain performance throughout the day (University of Illinois)."
    },
    {
        id: 'prod-cant',
        category: 'Productivity',
        fact: "Saying 'I don't' instead of 'I can't' when declining distractions empowers you and improves self-control."
    },
    {
        id: 'prod-progress',
        category: 'Productivity',
        fact: "Tracking progress is a key motivator. Seeing how far you've come releases serotonin (The Progress Principle)."
    },
    {
        id: 'prod-perfectionism',
        category: 'Productivity',
        fact: "Perfectionism is the enemy of done. 'Good enough' allows you to maintain momentum."
    },

    // Fasting
    {
        id: 'fast-autophagy',
        category: 'Fasting',
        fact: "Autophagy (literally 'self-eating') kicks in around 24 hours of fasting, where your cells recycle old, damaged components for deeper cellular repair."
    },
    {
        id: 'fast-hgh',
        category: 'Fasting',
        fact: "Fasting can spike Human Growth Hormone by up to 500%, preserving muscle mass and promoting fat metabolism."
    },
    {
        id: 'fast-insulin',
        category: 'Fasting',
        fact: "Intermittent fasting significantly lowers insulin levels, reversing insulin resistance and facilitating effective fat burning."
    },
    {
        id: 'fast-brain-growth',
        category: 'Fasting',
        fact: "Fasting increases BDNF (Brain-Derived Neurotrophic Factor), a protein that supports the survival of existing neurons and encourages the growth of new ones."
    },
    {
        id: 'fast-clarity',
        category: 'Fasting',
        fact: "Historically, fasting was used by philosophers to sharpen the mind. The metabolic switch to ketones provides a clean, steady fuel source for the brain."
    },
    {
        id: 'fast-gut-rest',
        category: 'Fasting',
        fact: "Taking a break from eating gives your digestive system a chance to rest and repair the gut lining (migrating motor complex activation)."
    }
];

export const getRandomFact = (category: ScienceFact['category']): ScienceFact => {
    const categoryFacts = SCIENCE_FACTS.filter(f => f.category === category);
    return categoryFacts[Math.floor(Math.random() * categoryFacts.length)];
};
