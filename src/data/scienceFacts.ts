export interface ScienceFact {
    id: string;
    category: 'Breath' | 'Meditation' | 'Reflect' | 'Energy' | 'Productivity' | 'Coach' | 'Fasting';
    fact: string;
    source?: string;
}

/**
 * Editorial rule for this file: describe what a practice does and what research
 * suggests, without borrowing authority we cannot back up.
 *
 * Specifically, do not add:
 *   - Percentage claims without a real, checkable citation. Several popular ones
 *     (the "95% accountability" ASTD figure, the "42% written goals" study, the
 *     "multitasking lowers your IQ" figure) trace back to sources that either do
 *     not exist or were small and unpublished.
 *   - Neurotransmitter mechanisms as if they were settled ("releases dopamine",
 *     "rewires your brain", "shrinks the amygdala").
 *   - Named researchers, labs, or elite units as a credibility prop.
 *   - Medical or metabolic claims of any kind. This is a wellness app.
 *
 * Hedged and useful beats confident and wrong. Apple's review guidelines care
 * about unsubstantiated health claims, and so should we.
 */
export const SCIENCE_FACTS: ScienceFact[] = [
    // Breathwork
    {
        id: 'breath-nitric-oxide',
        category: 'Breath',
        fact: "Breathing through your nose rather than your mouth warms and filters the air, and supports better oxygen exchange in the lungs. It is a small change that most people can feel within a few breaths."
    },
    {
        id: 'breath-exhale',
        category: 'Breath',
        fact: "Making your exhale longer than your inhale is associated with a shift toward the parasympathetic 'rest and digest' state. It is one of the quickest ways to signal to your body that it is safe to settle."
    },
    {
        id: 'breath-coherence',
        category: 'Breath',
        fact: "Coherent breathing, balancing the length of your inhale and exhale (usually around five or six breaths a minute), is linked to steadier heart rate variability and a calmer, more even baseline."
    },

    // Meditation
    {
        id: 'meditation-gray-matter',
        category: 'Meditation',
        fact: "Studies of people who meditate consistently for around eight weeks have reported differences in brain regions tied to learning, memory, and emotional regulation. The findings vary in strength, but the direction is consistent."
    },
    {
        id: 'meditation-amygdala',
        category: 'Meditation',
        fact: "Regular practice is associated with reacting less sharply to stress over time. The goal is not to stop feeling things. It is to widen the gap between the feeling and what you do next."
    },
    {
        id: 'meditation-focus',
        category: 'Meditation',
        fact: "Mindfulness training is associated with improved ability to filter out distraction. Some studies see changes after just a few sessions, though the effect grows with consistency."
    },

    // Reflection / Journaling
    {
        id: 'reflect-labeling',
        category: 'Reflect',
        fact: "'Affect labeling', putting a feeling into words, is associated with a calmer response to that feeling. Naming what is happening seems to take some of the charge out of it."
    },
    {
        id: 'reflect-gratitude',
        category: 'Reflect',
        fact: "Writing down a few things you are grateful for is one of the most studied habits in this space. Over time it appears to shift what you tend to notice, which is a slower and more durable change than a mood boost."
    },
    {
        id: 'reflect-gratitude-brain',
        category: 'Reflect',
        fact: "Gratitude practice may leave a lasting mark. In one study, people who wrote gratitude letters showed differences in a brain region tied to learning and empathy, and the difference was still measurable three months later.",
        source: "Kini, P., Wong, J., McInnis, S., Gabana, N., & Brown, J. (2016). The effects of gratitude expression on neural activity. NeuroImage."
    },
    {
        id: 'reflect-gratitude-heart',
        category: 'Reflect',
        fact: "Appreciation tends to show up in the body, not just the mind. Feelings of gratitude are associated with a steadier heart rhythm, which is part of why the practice can feel physically settling and not only pleasant."
    },
    {
        id: 'reflect-clarity',
        category: 'Reflect',
        fact: "Expressive writing about something stressful is associated with improved working memory afterward. The theory being that holding an unprocessed thing quietly costs you attention elsewhere."
    },

    // Energy
    {
        id: 'energy-ultradian',
        category: 'Energy',
        fact: "Human alertness tends to fluctuate across the day in cycles roughly 90 to 120 minutes long. A dip is often a signal to take a real break, not evidence of a willpower problem."
    },
    {
        id: 'energy-rest',
        category: 'Energy',
        fact: "Short, deliberate rest (a brief nap, or simply lying still without stimulation) is associated with restored alertness and better retention of what you just learned."
    },
    {
        id: 'energy-decisions',
        category: 'Energy',
        fact: "Most people find that focus is easier at some hours than others. Paying attention to your own pattern, rather than assuming every hour should be equally productive, tends to work better than pushing through."
    },

    // Productivity (Goal Setting / Focus)
    {
        id: 'prod-goals',
        category: 'Productivity',
        fact: "Writing a goal down makes it concrete and gives you something to return to. Vague intentions are easy to quietly revise; written ones are harder to talk yourself out of."
    },
    {
        id: 'prod-zeigarnik',
        category: 'Productivity',
        fact: "The Zeigarnik Effect: unfinished tasks stay active in memory in a way finished ones do not. Writing them down is a way of setting them down."
    },
    {
        id: 'prod-dopamine',
        category: 'Productivity',
        fact: "Completing something and marking it complete are not the same act. The marking is what makes progress visible to you later, on a day when it does not feel like you made any."
    },
    {
        id: 'prod-micro',
        category: 'Productivity',
        fact: "Breaking a large goal into smaller pieces tends to reduce procrastination. Most avoidance is not laziness. It is a task that has not been made small enough to start."
    },
    {
        id: 'prod-singletask',
        category: 'Productivity',
        fact: "Switching between tasks carries a real cost: each switch takes time to reorient, and the cost compounds. Doing one thing at a time is usually faster than it feels."
    },
    {
        id: 'prod-2min',
        category: 'Productivity',
        fact: "The '2-Minute Rule': if a task takes less than two minutes, do it now. The tracking overhead would cost more than the task."
    },
    {
        id: 'prod-decision',
        category: 'Productivity',
        fact: "Planning tomorrow the night before means waking up with the decision already made. Mornings are a bad time to negotiate with yourself about priorities."
    },
    {
        id: 'prod-parkinson',
        category: 'Productivity',
        fact: "Parkinson's Law: work expands to fill the time available for its completion. A shorter deadline is often a focusing device, not a punishment."
    },
    {
        id: 'prod-flow',
        category: 'Productivity',
        fact: "Deep focus takes a while to arrive, usually more than a few minutes of uninterrupted work. That ramp-up is exactly what an interruption destroys."
    },
    {
        id: 'prod-visualize',
        category: 'Productivity',
        fact: "Picturing the steps you will take appears to help more than picturing the outcome alone. Imagining the finish line is pleasant; imagining the process is useful.",
        source: "Pham, L. B., & Taylor, S. E. (1999). From thought to action: Effects of process- versus outcome-based mental simulations on performance. Personality and Social Psychology Bulletin."
    },
    {
        id: 'prod-focus-timer',
        category: 'Productivity',
        fact: "Timed focus intervals work partly because they are finite. A defined stretch of work with a defined end is easier to start than an open-ended one."
    },
    {
        id: 'prod-accountability',
        category: 'Productivity',
        fact: "Telling someone what you intend to do, and when you will report back, tends to raise follow-through. The specific mechanism is simple: it makes quitting a thing you would have to explain."
    },
    {
        id: 'prod-frog',
        category: 'Productivity',
        fact: "Doing the hardest thing first means the rest of the day is downhill, and it removes the low-grade drag of an avoided task sitting in the background."
    },
    {
        id: 'prod-batching',
        category: 'Productivity',
        fact: "Grouping similar tasks (email, calls, errands) cuts down on the reorientation cost of switching between different kinds of work."
    },
    {
        id: 'prod-environment',
        category: 'Productivity',
        fact: "Visual clutter competes for attention whether or not you are consciously looking at it. Clearing the space in front of you is a cheap way to get some of that back."
    },
    {
        id: 'prod-breaks',
        category: 'Productivity',
        fact: "Brief breaks during a long task are associated with better sustained performance than working straight through. Attention drifts when nothing about the task changes."
    },
    {
        id: 'prod-cant',
        category: 'Productivity',
        fact: "Saying 'I don't' rather than 'I can't' when you turn something down is associated with better follow-through. One sounds like a rule you set; the other sounds like a restriction you are under."
    },
    {
        id: 'prod-progress',
        category: 'Productivity',
        fact: "Of everything that affects how a working day feels, visible progress is among the strongest. Not finishing. Just moving."
    },
    {
        id: 'prod-perfectionism',
        category: 'Productivity',
        fact: "Perfectionism is the enemy of done. 'Good enough' is what lets you keep going tomorrow."
    },

    // Fasting: descriptive only. No metabolic, hormonal, or therapeutic claims:
    // eating patterns interact with medication, pregnancy, and eating-disorder
    // history, and this app is not equipped to advise on any of that.
    {
        id: 'fast-autophagy',
        category: 'Fasting',
        fact: "Interest in fasting windows comes largely from research into what the body does during longer gaps between meals. That research is active and far from settled. Treat any confident claim about it, including ours, with some skepticism."
    },
    {
        id: 'fast-hgh',
        category: 'Fasting',
        fact: "Eating patterns are personal and interact with medication, health conditions, pregnancy, and any history of disordered eating. Talk to a doctor before changing yours. This app is a place to track a practice, not a source of dietary advice."
    },
    {
        id: 'fast-insulin',
        category: 'Fasting',
        fact: "If you are fasting, hydration matters and so does how you break the fast. Notice how the practice actually leaves you feeling, and let that carry more weight than a target number of hours."
    },
    {
        id: 'fast-brain-growth',
        category: 'Fasting',
        fact: "Some people report steadier focus during a fasting window; others feel foggy and irritable. Both are common. Yours is the only data that matters here."
    },
    {
        id: 'fast-clarity',
        category: 'Fasting',
        fact: "Fasting has a long history in philosophical and religious practice, generally as a discipline of attention rather than a health intervention. That framing is often the more useful one."
    },
    {
        id: 'fast-gut-rest',
        category: 'Fasting',
        fact: "A consistent eating window gives your day a predictable shape, which for many people is the real benefit: less constant deciding about food."
    }
];

export const getRandomFact = (category: ScienceFact['category']): ScienceFact => {
    const categoryFacts = SCIENCE_FACTS.filter(f => f.category === category);
    return categoryFacts[Math.floor(Math.random() * categoryFacts.length)];
};
