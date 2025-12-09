import type { Quote } from '../types';

export const QUOTES: Quote[] = [
    // ============================================
    // TIER 1: CALM (Gentle, Affirming, Mindfulness)
    // ============================================

    // WRITERS
    { id: 'c_w1', text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", category: "Creativity", tier: 1, profession: "writer" },
    { id: 'c_w2', text: "You can make anything by writing.", author: "C.S. Lewis", category: "Writing", tier: 1, profession: "writer" },
    { id: 'c_w3', text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", author: "Louis L'Amour", category: "Writing", tier: 1, profession: "writer" },
    { id: 'c_w4', text: "Words are, in my not-so-humble opinion, our most inexhaustible source of magic.", author: "J.K. Rowling", category: "Writing", tier: 1, profession: "writer" },

    // ARCHITECTS
    { id: 'c_a1', text: "Form follows function.", author: "Louis Sullivan", category: "Design", tier: 1, profession: "architect" },
    { id: 'c_a2', text: "Architecture should speak of its time and place, but yearn for timelessness.", author: "Frank Gehry", category: "Design", tier: 1, profession: "architect" },
    { id: 'c_a3', text: "Less is more.", author: "Ludwig Mies van der Rohe", category: "Simplicity", tier: 1, profession: "architect" },

    // PILOTS/AVIATION
    { id: 'c_p1', text: "The engine is the heart of an airplane, but the pilot is its soul.", author: "Walter Raleigh", category: "Aviation", tier: 1, profession: "pilot" },
    { id: 'c_p2', text: "Flying is learning how to throw yourself at the ground and miss.", author: "Douglas Adams", category: "Aviation", tier: 1, profession: "pilot" },

    // COACHES
    { id: 'c_co1', text: "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.", author: "Vince Lombardi", category: "Willpower", tier: 1, profession: "coach" },
    { id: 'c_co2', text: "Success is peace of mind, which is a direct result of self-satisfaction in knowing you made the effort to become the best of which you are capable.", author: "John Wooden", category: "Success", tier: 1, profession: "coach" },

    // BUSINESS EXECUTIVES
    { id: 'c_b1', text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Work", tier: 1, profession: "business executive" },
    { id: 'c_b2', text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: "Authenticity", tier: 1, profession: "business executive" },
    { id: 'c_b3', text: "The biggest risk is not taking any risk.", author: "Mark Zuckerberg", category: "Risk", tier: 1, profession: "business executive" },

    // FILMMAKERS
    { id: 'c_f1', text: "Every frame is a painting.", author: "Stanley Kubrick", category: "Creativity", tier: 1, profession: "filmmaker" },
    { id: 'c_f2', text: "The most honest form of filmmaking is to make a film for yourself.", author: "Peter Jackson", category: "Authenticity", tier: 1, profession: "filmmaker" },

    // ATHLETES
    { id: 'c_at1', text: "I've failed over and over and over again in my life. And that is why I succeed.", author: "Michael Jordan", category: "Resilience", tier: 1, profession: "athlete" },
    { id: 'c_at2', text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", category: "Action", tier: 1, profession: "athlete" },

    // SCIENTISTS
    { id: 'c_s1', text: "The important thing is not to stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein", category: "Curiosity", tier: 1, profession: "scientist" },
    { id: 'c_s2', text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", category: "Understanding", tier: 1, profession: "scientist" },

    // ARTISTS
    { id: 'c_ar1', text: "Every child is an artist. The problem is how to remain an artist once we grow up.", author: "Pablo Picasso", category: "Creativity", tier: 1, profession: "artist" },
    { id: 'c_ar2', text: "Art is not what you see, but what you make others see.", author: "Edgar Degas", category: "Art", tier: 1, profession: "artist" },

    // MUSICIANS
    { id: 'c_m1', text: "Music is the divine way to tell beautiful, poetic things to the heart.", author: "Pablo Casals", category: "Music", tier: 1, profession: "musician" },
    { id: 'c_m2', text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", category: "Music", tier: 1, profession: "musician" },

    // ENTREPRENEURS
    { id: 'c_e1', text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action", tier: 1, profession: "entrepreneur" },
    { id: 'c_e2', text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller", category: "Ambition", tier: 1, profession: "entrepreneur" },

    // DOCTORS
    { id: 'c_doc1', text: "Cure sometimes, treat often, comfort always.", author: "Hippocrates", category: "Compassion", tier: 1, profession: "doctor" },
    { id: 'c_doc2', text: "Medicine is a science of uncertainty and an art of probability.", author: "William Osler", category: "Wisdom", tier: 1, profession: "doctor" },

    // ENGINEERS
    { id: 'c_eng1', text: "The present is theirs; the future, for which I really worked, is mine.", author: "Nikola Tesla", category: "Vision", tier: 1, profession: "engineer" },
    { id: 'c_eng2', text: "A ship in port is safe, but that's not what ships are built for.", author: "Grace Hopper", category: "Courage", tier: 1, profession: "engineer" },

    // LAWYERS
    { id: 'c_law1', text: "Resolve to be honest at all events; and if in your own judgment you cannot be an honest lawyer, resolve to be honest without being a lawyer.", author: "Abraham Lincoln", category: "Integrity", tier: 1, profession: "lawyer" },
    { id: 'c_law2', text: "Reacting in anger or annoyance will not advance one's ability to persuade.", author: "Ruth Bader Ginsburg", category: "Patience", tier: 1, profession: "lawyer" },

    // STUDENTS
    { id: 'c_stu1', text: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai", category: "Education", tier: 1, profession: "student" },
    { id: 'c_stu2', text: "The first principle is that you must not fool yourself and you are the easiest person to fool.", author: "Richard Feynman", category: "Truth", tier: 1, profession: "student" },

    // TEACHERS
    { id: 'c_tea1', text: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats", category: "Inspiration", tier: 1, profession: "teacher" },
    { id: 'c_tea2', text: "Optimism is the faith that leads to achievement.", author: "Helen Keller", category: "Hope", tier: 1, profession: "teacher" },

    // GENERAL CALM
    { id: 'c1', text: "Breathe. You are exactly where you need to be.", author: "Unknown", category: "Mindfulness", tier: 1 },
    { id: 'c2', text: "Small steps are still progress.", author: "Unknown", category: "Growth", tier: 1 },
    { id: 'c3', text: "Be kind to yourself today.", author: "Unknown", category: "Self-Care", tier: 1 },
    { id: 'c4', text: "Peace comes from within. Do not seek it without.", author: "Buddha", category: "Mindfulness", tier: 1 },
    { id: 'c5', text: "You are capable of amazing things.", author: "Unknown", category: "Confidence", tier: 1 },

    // ============================================
    // TIER 2: FIRM (Stoic, Disciplined, Direct)
    // ============================================

    // WRITERS
    { id: 'f_w1', text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", author: "Stephen King", category: "Work", tier: 2, profession: "writer" },
    { id: 'f_w2', text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.", author: "Ernest Hemingway", category: "Writing", tier: 2, profession: "writer" },
    { id: 'f_w3', text: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison", category: "Writing", tier: 2, profession: "writer" },
    { id: 'f_w4', text: "Write hard and clear about what hurts.", author: "Ernest Hemingway", category: "Writing", tier: 2, profession: "writer" },

    // ARCHITECTS
    { id: 'f_a1', text: "You have to give up! You have to give up! You have to realize that someday you will die. Until you know that, you are useless!", author: "Chuck Palahniuk", category: "Reality", tier: 2, profession: "architect" },
    { id: 'f_a2', text: "I don't build in order to have clients. I have clients in order to build.", author: "Ayn Rand", category: "Purpose", tier: 2, profession: "architect" },
    { id: 'f_a3', text: "Space and light and order. Those are the things that men need just as much as they need bread or a place to sleep.", author: "Le Corbusier", category: "Design", tier: 2, profession: "architect" },

    // PILOTS/AVIATION
    { id: 'f_p1', text: "A good landing is one you can walk away from. A great landing is one where you can use the airplane again.", author: "Chuck Yeager", category: "Excellence", tier: 2, profession: "pilot" },
    { id: 'f_p2', text: "The most important thing is to fly. The machine will follow.", author: "Amelia Earhart", category: "Focus", tier: 2, profession: "pilot" },
    { id: 'f_p3', text: "Everything is accomplished through teamwork.", author: "Chesley Sullenberger", category: "Teamwork", tier: 2, profession: "pilot" },

    // BOXERS/FIGHTERS
    { id: 'f_box1', text: "Champions aren't made in gyms. Champions are made from something they have deep inside them.", author: "Muhammad Ali", category: "Character", tier: 2, profession: "boxer" },
    { id: 'f_box2', text: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'", author: "Muhammad Ali", category: "Discipline", tier: 2, profession: "boxer" },
    { id: 'f_box3', text: "Discipline is doing what you hate to do, but nonetheless doing it like you love it.", author: "Mike Tyson", category: "Discipline", tier: 2, profession: "boxer" },

    // COACHES
    { id: 'f_co1', text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi", category: "Resilience", tier: 2, profession: "coach" },
    { id: 'f_co2', text: "The strength of the team is each individual member. The strength of each member is the team.", author: "Phil Jackson", category: "Teamwork", tier: 2, profession: "coach" },
    { id: 'f_co3', text: "Do not let what you cannot do interfere with what you can do.", author: "John Wooden", category: "Focus", tier: 2, profession: "coach" },

    // BUSINESS EXECUTIVES
    { id: 'f_b1', text: "Move fast and break things.", author: "Mark Zuckerberg", category: "Innovation", tier: 2, profession: "business executive" },
    { id: 'f_b2', text: "I think it is possible for ordinary people to choose to be extraordinary.", author: "Elon Musk", category: "Excellence", tier: 2, profession: "business executive" },
    { id: 'f_b3', text: "Done is better than perfect.", author: "Sheryl Sandberg", category: "Execution", tier: 2, profession: "business executive" },
    { id: 'f_b4', text: "The biggest risk is not taking any risk. In a world that's changing quickly, the only strategy that is guaranteed to fail is not taking risks.", author: "Mark Zuckerberg", category: "Risk", tier: 2, profession: "business executive" },

    // FILMMAKERS
    { id: 'f_f1', text: "The most important thing is story-telling. It's what we all do.", author: "Martin Scorsese", category: "Storytelling", tier: 2, profession: "filmmaker" },
    { id: 'f_f2', text: "I dream for a living.", author: "Steven Spielberg", category: "Creativity", tier: 2, profession: "filmmaker" },
    { id: 'f_f3', text: "You don't make a photograph just with a camera. You bring to the act of photography all the pictures you have seen, the books you have read, the music you have heard, the people you have loved.", author: "Ansel Adams", category: "Creativity", tier: 2, profession: "filmmaker" },

    // ATHLETES
    { id: 'f_at1', text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke", category: "Work Ethic", tier: 2, profession: "athlete" },
    { id: 'f_at2', text: "The only way to prove that you're a good sport is to lose.", author: "Ernie Banks", category: "Character", tier: 2, profession: "athlete" },
    { id: 'f_at3', text: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi", category: "Resilience", tier: 2, profession: "athlete" },

    // SCIENTISTS
    { id: 'f_s1', text: "Science is not only a disciple of reason but also one of romance and passion.", author: "Stephen Hawking", category: "Science", tier: 2, profession: "scientist" },
    { id: 'f_s2', text: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson", category: "Truth", tier: 2, profession: "scientist" },

    // DOCTORS
    { id: 'f_doc1', text: "Better is possible. It does not take genius. It takes diligence.", author: "Atul Gawande", category: "Excellence", tier: 2, profession: "doctor" },
    { id: 'f_doc2', text: "Observe, record, tabulate, communicate. Use your five senses.", author: "William Osler", category: "Focus", tier: 2, profession: "doctor" },

    // ENGINEERS
    { id: 'f_eng1', text: "Physics is the law, everything else is a recommendation.", author: "Elon Musk", category: "Reality", tier: 2, profession: "engineer" },
    { id: 'f_eng2', text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford", category: "Growth", tier: 2, profession: "engineer" },

    // LAWYERS
    { id: 'f_law1', text: "Fight for the things that you care about, but do it in a way that will lead others to join you.", author: "Ruth Bader Ginsburg", category: "Leadership", tier: 2, profession: "lawyer" },
    { id: 'f_law2', text: "Justice too long delayed is justice denied.", author: "Martin Luther King Jr.", category: "Justice", tier: 2, profession: "lawyer" },

    // STUDENTS
    { id: 'f_stu1', text: "I would rather have questions that can't be answered than answers that can't be questioned.", author: "Richard Feynman", category: "Curiosity", tier: 2, profession: "student" },
    { id: 'f_stu2', text: "Becoming is better than being.", author: "Carol Dweck", category: "Growth", tier: 2, profession: "student" },

    // TEACHERS
    { id: 'f_tea1', text: "Educating the mind without educating the heart is no education at all.", author: "Aristotle", category: "Wisdom", tier: 2, profession: "teacher" },
    { id: 'f_tea2', text: "Education is the kindling of a flame, not the filling of a vessel.", author: "Socrates", category: "Inspiration", tier: 2, profession: "teacher" },

    // GENERAL FIRM
    { id: 'f1', text: "Discipline is freedom.", author: "Jocko Willink", category: "Discipline", tier: 2 },
    { id: 'f2', text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Stoicism", tier: 2 },
    { id: 'f3', text: "The obstacle is the way.", author: "Ryan Holiday", category: "Stoicism", tier: 2 },
    { id: 'f4', text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "Action", tier: 2 },

    // ============================================
    // TIER 3: DRILL SERGEANT (Aggressive, Profane, High Intensity)
    // ============================================

    // WRITERS
    { id: 'd_w1', text: "The scariest moment is always just before you start. After that, things can only get better.", author: "Stephen King", category: "Fear", tier: 3, profession: "writer" },
    { id: 'd_w2', text: "If you don't have time to read, you don't have the time or the tools to write. Simple as that.", author: "Stephen King", category: "Discipline", tier: 3, profession: "writer" },

    // BOXERS/FIGHTERS
    { id: 'd_box1', text: "Everyone has a plan until they get punched in the mouth.", author: "Mike Tyson", category: "Reality", tier: 3, profession: "boxer" },
    { id: 'd_box2', text: "I'm the best. I just haven't played yet.", author: "Muhammad Ali", category: "Confidence", tier: 3, profession: "boxer" },
    { id: 'd_box3', text: "Float like a butterfly, sting like a bee.", author: "Muhammad Ali", category: "Strategy", tier: 3, profession: "boxer" },
    { id: 'd_box4', text: "If you even dream of beating me you'd better wake up and apologize.", author: "Muhammad Ali", category: "Dominance", tier: 3, profession: "boxer" },

    // COACHES
    { id: 'd_co1', text: "Winning isn't everything, it's the only thing.", author: "Vince Lombardi", category: "Winning", tier: 3, profession: "coach" },
    { id: 'd_co2', text: "The price of success is hard work, dedication to the job at hand, and the determination that whether we win or lose, we have applied the best of ourselves to the task at hand.", author: "Vince Lombardi", category: "Dedication", tier: 3, profession: "coach" },

    // BUSINESS EXECUTIVES
    { id: 'd_b1', text: "If you're not pissing someone off, you're probably not doing anything important.", author: "Oliver Emberton", category: "Impact", tier: 3, profession: "business executive" },
    { id: 'd_b2', text: "I don't care if you think I'm Satan reincarnated. I want to make a fucking great product.", author: "Steve Jobs", category: "Excellence", tier: 3, profession: "business executive" },

    // ATHLETES (David Goggins, Kobe Bryant, etc.)
    { id: 'd_at1', text: "Nobody cares what you feel. Get up and do the work.", author: "David Goggins", category: "Hard Truths", tier: 3, profession: "athlete" },
    { id: 'd_at2', text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins", category: "Endurance", tier: 3, profession: "athlete" },
    { id: 'd_at3', text: "Get comfortable being uncomfortable.", author: "David Goggins", category: "Growth", tier: 3, profession: "athlete" },
    { id: 'd_at4', text: "They don't know me son!", author: "David Goggins", category: "Mindset", tier: 3, profession: "athlete" },
    { id: 'd_at5', text: "Stay hard.", author: "David Goggins", category: "Resilience", tier: 3, profession: "athlete" },
    { id: 'd_at6', text: "You are in danger of living a life so comfortable and soft, that you will die without ever realizing your true potential.", author: "David Goggins", category: "Potential", tier: 3, profession: "athlete" },
    { id: 'd_at7', text: "Everything negative - pressure, challenges - is all an opportunity for me to rise.", author: "Kobe Bryant", category: "Adversity", tier: 3, profession: "athlete" },

    // DOCTORS
    { id: 'd_doc1', text: "Lives are on the line. Act like it.", author: "Unknown", category: "Responsibility", tier: 3, profession: "doctor" },
    { id: 'd_doc2', text: "Don't kill anyone today. Pay attention.", author: "Unknown", category: "Focus", tier: 3, profession: "doctor" },

    // ENGINEERS
    { id: 'd_eng1', text: "Build it right or don't build it at all.", author: "Unknown", category: "Excellence", tier: 3, profession: "engineer" },
    { id: 'd_eng2', text: "Physics doesn't care about your feelings. Make it work.", author: "Unknown", category: "Reality", tier: 3, profession: "engineer" },

    // LAWYERS
    { id: 'd_law1', text: "Facts don't lie. People do. Find the truth.", author: "Unknown", category: "Truth", tier: 3, profession: "lawyer" },
    { id: 'd_law2', text: "Win the case. No excuses.", author: "Unknown", category: "Winning", tier: 3, profession: "lawyer" },

    // STUDENTS
    { id: 'd_stu1', text: "Study like your life depends on it. Because it does.", author: "Unknown", category: "Focus", tier: 3, profession: "student" },
    { id: 'd_stu2', text: "Grades don't matter. Knowledge does. Don't be a fraud.", author: "Unknown", category: "Integrity", tier: 3, profession: "student" },

    // TEACHERS
    { id: 'd_tea1', text: "You are molding the future. Don't screw it up.", author: "Unknown", category: "Responsibility", tier: 3, profession: "teacher" },
    { id: 'd_tea2', text: "If they fail, YOU failed. Teach better.", author: "Unknown", category: "Accountability", tier: 3, profession: "teacher" },

    // GENERAL DRILL SERGEANT
    { id: 'd1', text: "Stop being a little bitch and get after it.", author: "Unknown", category: "Aggression", tier: 3 },
    { id: 'd2', text: "Pain is weakness leaving the body.", author: "US Marines", category: "Pain", tier: 3 },
    { id: 'd3', text: "You want to be comfortable? Stay a loser.", author: "Unknown", category: "Winning", tier: 3 },
    { id: 'd4', text: "Your excuses are lies.", author: "Jocko Willink", category: "Accountability", tier: 3 },
    { id: 'd5', text: "Shut up and train.", author: "Unknown", category: "Training", tier: 3 },
    { id: 'd6', text: "If it doesn't suck, we don't do it.", author: "David Goggins", category: "Hardship", tier: 3 },
    { id: 'd7', text: "Be a savage, not average.", author: "Unknown", category: "Excellence", tier: 3 },
    { id: 'd8', text: "Fuck your feelings.", author: "Unknown", category: "Discipline", tier: 3 },
    { id: 'd9', text: "Go until you fail. Then go again.", author: "Unknown", category: "Failure", tier: 3 },
    { id: 'd10', text: "Sleep when you're dead.", author: "Unknown", category: "Hustle", tier: 3 },
    { id: 'd11', text: "Who's gonna carry the boats?", author: "David Goggins", category: "Strength", tier: 3 },
    { id: 'd12', text: "Taking souls.", author: "David Goggins", category: "Competition", tier: 3 },
    { id: 'd13', text: "Get your bitch ass up and go get that money.", author: "Unknown", category: "Hustle", tier: 3 },
    { id: 'd14', text: "Nobody cares. Work harder.", author: "Unknown", category: "Reality", tier: 3 },
    { id: 'd15', text: "Don't be a pussy. Do the work.", author: "Unknown", category: "Toughness", tier: 3 },
    { id: 'd16', text: "Your potential doesn't mean shit if you don't execute.", author: "Unknown", category: "Execution", tier: 3 },
    { id: 'd17', text: "Cry in the dojo, laugh on the battlefield.", author: "Unknown", category: "Preparation", tier: 3 },
    { id: 'd18', text: "If you're tired, do it tired.", author: "Unknown", category: "Persistence", tier: 3 },

    // ============================================
    // AI GENERATED EXAMPLES (for testing Source Preference)
    // ============================================
    { id: 'ai_1', text: "Your potential is a fire waiting for a spark. Be the spark.", author: "Palante Coach", category: "Potential", tier: 1, isAI: true },
    { id: 'ai_2', text: "Efficiency is the currency of success. Spend it wisely.", author: "Palante Coach", category: "Efficiency", tier: 2, isAI: true },
    { id: 'ai_3', text: "Excuses are the bricks that build the wall of failure. Smash them.", author: "Palante Coach", category: "No Excuses", tier: 3, isAI: true },
    { id: 'ai_4', text: "Create the future you want to live in, one action at a time.", author: "Palante Coach", category: "Action", tier: 1, isAI: true },
    { id: 'ai_5', text: "Discipline is not a punishment, it's a bridge to your goals.", author: "Palante Coach", category: "Discipline", tier: 2, isAI: true },
    { id: 'ai_6', text: "Pain is temporary. Quitting lasts forever.", author: "Palante Coach", category: "Resilience", tier: 3, isAI: true },
];
