import type { Quote } from '../types';

/**
 * The complete Palante line library. Every line here is written for Palante and
 * attributed to Palante. Nothing in this file is quoted, borrowed, or adapted from
 * another author.
 *
 * WHY THIS IS THE ONLY SOURCE
 * Earlier versions of the app shipped ~2,100 imported quotes from named third parties
 * (philosophers, athletes, authors). Those were removed in July 2026: the app no longer
 * publishes anyone else's words, so there is exactly one place lines come from and no
 * ambiguity about what "quote" means anywhere in the product.
 *
 * RULES FOR ADDING LINES
 *   - Original. If a phrase sounds familiar, it probably belongs to someone. Cut it.
 *     Four entries were removed for exactly this reason: "Excellence is a habit, not an
 *     act" (Will Durant, summarizing Aristotle), "Pain is temporary. Quitting lasts
 *     forever" (commonly attributed to Lance Armstrong), and two stock internet
 *     aphorisms about comfort zones and not stopping until you are proud.
 *   - No em dashes. See src/test/bannedPhrases.test.ts.
 *   - No emojis, per the design system.
 *   - Specific over inspirational. A line that could appear in any wellness app is
 *     not worth a slot.
 *
 * INTENSITY TIERS map to the user's quoteIntensity setting, and each has its own voice:
 *   1  Gentle and inspiring. Second person. Warm, observational, permission-giving.
 *   2  Clear and focused. First person. The user talking to themselves about method.
 *   3  Energized and bold. Imperative. Short, physical, no hedging.
 *
 * Note on ids: `ai_1` through `ai_5` were rescued from the deleted quotes.ts, which held
 * a handful of Palante-authored entries among the imports. Their original ids are kept
 * so any user who favorited them still resolves.
 */
