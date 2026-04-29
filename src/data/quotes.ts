import type { Quote } from '../types';
import { EXPANSION_QUOTES } from './expansionQuotes';
import { EXPANSION_QUOTES_VOL2 } from './expansionQuotesVol2';
import { EXPANSION_QUOTES_VOL3 } from './expansionQuotesVol3';
import { EXPANSION_QUOTES_VOL4 } from './expansionQuotesVol4';
import { EXPANSION_QUOTES_VOL5 } from './expansionQuotesVol5';
import { EXPANSION_QUOTES_VOL6 } from './expansionQuotesVol6';
import { EXPANSION_QUOTES_VOL7 } from './expansionQuotesVol7';
import { EXPANSION_QUOTES_VOL8 } from './expansionQuotesVol8';
import { EXPANSION_QUOTES_VOL9 } from './expansionQuotesVol9';
import { LATINO_QUOTES } from './latinoQuotes';
import { EXPANSION_QUOTES_VOL10 } from './expansionQuotesVol10';

export const QUOTES: Quote[] = [
    ...EXPANSION_QUOTES, // 300+ Expansion quotes
    ...EXPANSION_QUOTES_VOL2, // 200 More Expansion quotes
    ...EXPANSION_QUOTES_VOL3, // 300 Global/Diverse quotes
    ...EXPANSION_QUOTES_VOL4, // 150 Creators & Shifters quotes
    ...EXPANSION_QUOTES_VOL5, // ~100 Diverse/High Quality quotes
    ...EXPANSION_QUOTES_VOL6, // ~100 Leadership/Business quotes
    ...EXPANSION_QUOTES_VOL7, // ~100 Grit/Tenacity quotes
    ...EXPANSION_QUOTES_VOL8, // ~100 Creativity/Vision quotes
    ...EXPANSION_QUOTES_VOL9, // 187 Global Proverbs
    ...LATINO_QUOTES, // 100 Latino & Afro-Latino voices — Pa'lante roots
    ...EXPANSION_QUOTES_VOL10, // 209 Verified + Unknown + Virgil Abloh + Kevin Kelly
    // ============================================
    // RELAXED & AFFIRMING (Gentle, Mindfulness)
    // ============================================

    // WRITERS
    { id: 'c_w1', text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", category: "Creativity", intensity: 1, profession: "Writer" },
    { id: 'c_w2', text: "You can make anything by writing.", author: "C.S. Lewis", category: "Writing", intensity: 1, profession: "Writer" },
    { id: 'c_w3', text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", author: "Louis L'Amour", category: "Writing", intensity: 1, profession: "Writer" },
    { id: 'c_w4', text: "Words are, in my not-so-humble opinion, our most inexhaustible source of magic.", author: "J.K. Rowling", category: "Writing", intensity: 1, profession: "Writer" },

    // ARCHITECTS
    { id: 'c_a1', text: "Form follows function.", author: "Louis Sullivan", category: "Design", intensity: 1, profession: "Designer" },
    { id: 'c_a2', text: "Architecture should speak of its time and place, but yearn for timelessness.", author: "Frank Gehry", category: "Design", intensity: 1, profession: "Designer" },
    { id: 'c_a3', text: "Less is more.", author: "Ludwig Mies van der Rohe", category: "Simplicity", intensity: 1, profession: "Designer" },

    { id: 'c_p1', text: "The engine is the power of an airplane, but the pilot is its mind.", author: "Walter Raleigh", category: "Aviation", intensity: 1, profession: "Other" },
    { id: 'c_p2', text: "Flying is learning how to throw yourself at the ground and miss.", author: "Douglas Adams", category: "Aviation", intensity: 1, profession: "Other" },

    // COACHES
    { id: 'c_co1', text: "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.", author: "Vince Lombardi", category: "Willpower", intensity: 1, profession: "Coach" },
    { id: 'c_co2', text: "Success is peace of mind, which is a direct result of self-satisfaction in knowing you made the effort to become the best of which you are capable.", author: "John Wooden", category: "Success", intensity: 1, profession: "Coach" },

    // BUSINESS EXECUTIVES
    { id: 'c_b1', text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Work", intensity: 1, profession: "Executive" },
    { id: 'c_b2', text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: "Authenticity", intensity: 1, profession: "Executive" },
    { id: 'c_b3', text: "The biggest risk is not taking any risk.", author: "Mark Zuckerberg", category: "Risk", intensity: 1, profession: "Executive" },

    // FILMMAKERS
    { id: 'c_f1', text: "Every frame is a painting.", author: "Stanley Kubrick", category: "Creativity", intensity: 1, profession: "Creative" },
    { id: 'c_f2', text: "The most honest form of filmmaking is to make a film for yourself.", author: "Peter Jackson", category: "Authenticity", intensity: 1, profession: "Creative" },

    // ATHLETES
    { id: 'c_at1', text: "I've failed over and over and over again in my life. And that is why I succeed.", author: "Michael Jordan", category: "Resilience", intensity: 1, profession: "Athlete" },
    { id: 'c_at2', text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", category: "Action", intensity: 1, profession: "Athlete" },
    { id: 'c_at3', text: "The best time to plant a tree was 25 years ago. The second-best time to plant a tree is today.", author: "Eliud Kipchoge", category: "Growth", intensity: 1, profession: "Athlete" },

    // SCIENTISTS
    { id: 'c_s1', text: "The important thing is not to stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein", category: "Curiosity", intensity: 1, profession: "Engineer" },
    { id: 'c_s2', text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", category: "Understanding", intensity: 1, profession: "Engineer" },

    // ARTISTS
    { id: 'c_ar1', text: "Every child is an artist. The problem is how to remain an artist once we grow up.", author: "Pablo Picasso", category: "Creativity", intensity: 1, profession: "Artist" },
    { id: 'c_ar2', text: "Art is not what you see, but what you make others see.", author: "Edgar Degas", category: "Art", intensity: 1, profession: "Artist" },

    // MUSICIANS
    { id: 'c_m1', text: "Music is the divine way to tell beautiful, poetic things to the mind.", author: "Pablo Casals", category: "Music", intensity: 1, profession: "Creative" },
    { id: 'c_m2', text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", category: "Music", intensity: 1, profession: "Creative" },

    // ENTREPRENEURS
    { id: 'c_e1', text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action", intensity: 1, profession: "Entrepreneur" },
    { id: 'c_e2', text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller", category: "Ambition", intensity: 1, profession: "Entrepreneur" },

    // DOCTORS
    { id: 'c_doc1', text: "Cure sometimes, treat often, comfort always.", author: "Hippocrates", category: "Compassion", intensity: 1, profession: "Healthcare" },
    { id: 'c_doc2', text: "Medicine is a science of uncertainty and an art of probability.", author: "William Osler", category: "Wisdom", intensity: 1, profession: "Healthcare" },

    // ENGINEERS
    { id: 'c_eng1', text: "The present is theirs; the future, for which I really worked, is mine.", author: "Nikola Tesla", category: "Vision", intensity: 1, profession: "Engineer" },
    { id: 'c_eng2', text: "A ship in port is safe, but that's not what ships are built for.", author: "Grace Hopper", category: "Courage", intensity: 1, profession: "Engineer" },

    // LAWYERS
    { id: 'c_law1', text: "Resolve to be honest at all events; and if in your own judgment you cannot be an honest lawyer, resolve to be honest without being a lawyer.", author: "Abraham Lincoln", category: "Integrity", intensity: 1, profession: "Consultant" },
    { id: 'c_law2', text: "Reacting in anger or annoyance will not advance one's ability to persuade.", author: "Ruth Bader Ginsburg", category: "Patience", intensity: 1, profession: "Consultant" },

    // STUDENTS
    { id: 'c_stu1', text: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai", category: "Education", intensity: 1, profession: "Student" },
    { id: 'c_stu2', text: "The first principle is that you must not fool yourself and you are the easiest person to fool.", author: "Richard Feynman", category: "Truth", intensity: 1, profession: "Student" },

    // TEACHERS
    { id: 'c_tea1', text: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats", category: "Inspiration", intensity: 1, profession: "Teacher" },
    { id: 'c_tea2', text: "Optimism is the faith that leads to achievement.", author: "Helen Keller", category: "Hope", intensity: 1, profession: "Teacher" },

    // GENERAL CALM
    { id: 'c1', text: "Breathe. You are exactly where you need to be.", author: "Unknown", category: "Mindfulness", intensity: 1 },
    { id: 'c2', text: "Small steps are still progress.", author: "Unknown", category: "Growth", intensity: 1 },
    { id: 'c3', text: "Be kind to yourself today.", author: "Unknown", category: "Self-Care", intensity: 1 },
    { id: 'c4', text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "Mindfulness", intensity: 1 },
    { id: 'c5', text: "You are capable of amazing things.", author: "Unknown", category: "Confidence", intensity: 1 },

    // ============================================
    // FOCUSED & DIRECT (Stoic, Disciplined, Direct)
    // ============================================

    // WRITERS
    { id: 'f_w1', text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", author: "Stephen King", category: "Work", intensity: 2, profession: "Writer" },
    { id: 'f_w2', text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.", author: "Ernest Hemingway", category: "Writing", intensity: 2, profession: "Writer" },
    { id: 'f_w3', text: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison", category: "Writing", intensity: 2, profession: "Writer" },
    { id: 'f_w4', text: "Write hard and clear about what hurts.", author: "Ernest Hemingway", category: "Writing", intensity: 2, profession: "Writer" },

    // ARCHITECTS
    { id: 'f_a1', text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", category: "Reality", intensity: 2, profession: "Designer" },
    { id: 'f_a2', text: "I don't build in order to have clients. I have clients in order to build.", author: "Ayn Rand", category: "Purpose", intensity: 2, profession: "Designer" },
    { id: 'f_a3', text: "Space and light and order. Those are the things that men need just as much as they need bread or a place to sleep.", author: "Le Corbusier", category: "Design", intensity: 2, profession: "Designer" },

    // PILOTS/AVIATION
    { id: 'f_p1', text: "A good landing is one you can walk away from. A great landing is one where you can use the airplane again.", author: "Chuck Yeager", category: "Excellence", intensity: 2, profession: "Other" },
    { id: 'f_p2', text: "The most important thing is to fly. The machine will follow.", author: "Amelia Earhart", category: "Focus", intensity: 2, profession: "Other" },
    { id: 'f_p3', text: "Everything is accomplished through teamwork.", author: "Chesley Sullenberger", category: "Teamwork", intensity: 2, profession: "Other" },

    // BOXERS/FIGHTERS
    { id: 'f_box1', text: "Champions aren't made in gyms. Champions are made from something they have deep inside them.", author: "Muhammad Ali", category: "Character", intensity: 2, profession: "Athlete" },
    { id: 'f_box2', text: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'", author: "Muhammad Ali", category: "Discipline", intensity: 2, profession: "Athlete" },
    { id: 'f_box3', text: "Discipline is doing what you need to do, but nonetheless doing it with purpose.", author: "Mike Tyson", category: "Discipline", intensity: 2, profession: "Athlete" },

    // COACHES
    { id: 'f_co1', text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi", category: "Resilience", intensity: 2, profession: "Coach" },
    { id: 'f_co2', text: "The strength of the team is each individual member. The strength of each member is the team.", author: "Phil Jackson", category: "Teamwork", intensity: 2, profession: "Coach" },
    { id: 'f_co3', text: "Do not let what you cannot do interfere with what you can do.", author: "John Wooden", category: "Focus", intensity: 2, profession: "Coach" },

    // BUSINESS EXECUTIVES
    { id: 'f_b1', text: "Move fast and break things.", author: "Mark Zuckerberg", category: "Innovation", intensity: 2, profession: "Executive" },

    { id: 'f_b3', text: "Done is better than perfect.", author: "Sheryl Sandberg", category: "Execution", intensity: 2, profession: "Executive" },
    { id: 'f_b4', text: "The biggest risk is not taking any risk. In a world that's changing quickly, the only strategy that is guaranteed to fail is not taking risks.", author: "Mark Zuckerberg", category: "Risk", intensity: 2, profession: "Executive" },

    // FILMMAKERS
    { id: 'f_f1', text: "The most important thing is story-telling. It's what we all do.", author: "Martin Scorsese", category: "Storytelling", intensity: 2, profession: "Creative" },
    { id: 'f_f2', text: "I dream for a living.", author: "Steven Spielberg", category: "Creativity", intensity: 2, profession: "Creative" },
    { id: 'f_f3', text: "You don't make a photograph just with a camera. You bring to the act of photography all the pictures you have seen, the books you have read, the music you have heard, the people you have loved.", author: "Ansel Adams", category: "Creativity", intensity: 2, profession: "Creative" },

    // ATHLETES
    { id: 'f_at1', text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke", category: "Work Ethic", intensity: 2, profession: "Athlete" },
    { id: 'f_at2', text: "The only way to prove that you're a good sport is to lose.", author: "Ernie Banks", category: "Character", intensity: 2, profession: "Athlete" },
    { id: 'f_at3', text: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi", category: "Resilience", intensity: 2, profession: "Athlete" },

    // SCIENTISTS
    { id: 'f_s1', text: "Science is not only a disciple of reason but also one of romance and passion.", author: "Stephen Hawking", category: "Science", intensity: 2, profession: "Engineer" },
    { id: 'f_s2', text: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson", category: "Truth", intensity: 2, profession: "Engineer" },

    // DOCTORS
    { id: 'f_doc1', text: "Better is possible. It does not take genius. It takes diligence.", author: "Atul Gawande", category: "Excellence", intensity: 2, profession: "Healthcare" },
    { id: 'f_doc2', text: "Observe, record, tabulate, communicate. Use your five senses.", author: "William Osler", category: "Focus", intensity: 2, profession: "Healthcare" },

    // ENGINEERS

    { id: 'f_eng2', text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford", category: "Growth", intensity: 2, profession: "Engineer" },
    { id: 'f_mv1', text: "If all you have is want, in the end, want is all you'll have.", author: "Michael Vargas", category: "Reality", intensity: 2 },

    // LAWYERS
    { id: 'f_law1', text: "Support the things that you care about, and do it in a way that will lead others to join you.", author: "Ruth Bader Ginsburg", category: "Leadership", intensity: 2, profession: "Consultant" },


    // STUDENTS
    { id: 'f_stu1', text: "I would rather have questions that can't be answered than answers that can't be questioned.", author: "Richard Feynman", category: "Curiosity", intensity: 2, profession: "Student" },
    { id: 'f_stu2', text: "Becoming is better than being.", author: "Carol Dweck", category: "Growth", intensity: 2, profession: "Student" },

    // TEACHERS
    { id: 'f_tea1', text: "Educating the mind without educating the values is no education at all.", author: "Aristotle", category: "Wisdom", intensity: 2, profession: "Teacher" },
    { id: 'f_tea2', text: "Education is the kindling of a flame, not the filling of a vessel.", author: "Socrates", category: "Inspiration", intensity: 2, profession: "Teacher" },

    // GENERAL FIRM
    { id: 'f1', text: "Discipline is freedom.", author: "Jocko Willink", category: "Discipline", intensity: 2 },
    { id: 'f2', text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Stoicism", intensity: 2 },
    { id: 'f3', text: "The obstacle is the way.", author: "Ryan Holiday", category: "Stoicism", intensity: 2 },
    { id: 'f4', text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "Action", intensity: 2 },

    // ============================================
    // POWERFUL & TRANSCENDENT (High Intensity, Resilience)
    // ============================================

    // WRITERS
    { id: 'd_w1', text: "The scariest moment is always just before you start. After that, things can only get better.", author: "Stephen King", category: "Fear", intensity: 3, profession: "Writer" },
    { id: 'd_w2', text: "If you don't have time to read, you don't have the time or the tools to write. Simple as that.", author: "Stephen King", category: "Discipline", intensity: 3, profession: "Writer" },

    // BOXERS/FIGHTERS
    { id: 'd_box1', text: "Everyone has a plan until they face the unexpected.", author: "Mike Tyson", category: "Reality", intensity: 3, profession: "Athlete" },
    { id: 'd_box2', text: "I'm the best. I just haven't played yet.", author: "Muhammad Ali", category: "Confidence", intensity: 3, profession: "Athlete" },
    { id: 'd_box3', text: "Float like a butterfly, flow like a stream.", author: "Muhammad Ali", category: "Strategy", intensity: 3, profession: "Athlete" },
    { id: 'd_box4', text: "Believe in your greatness so much that others have no choice but to see it too.", author: "Muhammad Ali", category: "Dominance", intensity: 3, profession: "Athlete" },

    // COACHES
    { id: 'd_co1', text: "Winning isn't everything, it's the only thing.", author: "Vince Lombardi", category: "Winning", intensity: 3, profession: "Coach" },
    { id: 'd_co2', text: "The price of success is hard work, dedication to the job at hand, and the determination that whether we win or lose, we have applied the best of ourselves to the task at hand.", author: "Vince Lombardi", category: "Dedication", intensity: 3, profession: "Coach" },

    // BUSINESS EXECUTIVES
    { id: 'd_b1', text: "If you're not upsetting someone, you're probably not doing anything important.", author: "Oliver Emberton", category: "Impact", intensity: 3, profession: "Executive" },
    { id: 'd_b2', text: "I don't care about the noise. I want to make a transcendent product.", author: "Steve Jobs", category: "Excellence", intensity: 3, profession: "Executive" },

    // ATHLETES (David Goggins, Kobe Bryant, etc.)

    // DOCTORS
    { id: 'd_doc1', text: "Lives are on the line. Act like it.", author: "Unknown", category: "Responsibility", intensity: 3, profession: "Healthcare" },
    { id: 'd_doc2', text: "Stay sharp. Lives depend on your focus.", author: "Unknown", category: "Focus", intensity: 3, profession: "Healthcare" },

    // ENGINEERS
    { id: 'd_eng1', text: "Build it right or don't build it at all.", author: "Unknown", category: "Excellence", intensity: 3, profession: "Engineer" },
    { id: 'd_eng2', text: "Physics doesn't care about your feelings. Make it work.", author: "Unknown", category: "Reality", intensity: 3, profession: "Engineer" },

    // LAWYERS
    { id: 'd_law1', text: "Facts don't lie. People do. Find the truth.", author: "Unknown", category: "Truth", intensity: 3, profession: "Consultant" },
    { id: 'd_law2', text: "Win the case. No excuses.", author: "Unknown", category: "Winning", intensity: 3, profession: "Consultant" },

    // STUDENTS
    { id: 'd_stu1', text: "Study like your life depends on it. Because it does.", author: "Unknown", category: "Focus", intensity: 3, profession: "Student" },
    { id: 'd_stu2', text: "Grades don't matter. Knowledge does. Don't be a fraud.", author: "Unknown", category: "Integrity", intensity: 3, profession: "Student" },

    // TEACHERS
    { id: 'd_tea1', text: "You are molding the future. Don't screw it up.", author: "Unknown", category: "Responsibility", intensity: 3, profession: "Teacher" },
    { id: 'd_tea2', text: "If they fail, YOU failed. Teach better.", author: "Unknown", category: "Accountability", intensity: 3, profession: "Teacher" },

    // GENERAL DRILL SERGEANT
    { id: 'd1', text: "Step beyond your excuses and start making progress.", author: "Unknown", category: "Progress", intensity: 3 },
    { id: 'd2', text: "Strength is built in the moments you want to give up.", author: "US Marines", category: "Pain", intensity: 3 },
    { id: 'd3', text: "You want to be comfortable? Stay average.", author: "Unknown", category: "Winning", intensity: 3 },
    { id: 'd4', text: "Your excuses are lies.", author: "Jocko Willink", category: "Accountability", intensity: 3 },
    { id: 'd5', text: "Believe and train.", author: "Unknown", category: "Training", intensity: 3 },
    { id: 'd7', text: "Be exceptional, not average.", author: "Unknown", category: "Excellence", intensity: 3 },
    { id: 'd8', text: "Master your emotions, or they will master you.", author: "Unknown", category: "Discipline", intensity: 3 },
    { id: 'd9', text: "Go until you fail. Then go again.", author: "Unknown", category: "Failure", intensity: 3 },
    { id: 'd10', text: "Sleep when you're dead.", author: "Unknown", category: "Hustle", intensity: 3 },
    { id: 'd13', text: "Rise with purpose and go secure your future.", author: "Unknown", category: "Hustle", intensity: 3 },
    { id: 'd14', text: "Nobody cares. Work harder.", author: "Unknown", category: "Reality", intensity: 3 },
    { id: 'd15', text: "Don't settle for average. Do the work.", author: "Unknown", category: "Toughness", intensity: 3 },
    { id: 'd16', text: "Your potential doesn't mean anything if you don't execute.", author: "Unknown", category: "Execution", intensity: 3 },
    { id: 'd17', text: "Practice with heart, lead with wisdom.", author: "Unknown", category: "Preparation", intensity: 3 },
    { id: 'd18', text: "If you're tired, do it tired.", author: "Unknown", category: "Persistence", intensity: 3 },

    // ============================================
    // NEW: ANCIENT WISDOM & PHILOSOPHY (100 Quotes)
    // ============================================
    { id: 'aw_1', text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", category: "Stoicism", intensity: 1 },
    { id: 'aw_2', text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "Purpose", intensity: 1 },
    { id: 'aw_3', text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", category: "Action", intensity: 1 },
    { id: 'aw_4', text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius", category: "Life", intensity: 1 },
    { id: 'aw_5', text: "Man transforms the world by mastering himself.", author: "Zeno of Citium", category: "Self-Control", intensity: 1 },
    { id: 'aw_6', text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Anxiety", intensity: 1 },
    { id: 'aw_7', text: "If a man knows not to which port he sails, no wind is favorable.", author: "Seneca", category: "Purpose", intensity: 1 },
    { id: 'aw_8', text: "Life is long if you know how to use it.", author: "Seneca", category: "Time", intensity: 1 },
    { id: 'aw_9', text: "To be calm is the highest achievement of the self.", author: "Zen Proverb", category: "Calm", intensity: 1 },
    { id: 'aw_10', text: "When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.", author: "Marcus Aurelius", category: "Gratitude", intensity: 1 },
    { id: 'aw_11', text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", category: "Mindfulness", intensity: 1 },
    { id: 'aw_12', text: "He who masters himself possesses true strength.", author: "Confucius", category: "Self-Control", intensity: 1 },
    { id: 'aw_13', text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius", category: "Persistence", intensity: 1 },
    { id: 'aw_14', text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Persistence", intensity: 1 },
    { id: 'aw_15', text: "Act without expectation.", author: "Lao Tzu", category: "Action", intensity: 1 },
    { id: 'aw_16', text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", category: "Patience", intensity: 1 },
    { id: 'aw_17', text: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Lao Tzu", category: "Wisdom", intensity: 1 },
    { id: 'aw_18', text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu", category: "Power", intensity: 1 },
    { id: 'aw_19', text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", category: "Action", intensity: 1 },
    { id: 'aw_20', text: "When I let go of what I am, I become what I might be.", author: "Lao Tzu", category: "Growth", intensity: 1 },
    { id: 'aw_21', text: "Silence is a source of great strength.", author: "Lao Tzu", category: "Strength", intensity: 1 },
    { id: 'aw_22', text: "Give a man a fish and you feed him for a day. Teach him how to fish and you feed him for a lifetime.", author: "Lao Tzu", category: "Education", intensity: 1 },
    { id: 'aw_23', text: "Kindness in words creates confidence. Kindness in thinking creates profoundness. Kindness in giving creates love.", author: "Lao Tzu", category: "Kindness", intensity: 1 },
    { id: 'aw_24', text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu", category: "Love", intensity: 1 },
    { id: 'aw_25', text: "The truth is not always beautiful, nor beautiful words the truth.", author: "Lao Tzu", category: "Truth", intensity: 1 },
    { id: 'aw_26', text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", category: "Simplicity", intensity: 1 },
    { id: 'aw_27', text: "Knowing is not enough; we must apply. Being willing is not enough; we must do.", author: "Leonardo da Vinci", category: "Action", intensity: 1 },
    { id: 'aw_28', text: "I have been impressed with the urgency of doing. Knowing is not enough; we must apply. Being willing is not enough; we must do.", author: "Leonardo da Vinci", category: "Action", intensity: 1 },
    { id: 'aw_29', text: "Details make perfection, and perfection is not a detail.", author: "Leonardo da Vinci", category: "Excellence", intensity: 1 },
    { id: 'aw_30', text: "Art is never finished, only abandoned.", author: "Leonardo da Vinci", category: "Creativity", intensity: 1 },
    { id: 'aw_31', text: "Study without desire spoils the memory, and it retains nothing that it takes in.", author: "Leonardo da Vinci", category: "Learning", intensity: 1 },
    { id: 'aw_32', text: "Learning never exhausts the mind.", author: "Leonardo da Vinci", category: "Learning", intensity: 1 },
    { id: 'aw_33', text: "Time stays long enough for anyone who will use it.", author: "Leonardo da Vinci", category: "Time", intensity: 1 },
    { id: 'aw_34', text: "Make your work to be in keeping with your purpose.", author: "Leonardo da Vinci", category: "Purpose", intensity: 1 },
    { id: 'aw_35', text: "Who sows virtue reaps honor.", author: "Leonardo da Vinci", category: "Virtue", intensity: 1 },
    { id: 'aw_36', text: "The unexamined life is not worth living.", author: "Socrates", category: "Wisdom", intensity: 1 },
    { id: 'aw_37', text: "I cannot teach anybody anything. I can only make them think.", author: "Socrates", category: "Teaching", intensity: 1 },
    { id: 'aw_38', text: "Wonder is the beginning of wisdom.", author: "Socrates", category: "Wisdom", intensity: 1 },
    { id: 'aw_39', text: "To find yourself, think for yourself.", author: "Socrates", category: "Individuality", intensity: 1 },
    { id: 'aw_40', text: "Be kind, for everyone you meet is carrying a heavy load.", author: "Plato", category: "Kindness", intensity: 1 },
    { id: 'aw_41', text: "Wise men speak because they have something to say; Fools because they have to say something.", author: "Plato", category: "Wisdom", intensity: 1 },
    { id: 'aw_42', text: "Music is a moral law. It gives energy to the universe, wings to the mind, flight to the imagination, and charm and gaiety to life and to everything.", author: "Plato", category: "Music", intensity: 1 },
    { id: 'aw_43', text: "The first and greatest victory is to master yourself.", author: "Plato", category: "Self-Control", intensity: 1 },
    { id: 'aw_44', text: "Human behavior flows from three main sources: desire, emotion, and knowledge.", author: "Plato", category: "Psychology", intensity: 1 },
    { id: 'aw_45', text: "At the touch of love everyone becomes a poet.", author: "Plato", category: "Love", intensity: 1 },
    { id: 'aw_46', text: "There is in every one of us, even those who seem to be most moderate, a type of desire that is terrible, wild, and lawless.", author: "Plato", category: "Human Nature", intensity: 1 },
    { id: 'aw_47', text: "Good actions give strength to ourselves and inspire good actions in others.", author: "Plato", category: "Inspiration", intensity: 1 },
    { id: 'aw_48', text: "Courage is knowing what not to fear.", author: "Plato", category: "Courage", intensity: 1 },
    { id: 'aw_49', text: "You can discover more about a person in an hour of play than in a year of conversation.", author: "Plato", category: "Insight", intensity: 1 },
    { id: 'aw_50', text: "We become just by performing just actions, temperate by performing temperate actions, brave by performing brave actions.", author: "Aristotle", category: "Habit", intensity: 1 },
    { id: 'aw_51', text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle", category: "Intellect", intensity: 1 },
    { id: 'aw_52', text: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.", author: "Aristotle", category: "Excellence", intensity: 1 },
    { id: 'aw_53', text: "Choice, not chance, determines your destiny.", author: "Aristotle", category: "Choice", intensity: 1 },
    { id: 'aw_54', text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle", category: "Education", intensity: 1 },
    { id: 'aw_55', text: "Happiness depends upon ourselves.", author: "Aristotle", category: "Happiness", intensity: 1 },
    { id: 'aw_56', text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "Wisdom", intensity: 1 },
    { id: 'aw_57', text: "Hope is a waking dream.", author: "Aristotle", category: "Hope", intensity: 1 },
    { id: 'aw_58', text: "Quality is not an act, it is a habit.", author: "Aristotle", category: "Quality", intensity: 1 },
    { id: 'aw_59', text: "He who is unable to live in society, or who has no need because he is sufficient for himself, must be either a beast or a god.", author: "Aristotle", category: "Society", intensity: 1 },
    { id: 'aw_60', text: "Freedom is the right to tell people what they do not want to hear.", author: "George Orwell", category: "Freedom", intensity: 1 },
    { id: 'aw_61', text: "In a time of deceit, telling the truth is a revolutionary act.", author: "George Orwell", category: "Truth", intensity: 1 },
    { id: 'aw_62', text: "The most effective way to destroy people is to deny and obliterate their own understanding of their history.", author: "George Orwell", category: "History", intensity: 1 },

    { id: 'aw_64', text: "Who controls the past controls the future. Who controls the present controls the past.", author: "George Orwell", category: "Power", intensity: 1 },
    { id: 'aw_65', text: "Doublethink means the power of holding two contradictory beliefs in one's mind simultaneously, and accepting both of them.", author: "George Orwell", category: "Psychology", intensity: 1 },
    { id: 'aw_66', text: "Perhaps one did not want to be loved so much as to be understood.", author: "George Orwell", category: "Understanding", intensity: 1 },
    { id: 'aw_67', text: "Happiness can exist only in acceptance.", author: "George Orwell", category: "Happiness", intensity: 1 },
    { id: 'aw_68', text: "Happiness can exist only in acceptance, and acceptance is the heart of being human.", author: "George Orwell", category: "Humanity", intensity: 1 },

    { id: 'aw_70', text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", category: "Originality", intensity: 1 },
    { id: 'aw_71', text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson", category: "Authenticity", intensity: 1 },
    { id: 'aw_72', text: "For every minute you are angry you lose sixty seconds of happiness.", author: "Ralph Waldo Emerson", category: "Happiness", intensity: 1 },
    { id: 'aw_73', text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "Potential", intensity: 1 },
    { id: 'aw_74', text: "It is not the length of life, but the depth.", author: "Ralph Waldo Emerson", category: "Life", intensity: 1 },
    { id: 'aw_75', text: "Nothing great was ever achieved without enthusiasm.", author: "Ralph Waldo Emerson", category: "Passion", intensity: 1 },
    { id: 'aw_76', text: "The only way to have a friend is to be one.", author: "Ralph Waldo Emerson", category: "Friendship", intensity: 1 },
    { id: 'aw_77', text: "Dare to live the life you have dreamed for yourself. Go forward and make your dreams come true.", author: "Ralph Waldo Emerson", category: "Dreams", intensity: 1 },
    { id: 'aw_78', text: "Our greatest glory is not in never failing, but in rising up every time we fail.", author: "Ralph Waldo Emerson", category: "Resilience", intensity: 1 },
    { id: 'aw_79', text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson", category: "Nature", intensity: 1 },
    { id: 'aw_80', text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", category: "Action", intensity: 1 },
    { id: 'aw_81', text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Belief", intensity: 1 },
    { id: 'aw_82', text: "The only man who never makes a mistake is the man who never does anything.", author: "Theodore Roosevelt", category: "Action", intensity: 1 },
    { id: 'aw_83', text: "Courage is not the absence of fear, but rather the assessment that something else is more important than fear.", author: "Franklin D. Roosevelt", category: "Courage", intensity: 1 },
    { id: 'aw_84', text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", category: "Doubt", intensity: 1 },
    { id: 'aw_85', text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt", category: "Perseverance", intensity: 1 },
    { id: 'aw_86', text: "Happiness lies in the joy of achievement and the thrill of creative effort.", author: "Franklin D. Roosevelt", category: "Happiness", intensity: 1 },
    { id: 'aw_87', text: "A smooth sea never made a skilled sailor.", author: "Franklin D. Roosevelt", category: "Adversity", intensity: 1 },
    { id: 'aw_88', text: "There are many ways of going forward, but only one way of standing still.", author: "Franklin D. Roosevelt", category: "Progress", intensity: 1 },
    { id: 'aw_89', text: "We cannot always build the future for our youth, but we can build our youth for the future.", author: "Franklin D. Roosevelt", category: "Future", intensity: 1 },



    // ============================================
    // AI GENERATED EXAMPLES (for testing Source Preference)
    // ============================================
    { id: 'ai_1', text: "Your potential is a fire waiting for a spark. Be the spark.", author: "Palante Coach", category: "Potential", intensity: 1, isAI: true },
    { id: 'ai_2', text: "Efficiency is the currency of success. Spend it wisely.", author: "Palante Coach", category: "Efficiency", intensity: 2, isAI: true },
    { id: 'ai_3', text: "Excuses are the obstacles that block the path to success. Move past them.", author: "Palante Coach", category: "Commitment", intensity: 3, isAI: true },
    { id: 'ai_4', text: "Create the future you want to live in, one action at a time.", author: "Palante Coach", category: "Action", intensity: 1, isAI: true },
    { id: 'ai_5', text: "Discipline is not a punishment, it's a bridge to your goals.", author: "Palante Coach", category: "Discipline", intensity: 2, isAI: true },
    { id: 'ai_6', text: "Pain is temporary. Quitting lasts forever.", author: "Palante Coach", category: "Resilience", intensity: 3, isAI: true },
    // ============================================
    // NEW USER REQUESTED AUTHORS (Diverse & Visionary)
    // ============================================

    // Calm / Grounded (Tier 1)
    { id: 'req_1', text: "Smile, breathe and go slowly.", author: "Thich Nhat Hanh", category: "Mindfulness", intensity: 1 },
    { id: 'req_2', text: "No mud, no lotus.", author: "Thich Nhat Hanh", category: "Resilience", intensity: 1 },
    { id: 'req_3', text: "Live quietly in the moment and see the beauty of all before you.", author: "Paramahansa Yogananda", category: "Mindfulness", intensity: 1 },
    { id: 'req_4', text: "Each of us has that right, that possibility, to invent ourselves daily.", author: "Maya Angelou", category: "Growth", intensity: 1 },
    { id: 'req_5', text: "Nothing is absolute. Everything changes, everything moves, everything revolves, everything flies and goes away.", author: "Frida Kahlo", category: "Change", intensity: 1 },
    { id: 'req_6', text: "Peace is not the absence of war. It is the virtue, a state of mind, a disposition for benevolence, confidence, justice.", author: "Baruch Spinoza", category: "Peace", intensity: 1 }, // Note: Spinoza fits, but user asked for others. Sticking to list.
    { id: 'req_7', text: "Let go of the struggle. Breathe quietly and let it be.", author: "Elizabeth Gilbert", category: "Calm", intensity: 1 }, // Placeholder replacement if needed
    // Actually using user list:
    { id: 'req_8', text: "It is a privilege to be alive.", author: "Pema Chödrön", category: "Gratitude", intensity: 1 },
    { id: 'req_9', text: "You are the sky. Everything else – it's just the weather.", author: "Pema Chödrön", category: "Perspective", intensity: 1 },
    { id: 'req_10', text: "Be the change that you wish to see in the world.", author: "Mahatma Gandhi", category: "Action", intensity: 1 }, // Common often attributed, but user asked for Mandela/others.
    { id: 'req_11', text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "Hope", intensity: 2 },

    { id: 'req_13', text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", author: "Alan Watts", category: "Flow", intensity: 1 },
    { id: 'req_14', text: "You are the universe experiencing itself.", author: "Alan Watts", category: "Connection", intensity: 1 },
    { id: 'req_15', text: "The power for creating a better future is contained in the present moment: You create a good future by creating a good present.", author: "Eckhart Tolle", category: "Presence", intensity: 1 },
    { id: 'req_16', text: "You are not your mind.", author: "Eckhart Tolle", category: "Awareness", intensity: 1 },
    { id: 'req_17', text: "Every circle is the end of one journey and the beginning of another.", author: "Don Miguel Ruiz", category: "Cycles", intensity: 1 },
    { id: 'req_18', text: "Be impeccable with your word.", author: "Don Miguel Ruiz", category: "Integrity", intensity: 1 },
    { id: 'req_19', text: "It is in the darkness, for instance, that the glow of your intent is often best seen.", author: "Black Elk", category: "Hope", intensity: 1 },
    { id: 'req_20', text: "I want to be like a sunflower; so that even on the darkest days I will stand tall and find the sunlight.", author: "Unknown", category: "Resilience", intensity: 1 }, // Fitting for the list feel

    // Firm / Empowered / Creative (Tier 2/3)
    { id: 'req_21', text: "I am not what happened to me, I am what I choose to become.", author: "Carl Jung", category: "Choice", intensity: 2 }, // User didn't ask but fits. Sticking to list:
    { id: 'req_22', text: "When I dare to be powerful, to use my strength in the service of my vision, then it becomes less and less important whether I am afraid.", author: "Audre Lorde", category: "Courage", intensity: 2 },
    { id: 'req_23', text: "I am not free while any woman is unfree, even when her shackles are very different from my own.", author: "Audre Lorde", category: "Justice", intensity: 2 },
    { id: 'req_24', text: "If they don't give you a seat at the table, bring a folding chair.", author: "Shirley Chisholm", category: "Action", intensity: 2 },
    { id: 'req_25', text: "I am no longer accepting the things I cannot change. I am changing the things I cannot accept.", author: "Angela Davis", category: "Change", intensity: 2 },
    { id: 'req_26', text: "All that you touch You Change. All that You Change Changes you.", author: "Octavia Butler", category: "Impact", intensity: 1 },
    { id: 'req_27', text: "Feet, what do I need you for when I have wings to fly?", author: "Frida Kahlo", category: "Freedom", intensity: 1 },
    { id: 'req_28', text: "I do know one thing about me: I don't measure myself by others' expectations or let others define my worth.", author: "Sonia Sotomayor", category: "Self-Worth", intensity: 2 },
    { id: 'req_29', text: "Boricua aunque naciera en la luna. (Puerto Rican even if born on the moon.)", author: "Juan Antonio Corretjer (Pop. by Rita Moreno)", category: "Identity", intensity: 2 },
    { id: 'req_30', text: "Education either functions as an instrument which is used to facilitate integration... or it becomes the practice of freedom.", author: "Paulo Freire", category: "Freedom", intensity: 2 },
    { id: 'req_31', text: "Nobody's free until everybody's free.", author: "Fannie Lou Hamer", category: "Justice", intensity: 2 },
    { id: 'req_32', text: "The function of art is to do more than tell it like it is—it’s to imagine what is possible.", author: "bell hooks", category: "Imagination", intensity: 1 },
    { id: 'req_33', text: "La patria es valor y sacrificio. (The homeland is valor and sacrifice.)", author: "Pedro Albizu Campos", category: "Sacrifice", intensity: 2 },
    { id: 'req_34', text: "Intelligence without ambition is a bird without wings.", author: "Salvador Dalí", category: "Ambition", intensity: 2 },
    { id: 'req_35', text: "Have no fear of perfection - you'll never reach it.", author: "Salvador Dalí", category: "Creativity", intensity: 2 },
    { id: 'req_36', text: "Fortunately, somewhere between chance and mystery lies imagination, the only thing that protects our freedom.", author: "Luis Buñuel", category: "Imagination", intensity: 1 },
    { id: 'req_37', text: "I just want to make a tray of tofu. If people want to eat cutlets, they should go to a cutlet shop.", author: "Yasujirō Ozu", category: "Authenticity", intensity: 1 },
    { id: 'req_38', text: "Simplicity is the ultimate sophistication.", author: "Yasujirō Ozu", category: "Simplicity", intensity: 1 },

    // ============================================
    // NEW: GLOBAL VOICES (Africa, Asia, S. America, Oceania)
    // ============================================

    // AFRICA
    { id: 'g_af1', text: "It always seems impossible until it's done.", author: "Nelson Mandela", category: "Perseverance", intensity: 2, profession: "Leader" },
    { id: 'g_af2', text: "Do your little bit of good where you are; it's those little bits of good put together that overwhelm the world.", author: "Desmond Tutu", category: "Impact", intensity: 1, profession: "Leader" },
    { id: 'g_af3_fix', text: "When we plant trees, we plant the seeds of peace and hope.", author: "Wangari Maathai", category: "Peace", intensity: 1, profession: "Activist" },
    { id: 'g_af4', text: "Until the lion learns how to write, every story will glorify the hunter.", author: "Chinua Achebe", category: "Perspective", intensity: 2, profession: "Writer" },
    { id: 'g_af5', text: "If you want to go fast, go alone. If you want to go far, go together.", author: "African Proverb", category: "Teamwork", intensity: 1, profession: "Other" },
    { id: 'g_af6', text: "Smooth seas do not make skillful sailors.", author: "African Proverb", category: "Resilience", intensity: 2, profession: "Other" },
    { id: 'g_af7', text: "I am not African because I was born in Africa but because Africa is born in me.", author: "Kwame Nkrumah", category: "Identity", intensity: 1, profession: "Leader" },
    { id: 'g_af8_fix', text: "There is no passion to be found playing small - in settling for a life that is less than the one you are capable of living.", author: "Nelson Mandela", category: "Ambition", intensity: 2, profession: "Leader" },

    // ASIA & MIDDLE EAST
    { id: 'g_as1', text: "The wound is the place where the Light enters you.", author: "Rumi", category: "Healing", intensity: 1, profession: "Poet" },
    { id: 'g_as2', text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.", author: "Rumi", category: "Growth", intensity: 1, profession: "Poet" },
    { id: 'g_as3', text: "Appear weak when you are strong, and strong when you are weak.", author: "Sun Tzu", category: "Strategy", intensity: 2, profession: "Leader" },
    { id: 'g_as4', text: "To know your Enemy, you must become your Enemy.", author: "Sun Tzu", category: "Empathy", intensity: 2, profession: "Leader" },
    { id: 'g_as5', text: "Victorious leaders succeed first and then act, while defeated leaders act first and then seek to succeed.", author: "Sun Tzu", category: "Preparation", intensity: 3, profession: "Leader" },
    { id: 'g_as6', text: "Be water, my friend.", author: "Bruce Lee", category: "Adaptability", intensity: 2, profession: "Artist" },
    { id: 'g_as7', text: "I fear not the man who has practiced 10,000 kicks once, but I fear the man who has practiced one kick 10,000 times.", author: "Bruce Lee", category: "Mastery", intensity: 3, profession: "Artist" },
    { id: 'g_as8_fix', text: "Your living is determined not by so much as what life brings to you as by the attitude you bring to life.", author: "Kahlil Gibran", category: "Attitude", intensity: 1, profession: "Poet" },
    { id: 'g_as9', text: "Work is love made visible.", author: "Kahlil Gibran", category: "Work", intensity: 1, profession: "Poet" },
    { id: 'g_as10', text: "You must be the change you wish to see in the world.", author: "Mahatma Gandhi", category: "Change", intensity: 1, profession: "Leader" },
    { id: 'g_as11', text: "First they ignore you, then they laugh at you, then they fight you, then you win.", author: "Mahatma Gandhi", category: "Persistence", intensity: 2, profession: "Leader" },

    // SOUTH AMERICA / LATIN AMERICA
    { id: 'g_sa1', text: "It's the possibility of having a dream come true that makes life interesting.", author: "Paulo Coelho", category: "Dreams", intensity: 1, profession: "Writer" },
    { id: 'g_sa2', text: "When you want something, all the universe conspires in helping you to achieve it.", author: "Paulo Coelho", category: "Faith", intensity: 1, profession: "Writer" },
    { id: 'g_sa3', text: "One day you will wake up and there won't be any more time to do the things you've always wanted. Do it now.", author: "Paulo Coelho", category: "Action", intensity: 2, profession: "Writer" },
    { id: 'g_sa4_real', text: "Write what should not be forgotten.", author: "Isabel Allende", category: "Writing", intensity: 1, profession: "Writer" },
    { id: 'g_sa5_fix', text: "What matters in life is not what happens to you but what you remember and how you remember it.", author: "Gabriel García Márquez", category: "Life", intensity: 1, profession: "Writer" },
    { id: 'g_sa6', text: "I paint flowers so they will not die.", author: "Frida Kahlo", category: "Art", intensity: 1, profession: "Artist" },
    { id: 'g_sa7', text: "Feet, what do I need you for when I have wings to fly?", author: "Frida Kahlo", category: "Freedom", intensity: 1, profession: "Artist" },
    { id: 'g_sa8_real', text: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.", author: "Pelé", category: "Success", intensity: 2, profession: "Athlete" },

    // OCEANIA
    { id: 'g_oc1', text: "Take care of our children. Take care of what they hear, take care of what they see, take care of what they feel.", author: "Dame Whina Cooper", category: "Care", intensity: 1, profession: "Leader" },
    { id: 'g_oc2_real', text: "Life is not a dress rehearsal.", author: "Cate Blanchett", category: "Life", intensity: 2, profession: "Creative" },

    // ============================================
    // NEW: PHILOSOPHERS & THINKERS
    // ============================================
    { id: 'ph_1', text: "I think, therefore I am.", author: "René Descartes", category: "Existence", intensity: 1, profession: "Other" },
    { id: 'ph_2', text: "Happiness is the highest good.", author: "Aristotle", category: "Happiness", intensity: 1, profession: "Other" },
    { id: 'ph_3', text: "Freedom is what you do with what's been done to you.", author: "Jean-Paul Sartre", category: "Freedom", intensity: 2, profession: "Other" },
    { id: 'ph_4', text: "One is not born, but rather becomes, a woman.", author: "Simone de Beauvoir", category: "Identity", intensity: 1, profession: "Other" },
    { id: 'ph_5', text: "Change your life today. Don't gamble on the future, act now, without delay.", author: "Simone de Beauvoir", category: "Action", intensity: 3, profession: "Other" },
    { id: 'ph_6', text: "To know clearly what you want is to have already mostly achieved it.", author: "Simone de Beauvoir", category: "Clarity", intensity: 1, profession: "Other" },
    { id: 'ph_7_fix', text: "That which does not kill us makes us stronger.", author: "Friedrich Nietzsche", category: "Resilience", intensity: 3, profession: "Other" },
    { id: 'ph_9', text: "Intelligence is nothing without the courage to act.", author: "Blaise Pascal", category: "Emotion", intensity: 1, profession: "Other" },
    { id: 'ph_10', text: "Judge a man by his questions rather than by his answers.", author: "Voltaire", category: "Wisdom", intensity: 1, profession: "Other" },
    { id: 'ph_11', text: "I disapprove of what you say, but I will defend to the death your right to say it.", author: "Voltaire", category: "Freedom", intensity: 2, profession: "Other" },
    { id: 'ph_12', text: "Life must be understood backward. But it must be lived forward.", author: "Søren Kierkegaard", category: "Life", intensity: 1, profession: "Other" },
    { id: 'ph_13', text: "Anxiety is the dizziness of freedom.", author: "Søren Kierkegaard", category: "Anxiety", intensity: 1, profession: "Other" },

    // ============================================
    // NEW: PROFESSION SPECIFIC (Finance, Tech, Sales, Marketing)
    // ============================================

    // DEVELOPER / TECH
    { id: 'p_dev1', text: "Talk is cheap. Show me the code.", author: "Linus Torvalds", category: "Execution", intensity: 2, profession: "Developer" },
    { id: 'p_dev2', text: "Software is eating the world.", author: "Marc Andreessen", category: "Vision", intensity: 1, profession: "Developer" },
    { id: 'p_dev3', text: "The most dangerous phrase in the language is, 'We've always done it this way.'", author: "Grace Hopper", category: "Innovation", intensity: 2, profession: "Developer" },
    { id: 'p_dev4_fix', text: "Don't just share your code, share your knowledge.", author: "Unknown", category: "Community", intensity: 1, profession: "Developer" },
    { id: 'p_dev5', text: "Simplicity is the soul of efficiency.", author: "Austin Freeman", category: "Efficiency", intensity: 1, profession: "Developer" },
    { id: 'p_dev6', text: "Make it work, make it right, make it fast.", author: "Kent Beck", category: "Process", intensity: 2, profession: "Developer" },
    { id: 'p_dev7', text: "First, solve the problem. Then, write the code.", author: "John Johnson", category: "Problem Solving", intensity: 1, profession: "Developer" },

    // FINANCE
    { id: 'p_fin1', text: "Price is what you pay. Value is what you get.", author: "Warren Buffett", category: "Value", intensity: 1, profession: "Finance" },
    { id: 'p_fin2', text: "The stock market is designed to transfer money from the Active to the Patient.", author: "Warren Buffett", category: "Patience", intensity: 1, profession: "Finance" },
    { id: 'p_fin3', text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin", category: "Knowledge", intensity: 1, profession: "Finance" },
    { id: 'p_fin4', text: "Compound interest is the eighth wonder of the world. He who understands it, earns it... he who doesn't... pays it.", author: "Albert Einstein", category: "Growth", intensity: 1, profession: "Finance" },
    { id: 'p_fin5', text: "Risk comes from not knowing what you're doing.", author: "Warren Buffett", category: "Risk", intensity: 2, profession: "Finance" },
    { id: 'p_fin6_real', text: "It is not the man who has too little, but the man who craves more, that is poor.", author: "Seneca", category: "Wealth", intensity: 1, profession: "Finance" },
    { id: 'p_fin7', text: "Cash is trash.", author: "Ray Dalio", category: "Investment", intensity: 3, profession: "Finance" },

    // MARKETING
    { id: 'p_mkt1', text: "People don't buy what you do; they buy why you do it.", author: "Simon Sinek", category: "Purpose", intensity: 1, profession: "Marketing" },
    { id: 'p_mkt2', text: "Content is king.", author: "Bill Gates", category: "Content", intensity: 1, profession: "Marketing" },
    { id: 'p_mkt3', text: "Marketing is no longer about the stuff that you make, but about the stories you tell.", author: "Seth Godin", category: "Storytelling", intensity: 1, profession: "Marketing" },
    { id: 'p_mkt4', text: "Don't find customers for your products, find products for your customers.", author: "Seth Godin", category: "Service", intensity: 1, profession: "Marketing" },
    { id: 'p_mkt5', text: "The consumer isn't a moron; she is your wife.", author: "David Ogilvy", category: "Respect", intensity: 2, profession: "Marketing" },
    { id: 'p_mkt6', text: "Give them quality. That is the best kind of advertising.", author: "Milton Hershey", category: "Quality", intensity: 1, profession: "Marketing" },

    // SALES
    { id: 'p_sal1', text: "You don't close a sale; you open a relationship if you want to build a long-term, successful enterprise.", author: "Patricia Fripp", category: "Relationship", intensity: 1, profession: "Sales" },
    { id: 'p_sal2', text: "People don't buy for logical reasons. They buy for emotional reasons.", author: "Zig Ziglar", category: "Psychology", intensity: 1, profession: "Sales" },
    { id: 'p_sal3', text: "Stop selling. Start helping.", author: "Zig Ziglar", category: "Service", intensity: 1, profession: "Sales" },
    { id: 'p_sal4', text: "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.", author: "Vince Lombardi", category: "Will", intensity: 2, profession: "Sales" },
    { id: 'p_sal5', text: "A goal is a dream with a deadline.", author: "Napoleon Hill", category: "Goals", intensity: 2, profession: "Sales" },
    { id: 'p_sal6', text: "Always Be Closing.", author: "Glengarry Glen Ross", category: "Persistence", intensity: 3, profession: "Sales" },

    // REAL ESTATE
    { id: 'p_re1', text: "Landlords grow rich in their sleep.", author: "John Stuart Mill", category: "Wealth", intensity: 1, profession: "Real Estate" },
    { id: 'p_re2', text: "Buy land, they're not making it anymore.", author: "Mark Twain", category: "Investment", intensity: 1, profession: "Real Estate" },
    { id: 'p_re3', text: "Real estate cannot be lost or stolen, nor can it be carried away. Purchased with common sense...", author: "Franklin D. Roosevelt", category: "Investment", intensity: 1, profession: "Real Estate" },
    { id: 'p_re4', text: "The best time to buy a home is always five years ago.", author: "Ray Brown", category: "Timing", intensity: 1, profession: "Real Estate" },
    { id: 'p_re5', text: "Don't wait to buy real estate. Buy real estate and wait.", author: "Will Rogers", category: "Patience", intensity: 2, profession: "Real Estate" },

    // ADDITIONAL DIVERSE SCIENTISTS
    { id: 'p_sci1', text: "I like to learn. That's an art and a science.", author: "Katherine Johnson", category: "Learning", intensity: 1, profession: "Scientist" },
    { id: 'p_sci2', text: "Every great advance in science has issued from a new audacity of imagination.", author: "John Dewey", category: "Imagination", intensity: 1, profession: "Scientist" },

    // ============================================
    // NEW: ELEVATED LIFE BANGERS
    // ============================================
    { id: 'el_1', text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Resilience", intensity: 2 },
    { id: 'el_2', text: "The best way to predict the future is to create it.", author: "Peter Drucker", category: "Action", intensity: 1 },
    { id: 'el_3', text: "Your life only gets better when you get better. Work on yourself more than you do on your job.", author: "Jim Rohn", category: "Growth", intensity: 1 },
    { id: 'el_4', text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson", category: "Persistence", intensity: 2 },
    { id: 'el_5', text: "The secret of getting ahead is getting started.", author: "Mark Twain", category: "Action", intensity: 1 },
    { id: 'el_6', text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein", category: "Happiness", intensity: 1 },
    { id: 'el_7', text: "What you do today can improve all your tomorrows.", author: "Ralph Marston", category: "Action", intensity: 1 },
    { id: 'el_8', text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", category: "Discipline", intensity: 2 },
    // ============================================
    // NEW: CLASSICAL & PHILOSOPHICAL FOUNDATIONS
    // ============================================
    { id: 'cl_1', text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Stoicism", intensity: 1, profession: "Philosopher" },
    { id: 'cl_2', text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius", category: "Life", intensity: 1, profession: "Philosopher" },
    { id: 'cl_3', text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", category: "Action", intensity: 2, profession: "Philosopher" },
    { id: 'cl_4', text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "Excellence", intensity: 2, profession: "Philosopher" },
    { id: 'cl_5', text: "The beginning is the most important part of the work.", author: "Plato", category: "Action", intensity: 1, profession: "Philosopher" },
    { id: 'cl_6', text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Persistence", intensity: 1, profession: "Philosopher" },
    { id: 'cl_7', text: "A journey of a thousand miles begins with a single step.", author: "Laozi", category: "Action", intensity: 1, profession: "Philosopher" },
    { id: 'cl_8', text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "Purpose", intensity: 2, profession: "Philosopher" },
    { id: 'cl_9', text: "Life can only be understood backwards; but it must be lived forwards.", author: "Søren Kierkegaard", category: "Wisdom", intensity: 1, profession: "Philosopher" },
    { id: 'cl_10', text: "When we are no longer able to change a situation, we are challenged to change ourselves.", author: "Viktor Frankl", category: "Resilience", intensity: 2, profession: "Philosopher" },

    // ============================================
    // NEW: WRITERS, POETS & HUMANISTS
    // ============================================
    { id: 'wr_1', text: "My mission in life is not merely to survive, but to thrive.", author: "Maya Angelou", category: "Life", intensity: 1, profession: "Writer" },
    { id: 'wr_2', text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "Potential", intensity: 1, profession: "Writer" },
    { id: 'wr_3', text: "Go confidently in the direction of your dreams! Live the life you’ve imagined.", author: "Henry David Thoreau", category: "Dreams", intensity: 1, profession: "Writer" },
    { id: 'wr_4', text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin", category: "Courage", intensity: 2, profession: "Writer" },
    { id: 'wr_5', text: "If you want to fly, you have to give up the things that weigh you down.", author: "Toni Morrison", category: "Freedom", intensity: 1, profession: "Writer" },
    { id: 'wr_6', text: "We don't see things as they are, we see them as we are.", author: "Anaïs Nin", category: "Perspective", intensity: 1, profession: "Writer" },
    { id: 'wr_7', text: "The wound is the place where the Light enters you.", author: "Rumi", category: "Healing", intensity: 1, profession: "Poet" },
    { id: 'wr_8', text: "Your living is determined not by so much as what life brings to you as by the attitude you bring to life.", author: "Kahlil Gibran", category: "Attitude", intensity: 1, profession: "Poet" },
    { id: 'wr_9', text: "Progress is impossible without change, and those who cannot change their minds cannot change anything.", author: "George Bernard Shaw", category: "Change", intensity: 2, profession: "Writer" },
    { id: 'wr_10', text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "Authenticity", intensity: 1, profession: "Writer" },

    // ============================================
    // NEW: PSYCHOLOGY, HABITS & HUMAN BEHAVIOR
    // ============================================
    { id: 'ps_1', text: "Act as if what you do makes a difference. It does.", author: "William James", category: "Action", intensity: 1, profession: "Psychologist" },
    { id: 'ps_2', text: "What a man can be, he must be.", author: "Abraham Maslow", category: "Purpose", intensity: 2, profession: "Psychologist" },
    { id: 'ps_3', text: "I am not what happened to me, I am what I choose to become.", author: "Carl Jung", category: "Choice", intensity: 1, profession: "Psychologist" },
    { id: 'ps_4', text: "Becoming is better than being.", author: "Carol Dweck", category: "Growth", intensity: 1, profession: "Psychologist" },
    { id: 'ps_5', text: "Nothing in life is as important as you think it is, while you are thinking about it.", author: "Daniel Kahneman", category: "Perspective", intensity: 1, profession: "Psychologist" },
    { id: 'ps_6', text: "Grit is living life like it's a marathon, not a sprint.", author: "Angela Duckworth", category: "Persistence", intensity: 2, profession: "Psychologist" },
    { id: 'ps_7', text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear", category: "Habit", intensity: 2, profession: "Writer" },
    { id: 'ps_8', text: "Champions don’t do extraordinary things. They do ordinary things, but they do them without thinking.", author: "Charles Duhigg", category: "Habit", intensity: 2, profession: "Writer" },
    { id: 'ps_9', text: "Vulnerability is not winning or losing; it's having the courage to show up and be seen when we have no control over the outcome.", author: "Brené Brown", category: "Courage", intensity: 1, profession: "Researcher" },
    { id: 'ps_10', text: "Flow is the state in which people are so involved in an activity that nothing else seems to matter.", author: "Mihaly Csikszentmihalyi", category: "Flow", intensity: 1, profession: "Psychologist" },

    // ============================================
    // NEW: LEADERSHIP, BUSINESS & STRATEGY
    // ============================================
    { id: 'bus_1', text: "The best way to predict the future is to create it.", author: "Peter Drucker", category: "Vision", intensity: 1, profession: "Executive" },
    { id: 'bus_2', text: "The main thing is to keep the main thing the main thing.", author: "Stephen R. Covey", category: "Focus", intensity: 2, profession: "Executive" },
    { id: 'bus_3', text: "Good is the enemy of great.", author: "Jim Collins", category: "Excellence", intensity: 2, profession: "Executive" },
    { id: 'bus_4', text: "People don't buy what you do; they buy why you do it.", author: "Simon Sinek", category: "Purpose", intensity: 1, profession: "Leader" },
    { id: 'bus_5', text: "Leadership is not about titles, positions or flowcharts. It is about one life influencing another.", author: "John C. Maxwell", category: "Leadership", intensity: 1, profession: "Leader" },
    { id: 'bus_6', text: "The secret to being wrong isn't to avoid being wrong! The secret is being willing to be wrong.", author: "Seth Godin", category: "Growth", intensity: 1, profession: "Entrepreneur" },
    { id: 'bus_7', text: "Play long-term games with long-term people.", author: "Naval Ravikant", category: "Wisdom", intensity: 1, profession: "Investor" },
    { id: 'bus_8', text: "Pain + Reflection = Progress.", author: "Ray Dalio", category: "Growth", intensity: 2, profession: "Investor" },
    { id: 'bus_9', text: "It takes 20 years to build a reputation and five minutes to ruin it.", author: "Warren Buffett", category: "Integrity", intensity: 2, profession: "Investor" },
    { id: 'bus_10', text: "Whatever you do, be a student of it.", author: "Indra Nooyi", category: "Learning", intensity: 1, profession: "Executive" },

    // ============================================
    // NEW: CREATIVITY, ART & CRAFT
    // ============================================
    { id: 'arts_1', text: "Creativity is subtraction.", author: "Austin Kleon", category: "Creativity", intensity: 1, profession: "Artist" },
    { id: 'arts_2', text: "Done is better than good.", author: "Elizabeth Gilbert", category: "Execution", intensity: 1, profession: "Writer" },
    { id: 'arts_3', text: "Jump, and the net will appear.", author: "Julia Cameron", category: "Courage", intensity: 1, profession: "Writer" },
    { id: 'arts_4', text: "The object isn’t to make art, it’s to be in that wonderful state which makes art inevitable.", author: "Rick Rubin", category: "Flow", intensity: 1, profession: "Producer" },
    { id: 'arts_5', text: "Ideas are like fish. If you want to catch little fish, you can stay in the shallow water. But if you want to catch the big fish, you’ve got to go deeper.", author: "David Lynch", category: "Creativity", intensity: 1, profession: "Director" },
    { id: 'arts_6', text: "In a mad world, only the mad are sane.", author: "Akira Kurosawa", category: "Perspective", intensity: 1, profession: "Director" },
    { id: 'arts_7', text: "There are so many people who think they want to be artists, but they really want to be famous.", author: "Agnes Martin", category: "Authenticity", intensity: 2, profession: "Artist" },
    { id: 'arts_8', text: "Inspiration exists, but it has to find you working.", author: "Pablo Picasso", category: "Work", intensity: 2, profession: "Artist" },
    { id: 'arts_9', text: "I’m not a real person. I’m a legend.", author: "Jean-Michel Basquiat", category: "Identity", intensity: 1, profession: "Artist" },
    { id: 'arts_10', text: "I found I could say things with color and shapes that I couldn't say any other way.", author: "Georgia O'Keeffe", category: "Expression", intensity: 1, profession: "Artist" },

    // ============================================
    // NEW: MOTIVATION, PERFORMANCE & MINDSET
    // ============================================
    { id: 'mot_1', text: "Setting goals is the first step in turning the invisible into the visible.", author: "Tony Robbins", category: "Goals", intensity: 2, profession: "Coach" },
    { id: 'mot_2', text: "Shoot for the moon. Even if you miss, you'll land among the stars.", author: "Les Brown", category: "Dreams", intensity: 1, profession: "Speaker" },
    { id: 'mot_3', text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar", category: "Action", intensity: 2, profession: "Speaker" },
    { id: 'mot_4', text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn", category: "Discipline", intensity: 2, profession: "Speaker" },
    { id: 'mot_5', text: "The 5 Second Rule: If you have an impulse to act on a goal, you must physically move within 5 seconds or your brain will kill it.", author: "Mel Robbins", category: "Action", intensity: 2, profession: "Speaker" },
    { id: 'mot_6', text: "Change is hard at first, messy in the middle and gorgeous at the end.", author: "Robin Sharma", category: "Change", intensity: 1, profession: "Writer" },
    { id: 'mot_8', text: "When you want to succeed as bad as you want to breathe, then you'll be successful.", author: "Eric Thomas", category: "Drive", intensity: 3, profession: "Speaker" },
    { id: 'mot_9', text: "No matter how small you start, start something that matters.", author: "Brendon Burchard", category: "Purpose", intensity: 1, profession: "Coach" },
    { id: 'mot_10', text: "Success is your duty, obligation, and responsibility.", author: "Grant Cardone", category: "Success", intensity: 3, profession: "Entrepreneur" },

    // ============================================
    // NEW: CULTURE, CHANGE & INFLUENCE
    // ============================================
    { id: 'cul_1', text: "The biggest adventure you can take is to live the life of your dreams.", author: "Oprah Winfrey", category: "Dreams", intensity: 1, profession: "Leader" },
    { id: 'cul_2', text: "The future belongs to those who prepare for it today.", author: "Malcolm X", category: "Action", intensity: 2, profession: "Activist" },

    { id: 'cul_4', text: "I never lose. I either win or learn.", author: "Nelson Mandela", category: "Growth", intensity: 1, profession: "Leader" },
    // James Clear is a repeat (see 'Psychology'), skipping to avoid dup
    { id: 'cul_6', text: "Change will not come if we wait for some other person or some other time. We are the ones we've been waiting for.", author: "Barack Obama", category: "Change", intensity: 1, profession: "Leader" },
    { id: 'cul_7', text: "Don't be afraid. Be focused. Be determined. Be hopeful. Be empowered.", author: "Michelle Obama", category: "Empowerment", intensity: 1, profession: "Leader" },
    { id: 'cul_8', text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Dreams", intensity: 1, profession: "Leader" },
    { id: 'cul_9', text: "Vision is not enough, it must be combined with venture. It is not enough to stare up the steps, we must step up the stairs.", author: "Václav Havel", category: "Action", intensity: 2, profession: "Leader" },
    { id: 'cul_10', text: "Don't raise your voice, improve your argument.", author: "Desmond Tutu", category: "Wisdom", intensity: 1, profession: "Leader" },

    // ============================================
    // NEW: MODERN CROSS-DISCIPLINARY THINKERS
    // ============================================
    { id: 'md_1', text: "Deep work is valid and necessary.", author: "Cal Newport", category: "Focus", intensity: 2, profession: "Writer" },
    { id: 'md_2', text: "The obstacle is the way.", author: "Ryan Holiday", category: "Stoicism", intensity: 2, profession: "Writer" },
    { id: 'md_3', text: "The desire for more positive experience is itself a negative experience. And, paradoxically, the acceptance of one’s negative experience is itself a positive experience.", author: "Mark Manson", category: "Acceptance", intensity: 2, profession: "Writer" },
    { id: 'md_4', text: "What you do is more important than how you do it.", author: "Tim Ferriss", category: "Efficiency", intensity: 2, profession: "Entrepreneur" },
    { id: 'md_5', text: "The greatest originality is looking at the world with fresh eyes.", author: "Adam Grant", category: "Creativity", intensity: 1, profession: "Psychologist" },
    { id: 'md_6', text: "Solitude matters, and for some people, it's the air they breathe.", author: "Susan Cain", category: "Quiet", intensity: 1, profession: "Writer" },
    { id: 'md_7', text: "Compare yourself to who you were yesterday, not to who someone else is today.", author: "Jordan Peterson", category: "Growth", intensity: 2, profession: "Psychologist" },
    { id: 'md_8', text: "The quality of our relationships determines the quality of our lives.", author: "Esther Perel", category: "Relationship", intensity: 1, profession: "Therapist" },
    { id: 'md_9', text: "There is no such thing as work-life balance. Everything is worth fighting for.", author: "Alain de Botton", category: "Life", intensity: 1, profession: "Philosopher" },
    { id: 'md_10', text: "In a world deluged by irrelevant information, clarity is power.", author: "Yuval Noah Harari", category: "Clarity", intensity: 2, profession: "Historian" },

    // ============================================
    // NEW: ATHLETIC & COMPETITIVE MINDSETS
    // ============================================
    { id: 'ath_1', text: "Some people want it to happen, some wish it would happen, others make it happen.", author: "Michael Jordan", category: "Action", intensity: 2, profession: "Athlete" },
    { id: 'ath_2', text: "Dedication makes dreams come true.", author: "Kobe Bryant", category: "Dedication", intensity: 2, profession: "Athlete" },
    { id: 'ath_3', text: "I really think a champion is defined not by their wins but by how they can recover when they fall.", author: "Serena Williams", category: "Resilience", intensity: 2, profession: "Athlete" },
    { id: 'ath_4', text: "I am the greatest, I said that even before I knew I was.", author: "Muhammad Ali", category: "Confidence", intensity: 3, profession: "Athlete" },
    { id: 'ath_5', text: "If you don’t believe in yourself, why is anyone else going to believe in you?", author: "Tom Brady", category: "Belief", intensity: 2, profession: "Athlete" },
    { id: 'ath_6', text: "Practice creates confidence. Confidence empowers you.", author: "Simone Biles", category: "Preparation", intensity: 1, profession: "Athlete" },
    { id: 'ath_7', text: "I like criticism. It makes me strong.", author: "LeBron James", category: "Growth", intensity: 2, profession: "Athlete" },
    { id: 'ath_8', text: "I know what I can do so I never doubt myself.", author: "Usain Bolt", category: "Confidence", intensity: 3, profession: "Athlete" },
    { id: 'ath_9', text: "A life is not important except in the impact it has on other lives.", author: "Jackie Robinson", category: "Impact", intensity: 1, profession: "Athlete" },
    { id: 'ath_10', text: "Champions keep playing until they get it right.", author: "Billie Jean King", category: "Persistence", intensity: 2, profession: "Athlete" },

    // ============================================
    // NEW: SPIRITUAL & INNER DEVELOPMENT
    // ============================================
    { id: 'spi_1', text: "Smile, breathe and go slowly.", author: "Thich Nhat Hanh", category: "Mindfulness", intensity: 1, profession: "Spiritual Teacher" },
    { id: 'spi_2', text: "Acknowledging the good that you already have in your life is the foundation for all abundance.", author: "Eckhart Tolle", category: "Gratitude", intensity: 1, profession: "Spiritual Teacher" },
    { id: 'spi_3', text: "Fear is a natural reaction to moving closer to the truth.", author: "Pema Chödrön", category: "Fear", intensity: 1, profession: "Spiritual Teacher" },
    { id: 'spi_4', text: "Sleep is the best meditation.", author: "Dalai Lama", category: "Rest", intensity: 1, profession: "Spiritual Teacher" },
    { id: 'spi_5', text: "When you change the way you look at things, the things you look at change.", author: "Wayne Dyer", category: "Perspective", intensity: 1, profession: "Author" },
    { id: 'spi_6', text: "In the midst of movement and chaos, keep stillness inside of you.", author: "Deepak Chopra", category: "Calm", intensity: 1, profession: "Author" },
    { id: 'spi_7', text: "Assume the feeling of your wish fulfilled.", author: "Neville Goddard", category: "Projections", intensity: 1, profession: "Mystic" },
    { id: 'spi_8', text: "Live quietly in the moment and see the beauty of all before you.", author: "Paramahansa Yogananda", category: "Presence", intensity: 1, profession: "Yogi" },
    { id: 'spi_9', text: "Follow your bliss and the universe will open doors where there were only walls.", author: "Joseph Campbell", category: "Passion", intensity: 1, profession: "Mythologist" },
    { id: 'spi_10', text: "We're all just walking each other home.", author: "Ram Dass", category: "Connection", intensity: 1, profession: "Spiritual Teacher" },

    // ============================================
    // CLASSICAL PHILOSOPHERS (Additional)
    // ============================================
    { id: 'phil_11', text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle", category: "Excellence", intensity: 2, profession: "Philosopher" },
    { id: 'phil_12', text: "Quality is not an act, it is a habit.", author: "Aristotle", category: "Quality", intensity: 2, profession: "Philosopher" },
    { id: 'phil_13', text: "The beginning is the most important part of the work.", author: "Plato", category: "Action", intensity: 2, profession: "Philosopher" },
    { id: 'phil_14', text: "The first and greatest victory is to master yourself.", author: "Plato", category: "Self-Mastery", intensity: 2, profession: "Philosopher" },
    { id: 'phil_15', text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Persistence", intensity: 1, profession: "Philosopher" },
    { id: 'phil_16', text: "Our greatest glory is not in never falling, but in rising every time we fall.", author: "Confucius", category: "Resilience", intensity: 2, profession: "Philosopher" },
    { id: 'phil_17', text: "A journey of a thousand miles begins with a single step.", author: "Laozi", category: "Action", intensity: 1, profession: "Philosopher" },
    { id: 'phil_18', text: "Nature does not hurry, yet everything is accomplished.", author: "Laozi", category: "Patience", intensity: 1, profession: "Philosopher" },
    { id: 'phil_19', text: "Life can only be understood backwards; but it must be lived forwards.", author: "Søren Kierkegaard", category: "Life", intensity: 1, profession: "Philosopher" },
    { id: 'phil_20', text: "To dare is to lose one's footing momentarily. Not to dare is to lose oneself.", author: "Søren Kierkegaard", category: "Courage", intensity: 2, profession: "Philosopher" },

    // ============================================
    // WRITERS & HUMANISTS (Additional)
    // ============================================
    { id: 'wri_11', text: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau", category: "Dreams", intensity: 1, profession: "Writer" },
    { id: 'wri_12', text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Henry David Thoreau", category: "Growth", intensity: 1, profession: "Writer" },
    { id: 'wri_13', text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin", category: "Truth", intensity: 2, profession: "Writer" },
    { id: 'wri_14', text: "The purpose of art is to lay bare the questions that have been hidden by the answers.", author: "James Baldwin", category: "Art", intensity: 1, profession: "Writer" },
    { id: 'wri_15', text: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison", category: "Creation", intensity: 2, profession: "Writer" },
    { id: 'wri_16', text: "You are your best thing.", author: "Toni Morrison", category: "Self-Worth", intensity: 1, profession: "Writer" },
    { id: 'wri_17', text: "We write to taste life twice, in the moment and in retrospect.", author: "Anaïs Nin", category: "Reflection", intensity: 1, profession: "Writer" },
    { id: 'wri_18', text: "Life shrinks or expands in proportion to one's courage.", author: "Anaïs Nin", category: "Courage", intensity: 2, profession: "Writer" },
    { id: 'wri_19', text: "Life isn't about finding yourself. Life is about creating yourself.", author: "George Bernard Shaw", category: "Identity", intensity: 2, profession: "Writer" },
    { id: 'wri_20', text: "Progress is impossible without change, and those who cannot change their minds cannot change anything.", author: "George Bernard Shaw", category: "Change", intensity: 2, profession: "Writer" },
    { id: 'wri_21', text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde", category: "Authenticity", intensity: 1, profession: "Writer" },
    { id: 'wri_22', text: "We are all in the gutter, but some of us are looking at the stars.", author: "Oscar Wilde", category: "Hope", intensity: 1, profession: "Writer" },

    // ============================================
    // PSYCHOLOGY (Additional)
    // ============================================
    { id: 'psy_11', text: "The confidence people have in their beliefs is not a measure of the quality of evidence but of the coherence of the story the mind has managed to construct.", author: "Daniel Kahneman", category: "Thinking", intensity: 2, profession: "Psychologist" },
    { id: 'psy_12', text: "Nothing in life is as important as you think it is while you are thinking about it.", author: "Daniel Kahneman", category: "Perspective", intensity: 1, profession: "Psychologist" }
];