export const AFFIRMATIONS: Quote[] = [
    // ============================================
    // TIER 1: GENTLE & INSPIRING (second person)
    // ============================================
    { id: 'aff_m1', text: "Your creativity is a well that never runs dry.", author: "Palante", category: "Creativity", intensity: 1, isAffirmation: true },
    { id: 'aff_m2', text: "Ideas flow to you with ease and grace.", author: "Palante", category: "Flow", intensity: 1, isAffirmation: true },
    { id: 'aff_m3', text: "You are a vessel for beautiful things.", author: "Palante", category: "Purpose", intensity: 1, isAffirmation: true },
    { id: 'aff_m4', text: "Trust the timing of your life.", author: "Palante", category: "Trust", intensity: 1, isAffirmation: true },
    { id: 'aff_m5', text: "Your unique perspective is a gift to the world.", author: "Palante", category: "Uniqueness", intensity: 1, isAffirmation: true },
    { id: 'aff_m6', text: "Breathe in inspiration, breathe out creation.", author: "Palante", category: "Presence", intensity: 1, isAffirmation: true },
    { id: 'aff_m7', text: "You are exactly where you need to be to bloom.", author: "Palante", category: "Growth", intensity: 1, isAffirmation: true },
    { id: 'aff_m8', text: "Let your imagination run wild and free.", author: "Palante", category: "Imagination", intensity: 1, isAffirmation: true },
    { id: 'aff_m9', text: "There is magic in your everyday life.", author: "Palante", category: "Wonder", intensity: 1, isAffirmation: true },
    { id: 'aff_m10', text: "You are capable of more than you know.", author: "Palante", category: "Self-Love", intensity: 1, isAffirmation: true },
    { id: 'aff_m11', text: "Quiet your mind and listen to your inner wisdom.", author: "Palante", category: "Intuition", intensity: 1, isAffirmation: true },
    { id: 'aff_m12', text: "You are radiant with potential.", author: "Palante", category: "Potential", intensity: 1, isAffirmation: true },
    { id: 'aff_m13', text: "Every step you take is a work of art.", author: "Palante", category: "Art", intensity: 1, isAffirmation: true },
    { id: 'aff_m14', text: "Your sensitivity is your superpower.", author: "Palante", category: "Strength", intensity: 1, isAffirmation: true },
    { id: 'aff_m15', text: "Allow yourself to dream bigger.", author: "Palante", category: "Dreams", intensity: 1, isAffirmation: true },
    { id: 'aff_m16', text: "You do not have to earn the right to rest.", author: "Palante", category: "Rest", intensity: 1, isAffirmation: true },
    { id: 'aff_m17', text: "The quiet work counts even when no one sees it.", author: "Palante", category: "Effort", intensity: 1, isAffirmation: true },
    { id: 'aff_m18', text: "You are allowed to begin again at any hour of the day.", author: "Palante", category: "Beginning", intensity: 1, isAffirmation: true },
    { id: 'aff_m19', text: "Small and steady outlasts big and brief.", author: "Palante", category: "Consistency", intensity: 1, isAffirmation: true },
    { id: 'aff_m20', text: "What you tend to grows. Choose carefully.", author: "Palante", category: "Attention", intensity: 1, isAffirmation: true },
    { id: 'aff_m21', text: "You can be proud of something and still want more of it.", author: "Palante", category: "Ambition", intensity: 1, isAffirmation: true },
    { id: 'aff_m22', text: "Slow progress is still the direction you wanted.", author: "Palante", category: "Patience", intensity: 1, isAffirmation: true },
    { id: 'aff_m23', text: "The person you are becoming is watching how you treat today.", author: "Palante", category: "Character", intensity: 1, isAffirmation: true },
    { id: 'aff_m24', text: "Notice what you keep returning to. That is information.", author: "Palante", category: "Self-Knowledge", intensity: 1, isAffirmation: true },
    { id: 'aff_m25', text: "You have survived every hard day so far, which is a real record.", author: "Palante", category: "Resilience", intensity: 1, isAffirmation: true },
    { id: 'aff_m26', text: "Being gentle with yourself is not the same as letting yourself off.", author: "Palante", category: "Self-Love", intensity: 1, isAffirmation: true },
    { id: 'aff_m27', text: "Some days the work is simply staying.", author: "Palante", category: "Persistence", intensity: 1, isAffirmation: true },
    { id: 'aff_m28', text: "Your attention is the most honest thing you own.", author: "Palante", category: "Attention", intensity: 1, isAffirmation: true },
    { id: 'aff_m29', text: "There is no version of this that does not take time.", author: "Palante", category: "Patience", intensity: 1, isAffirmation: true },
    { id: 'aff_m30', text: "You do not need to feel ready to start.", author: "Palante", category: "Beginning", intensity: 1, isAffirmation: true },
    { id: 'aff_m31', text: "What feels ordinary now was once what you hoped for.", author: "Palante", category: "Gratitude", intensity: 1, isAffirmation: true },
    { id: 'aff_m32', text: "Rest is part of the work, not a break from it.", author: "Palante", category: "Rest", intensity: 1, isAffirmation: true },
    { id: 'aff_m33', text: "You are more consistent than you give yourself credit for.", author: "Palante", category: "Consistency", intensity: 1, isAffirmation: true },
    { id: 'aff_m34', text: "The days you almost skipped are the ones that built this.", author: "Palante", category: "Effort", intensity: 1, isAffirmation: true },
    { id: 'aff_m35', text: "You are not behind. You are early in something long.", author: "Palante", category: "Perspective", intensity: 1, isAffirmation: true },
    { id: 'aff_m36', text: "A soft start still starts.", author: "Palante", category: "Beginning", intensity: 1, isAffirmation: true },
    { id: 'aff_m37', text: "Give today one honest sentence and it will be enough.", author: "Palante", category: "Reflection", intensity: 1, isAffirmation: true },
    { id: 'aff_m38', text: "You can hold gratitude and wanting more at the same time.", author: "Palante", category: "Gratitude", intensity: 1, isAffirmation: true },
    { id: 'aff_m39', text: "The version of you from a year ago would be relieved.", author: "Palante", category: "Perspective", intensity: 1, isAffirmation: true },
    { id: 'aff_m40', text: "You are learning things that will not show themselves for a while.", author: "Palante", category: "Growth", intensity: 1, isAffirmation: true },
    { id: 'aff_m41', text: "Let it be imperfect and let it be done.", author: "Palante", category: "Completion", intensity: 1, isAffirmation: true },
    { id: 'aff_m42', text: "You are the only one keeping this promise, and you kept it.", author: "Palante", category: "Integrity", intensity: 1, isAffirmation: true },
    { id: 'aff_m43', text: "The smallest true thing beats the biggest vague one.", author: "Palante", category: "Clarity", intensity: 1, isAffirmation: true },
    { id: 'aff_m44', text: "You have permission to change your mind about what matters.", author: "Palante", category: "Freedom", intensity: 1, isAffirmation: true },
    { id: 'aff_m45', text: "What you practice in private becomes who you are in public.", author: "Palante", category: "Character", intensity: 1, isAffirmation: true },
    { id: 'aff_m46', text: "Not every day needs to be a good one to count.", author: "Palante", category: "Consistency", intensity: 1, isAffirmation: true },
    { id: 'aff_m47', text: "You are allowed to be a beginner for as long as it takes.", author: "Palante", category: "Patience", intensity: 1, isAffirmation: true },
    { id: 'aff_m48', text: "The effort you cannot see today is still accumulating.", author: "Palante", category: "Effort", intensity: 1, isAffirmation: true },
    { id: 'aff_m49', text: "Come back gently. That is all coming back requires.", author: "Palante", category: "Recovery", intensity: 1, isAffirmation: true },
    { id: 'ai_1', text: "Your potential is a fire waiting for a spark. Be the spark.", author: "Palante", category: "Potential", intensity: 1, isAffirmation: true },
    { id: 'ai_4', text: "Create the future you want to live in, one action at a time.", author: "Palante", category: "Action", intensity: 1, isAffirmation: true },


    // ============================================
    // TIER 2: CLEAR & FOCUSED (first person)
    // ============================================
    { id: 'aff_f1', text: "I am laser-focused on my goals.", author: "Palante", category: "Focus", intensity: 2, isAffirmation: true },
    { id: 'aff_f2', text: "Distractions get me nowhere. Action gets me everywhere.", author: "Palante", category: "Action", intensity: 2, isAffirmation: true },
    { id: 'aff_f3', text: "I do what needs to be done, when it needs to be done.", author: "Palante", category: "Discipline", intensity: 2, isAffirmation: true },
    { id: 'aff_f4', text: "My time is valuable. I spend it wisely.", author: "Palante", category: "Time", intensity: 2, isAffirmation: true },
    { id: 'aff_f5', text: "Clarity leads to power.", author: "Palante", category: "Clarity", intensity: 2, isAffirmation: true },
    { id: 'aff_f6', text: "I am the architect of my own success.", author: "Palante", category: "Responsibility", intensity: 2, isAffirmation: true },
    { id: 'aff_f7', text: "Consistency is the key to mastery.", author: "Palante", category: "Consistency", intensity: 2, isAffirmation: true },
    { id: 'aff_f8', text: "One task at a time. One step at a time.", author: "Palante", category: "Process", intensity: 2, isAffirmation: true },
    { id: 'aff_f9', text: "I control my attention, I control my future.", author: "Palante", category: "Control", intensity: 2, isAffirmation: true },
    { id: 'aff_f10', text: "I would rather be consistent than impressive.", author: "Palante", category: "Consistency", intensity: 2, isAffirmation: true },
    { id: 'aff_f11', text: "I am capable of deep work and deep thought.", author: "Palante", category: "Deep Work", intensity: 2, isAffirmation: true },
    { id: 'aff_f12', text: "Results speak louder than intentions.", author: "Palante", category: "Results", intensity: 2, isAffirmation: true },
    { id: 'aff_f13', text: "I respect the process.", author: "Palante", category: "Patience", intensity: 2, isAffirmation: true },
    { id: 'aff_f14', text: "My willpower is stronger than my excuses.", author: "Palante", category: "Willpower", intensity: 2, isAffirmation: true },
    { id: 'aff_f15', text: "Prioritize. Execute. Repeat.", author: "Palante", category: "Execution", intensity: 2, isAffirmation: true },
    { id: 'aff_f16', text: "I do the hard thing first and the day gets easier.", author: "Palante", category: "Discipline", intensity: 2, isAffirmation: true },
    { id: 'aff_f17', text: "I finish what I start or I decide honestly to stop.", author: "Palante", category: "Integrity", intensity: 2, isAffirmation: true },
    { id: 'aff_f18', text: "I protect the hours that matter most.", author: "Palante", category: "Time", intensity: 2, isAffirmation: true },
    { id: 'aff_f19', text: "I trade motivation for method.", author: "Palante", category: "Process", intensity: 2, isAffirmation: true },
    { id: 'aff_f20', text: "I do not negotiate with the part of me that wants to skip.", author: "Palante", category: "Discipline", intensity: 2, isAffirmation: true },
    { id: 'aff_f21', text: "I measure myself against yesterday, not against anyone else.", author: "Palante", category: "Progress", intensity: 2, isAffirmation: true },
    { id: 'aff_f22', text: "I choose the boring option that works.", author: "Palante", category: "Process", intensity: 2, isAffirmation: true },
    { id: 'aff_f23', text: "I know the difference between busy and useful.", author: "Palante", category: "Clarity", intensity: 2, isAffirmation: true },
    { id: 'aff_f24', text: "I make the decision once so I do not spend the week deciding.", author: "Palante", category: "Decision", intensity: 2, isAffirmation: true },
    { id: 'aff_f25', text: "I keep promises to myself the way I keep them to other people.", author: "Palante", category: "Integrity", intensity: 2, isAffirmation: true },
    { id: 'aff_f26', text: "I do the small maintenance that prevents the large repair.", author: "Palante", category: "Care", intensity: 2, isAffirmation: true },
    { id: 'aff_f27', text: "I start before I feel like it and the feeling catches up.", author: "Palante", category: "Action", intensity: 2, isAffirmation: true },
    { id: 'aff_f28', text: "I would rather be honest about my capacity than heroic about it.", author: "Palante", category: "Honesty", intensity: 2, isAffirmation: true },
    { id: 'aff_f29', text: "I cut the list until it is real.", author: "Palante", category: "Priorities", intensity: 2, isAffirmation: true },
    { id: 'aff_f30', text: "I let done be better than perfect today.", author: "Palante", category: "Completion", intensity: 2, isAffirmation: true },
    { id: 'aff_f31', text: "I notice the excuse forming and begin anyway.", author: "Palante", category: "Willpower", intensity: 2, isAffirmation: true },
    { id: 'aff_f32', text: "I do not need a perfect week to have a good one.", author: "Palante", category: "Perspective", intensity: 2, isAffirmation: true },
    { id: 'aff_f33', text: "I put the important thing where I will trip over it.", author: "Palante", category: "Systems", intensity: 2, isAffirmation: true },
    { id: 'aff_f34', text: "I know what I am optimizing for.", author: "Palante", category: "Clarity", intensity: 2, isAffirmation: true },
    { id: 'aff_f35', text: "I say no to the good so I can say yes to the necessary.", author: "Palante", category: "Priorities", intensity: 2, isAffirmation: true },
    { id: 'aff_f36', text: "I do the work at the level I would want from someone else.", author: "Palante", category: "Standards", intensity: 2, isAffirmation: true },
    { id: 'aff_f37', text: "I track what I actually do, not what I meant to do.", author: "Palante", category: "Honesty", intensity: 2, isAffirmation: true },
    { id: 'aff_f38', text: "I take the next obvious step instead of the perfect one.", author: "Palante", category: "Action", intensity: 2, isAffirmation: true },
    { id: 'aff_f39', text: "I keep the standard even when no one is checking.", author: "Palante", category: "Standards", intensity: 2, isAffirmation: true },
    { id: 'aff_f40', text: "I would rather adjust the plan than abandon it.", author: "Palante", category: "Persistence", intensity: 2, isAffirmation: true },
    { id: 'aff_f41', text: "I spend my best hours on my real work.", author: "Palante", category: "Time", intensity: 2, isAffirmation: true },
    { id: 'aff_f42', text: "I let the streak be a record, not a cage.", author: "Palante", category: "Perspective", intensity: 2, isAffirmation: true },
    { id: 'aff_f43', text: "I do less, better.", author: "Palante", category: "Focus", intensity: 2, isAffirmation: true },
    { id: 'aff_f44', text: "I stop when the work is done, not when I am empty.", author: "Palante", category: "Rest", intensity: 2, isAffirmation: true },
    { id: 'aff_f45', text: "I plan for the day I will not feel like it.", author: "Palante", category: "Systems", intensity: 2, isAffirmation: true },
    { id: 'aff_f46', text: "I choose what my future self will thank me for.", author: "Palante", category: "Decision", intensity: 2, isAffirmation: true },
    { id: 'aff_f47', text: "I make it easy to start and hard to quit.", author: "Palante", category: "Systems", intensity: 2, isAffirmation: true },
    { id: 'aff_f48', text: "I am the person who does what they said.", author: "Palante", category: "Integrity", intensity: 2, isAffirmation: true },
    { id: 'aff_f49', text: "I finish the sentence I started yesterday.", author: "Palante", category: "Continuity", intensity: 2, isAffirmation: true },
    { id: 'ai_2', text: "Efficiency is the currency of success. Spend it wisely.", author: "Palante", category: "Efficiency", intensity: 2, isAffirmation: true },
    { id: 'ai_5', text: "Discipline is not a punishment, it's a bridge to your goals.", author: "Palante", category: "Discipline", intensity: 2, isAffirmation: true },


    // ============================================
    // TIER 3: ENERGIZED & BOLD (imperative)
    // ============================================
    { id: 'aff_fs1', text: "Wake up and seize the day.", author: "Palante", category: "Energy", intensity: 3, isAffirmation: true },
    { id: 'aff_fs2', text: "Direct your energy toward solutions, not complaints.", author: "Palante", category: "No Excuses", intensity: 3, isAffirmation: true },
    { id: 'aff_fs3', text: "Be unstoppable today.", author: "Palante", category: "Momentum", intensity: 3, isAffirmation: true },
    { id: 'aff_fs4', text: "Take the harder rep.", author: "Palante", category: "Effort", intensity: 3, isAffirmation: true },
    { id: 'aff_fs5', text: "Beat yesterday by one.", author: "Palante", category: "Progress", intensity: 3, isAffirmation: true },
    { id: 'aff_fs6', text: "Every challenge is building the strength you need for the next level.", author: "Palante", category: "Resilience", intensity: 3, isAffirmation: true },
    { id: 'aff_fs7', text: "Focus on your output. Let the results speak for you.", author: "Palante", category: "Results", intensity: 3, isAffirmation: true },
    { id: 'aff_fs8', text: "Go get what's yours.", author: "Palante", category: "Ambition", intensity: 3, isAffirmation: true },
    { id: 'aff_fs9', text: "Own your path.", author: "Palante", category: "Ownership", intensity: 3, isAffirmation: true },
    { id: 'aff_fs10', text: "Leave nothing on the table.", author: "Palante", category: "Effort", intensity: 3, isAffirmation: true },
    { id: 'aff_fs11', text: "Outwork your yesterday self every single day.", author: "Palante", category: "Hustle", intensity: 3, isAffirmation: true },
    { id: 'aff_fs12', text: "Prove them wrong.", author: "Palante", category: "Motivation", intensity: 3, isAffirmation: true },
    { id: 'aff_fs13', text: "Success is my natural state.", author: "Palante", category: "Success", intensity: 3, isAffirmation: true },
    { id: 'aff_fs14', text: "Level up or get left behind.", author: "Palante", category: "Competition", intensity: 3, isAffirmation: true },
    { id: 'aff_fs15', text: "Be undeniable.", author: "Palante", category: "Excellence", intensity: 3, isAffirmation: true },
    { id: 'aff_fs16', text: "Do the thing you have been circling.", author: "Palante", category: "Action", intensity: 3, isAffirmation: true },
    { id: 'aff_fs17', text: "Start ugly. Fix it later.", author: "Palante", category: "Action", intensity: 3, isAffirmation: true },
    { id: 'aff_fs18', text: "Your excuses have heard themselves before.", author: "Palante", category: "No Excuses", intensity: 3, isAffirmation: true },
    { id: 'aff_fs19', text: "Move first. Feel ready after.", author: "Palante", category: "Action", intensity: 3, isAffirmation: true },
    { id: 'aff_fs20', text: "Stop rehearsing and go.", author: "Palante", category: "Action", intensity: 3, isAffirmation: true },
    { id: 'aff_fs21', text: "Make the call you have been avoiding.", author: "Palante", category: "Courage", intensity: 3, isAffirmation: true },
    { id: 'aff_fs22', text: "Earn the evening.", author: "Palante", category: "Effort", intensity: 3, isAffirmation: true },
    { id: 'aff_fs23', text: "Do it tired.", author: "Palante", category: "Grit", intensity: 3, isAffirmation: true },
    { id: 'aff_fs24', text: "The work does not care how you feel about it.", author: "Palante", category: "Discipline", intensity: 3, isAffirmation: true },
    { id: 'aff_fs25', text: "Close the gap between what you said and what you did.", author: "Palante", category: "Integrity", intensity: 3, isAffirmation: true },
    { id: 'aff_fs26', text: "Go before the doubt finishes its sentence.", author: "Palante", category: "Courage", intensity: 3, isAffirmation: true },
    { id: 'aff_fs27', text: "Take the shot you keep describing.", author: "Palante", category: "Courage", intensity: 3, isAffirmation: true },
    { id: 'aff_fs28', text: "Finish it today.", author: "Palante", category: "Completion", intensity: 3, isAffirmation: true },
    { id: 'aff_fs29', text: "Raise the floor, not just the ceiling.", author: "Palante", category: "Standards", intensity: 3, isAffirmation: true },
    { id: 'aff_fs30', text: "Be hard to discourage.", author: "Palante", category: "Resilience", intensity: 3, isAffirmation: true },
    { id: 'aff_fs31', text: "Do the rep nobody is counting.", author: "Palante", category: "Effort", intensity: 3, isAffirmation: true },
    { id: 'aff_fs32', text: "Choose the discomfort that builds something.", author: "Palante", category: "Growth", intensity: 3, isAffirmation: true },
    { id: 'aff_fs33', text: "Stop asking whether you can and find out.", author: "Palante", category: "Courage", intensity: 3, isAffirmation: true },
    { id: 'aff_fs34', text: "Turn the plan into a receipt.", author: "Palante", category: "Execution", intensity: 3, isAffirmation: true },
    { id: 'aff_fs35', text: "You are one decision from a different week.", author: "Palante", category: "Decision", intensity: 3, isAffirmation: true },
    { id: 'aff_fs36', text: "Outlast the part of you that wants to stop.", author: "Palante", category: "Grit", intensity: 3, isAffirmation: true },
    { id: 'aff_fs37', text: "Do it badly rather than not at all.", author: "Palante", category: "Action", intensity: 3, isAffirmation: true },
    { id: 'aff_fs38', text: "Spend the effort. It is the only thing that compounds.", author: "Palante", category: "Effort", intensity: 3, isAffirmation: true },
    { id: 'aff_fs39', text: "Make today expensive to waste.", author: "Palante", category: "Urgency", intensity: 3, isAffirmation: true },
    { id: 'aff_fs40', text: "Say the true thing out loud.", author: "Palante", category: "Honesty", intensity: 3, isAffirmation: true },
    { id: 'aff_fs41', text: "Push past the first no from yourself.", author: "Palante", category: "Grit", intensity: 3, isAffirmation: true },
    { id: 'aff_fs42', text: "Act like the person you are trying to become.", author: "Palante", category: "Character", intensity: 3, isAffirmation: true },
    { id: 'aff_fs43', text: "Get it done before you talk about it.", author: "Palante", category: "Execution", intensity: 3, isAffirmation: true },
    { id: 'aff_fs44', text: "Take up the space you earned.", author: "Palante", category: "Confidence", intensity: 3, isAffirmation: true },
    { id: 'aff_fs45', text: "Do not wait for permission you already have.", author: "Palante", category: "Ownership", intensity: 3, isAffirmation: true },
    { id: 'aff_fs46', text: "Let the work be the argument.", author: "Palante", category: "Results", intensity: 3, isAffirmation: true },
    { id: 'aff_fs47', text: "Go make it undeniable.", author: "Palante", category: "Excellence", intensity: 3, isAffirmation: true },
    { id: 'aff_fs48', text: "Bet on the version of you that keeps going.", author: "Palante", category: "Belief", intensity: 3, isAffirmation: true },
    { id: 'aff_fs49', text: "Keep going. Pa'lante.", author: "Palante", category: "Momentum", intensity: 3, isAffirmation: true },
    { id: 'ai_3', text: "Excuses are the obstacles that block the path to success. Move past them.", author: "Palante", category: "No Excuses", intensity: 3, isAffirmation: true },
];
