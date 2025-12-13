import type { Quote } from '../types';

export const QUOTES: Quote[] = [
    // ============================================
    // TIER 1: CALM (Gentle, Affirming, Mindfulness)
    // ============================================

    // WRITERS
    { id: 'c_w1', text: "There is no greater agony than bearing an untold story inside you.", author: "Maya Angelou", category: "Creativity", tier: 1, profession: "Writer" },
    { id: 'c_w2', text: "You can make anything by writing.", author: "C.S. Lewis", category: "Writing", tier: 1, profession: "Writer" },
    { id: 'c_w3', text: "Start writing, no matter what. The water does not flow until the faucet is turned on.", author: "Louis L'Amour", category: "Writing", tier: 1, profession: "Writer" },
    { id: 'c_w4', text: "Words are, in my not-so-humble opinion, our most inexhaustible source of magic.", author: "J.K. Rowling", category: "Writing", tier: 1, profession: "Writer" },

    // ARCHITECTS
    { id: 'c_a1', text: "Form follows function.", author: "Louis Sullivan", category: "Design", tier: 1, profession: "Designer" },
    { id: 'c_a2', text: "Architecture should speak of its time and place, but yearn for timelessness.", author: "Frank Gehry", category: "Design", tier: 1, profession: "Designer" },
    { id: 'c_a3', text: "Less is more.", author: "Ludwig Mies van der Rohe", category: "Simplicity", tier: 1, profession: "Designer" },

    // PILOTS/AVIATION
    { id: 'c_p1', text: "The engine is the heart of an airplane, but the pilot is its soul.", author: "Walter Raleigh", category: "Aviation", tier: 1, profession: "Other" },
    { id: 'c_p2', text: "Flying is learning how to throw yourself at the ground and miss.", author: "Douglas Adams", category: "Aviation", tier: 1, profession: "Other" },

    // COACHES
    { id: 'c_co1', text: "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack of will.", author: "Vince Lombardi", category: "Willpower", tier: 1, profession: "Coach" },
    { id: 'c_co2', text: "Success is peace of mind, which is a direct result of self-satisfaction in knowing you made the effort to become the best of which you are capable.", author: "John Wooden", category: "Success", tier: 1, profession: "Coach" },

    // BUSINESS EXECUTIVES
    { id: 'c_b1', text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Work", tier: 1, profession: "Executive" },
    { id: 'c_b2', text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs", category: "Authenticity", tier: 1, profession: "Executive" },
    { id: 'c_b3', text: "The biggest risk is not taking any risk.", author: "Mark Zuckerberg", category: "Risk", tier: 1, profession: "Executive" },

    // FILMMAKERS
    { id: 'c_f1', text: "Every frame is a painting.", author: "Stanley Kubrick", category: "Creativity", tier: 1, profession: "Creative" },
    { id: 'c_f2', text: "The most honest form of filmmaking is to make a film for yourself.", author: "Peter Jackson", category: "Authenticity", tier: 1, profession: "Creative" },

    // ATHLETES
    { id: 'c_at1', text: "I've failed over and over and over again in my life. And that is why I succeed.", author: "Michael Jordan", category: "Resilience", tier: 1, profession: "Athlete" },
    { id: 'c_at2', text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky", category: "Action", tier: 1, profession: "Athlete" },

    // SCIENTISTS
    { id: 'c_s1', text: "The important thing is not to stop questioning. Curiosity has its own reason for existing.", author: "Albert Einstein", category: "Curiosity", tier: 1, profession: "Engineer" },
    { id: 'c_s2', text: "Nothing in life is to be feared, it is only to be understood.", author: "Marie Curie", category: "Understanding", tier: 1, profession: "Engineer" },

    // ARTISTS
    { id: 'c_ar1', text: "Every child is an artist. The problem is how to remain an artist once we grow up.", author: "Pablo Picasso", category: "Creativity", tier: 1, profession: "Artist" },
    { id: 'c_ar2', text: "Art is not what you see, but what you make others see.", author: "Edgar Degas", category: "Art", tier: 1, profession: "Artist" },

    // MUSICIANS
    { id: 'c_m1', text: "Music is the divine way to tell beautiful, poetic things to the heart.", author: "Pablo Casals", category: "Music", tier: 1, profession: "Creative" },
    { id: 'c_m2', text: "Without music, life would be a mistake.", author: "Friedrich Nietzsche", category: "Music", tier: 1, profession: "Creative" },

    // ENTREPRENEURS
    { id: 'c_e1', text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", category: "Action", tier: 1, profession: "Entrepreneur" },
    { id: 'c_e2', text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller", category: "Ambition", tier: 1, profession: "Entrepreneur" },

    // DOCTORS
    { id: 'c_doc1', text: "Cure sometimes, treat often, comfort always.", author: "Hippocrates", category: "Compassion", tier: 1, profession: "Healthcare" },
    { id: 'c_doc2', text: "Medicine is a science of uncertainty and an art of probability.", author: "William Osler", category: "Wisdom", tier: 1, profession: "Healthcare" },

    // ENGINEERS
    { id: 'c_eng1', text: "The present is theirs; the future, for which I really worked, is mine.", author: "Nikola Tesla", category: "Vision", tier: 1, profession: "Engineer" },
    { id: 'c_eng2', text: "A ship in port is safe, but that's not what ships are built for.", author: "Grace Hopper", category: "Courage", tier: 1, profession: "Engineer" },

    // LAWYERS
    { id: 'c_law1', text: "Resolve to be honest at all events; and if in your own judgment you cannot be an honest lawyer, resolve to be honest without being a lawyer.", author: "Abraham Lincoln", category: "Integrity", tier: 1, profession: "Consultant" },
    { id: 'c_law2', text: "Reacting in anger or annoyance will not advance one's ability to persuade.", author: "Ruth Bader Ginsburg", category: "Patience", tier: 1, profession: "Consultant" },

    // STUDENTS
    { id: 'c_stu1', text: "One child, one teacher, one book, one pen can change the world.", author: "Malala Yousafzai", category: "Education", tier: 1, profession: "Student" },
    { id: 'c_stu2', text: "The first principle is that you must not fool yourself and you are the easiest person to fool.", author: "Richard Feynman", category: "Truth", tier: 1, profession: "Student" },

    // TEACHERS
    { id: 'c_tea1', text: "Education is not the filling of a pail, but the lighting of a fire.", author: "William Butler Yeats", category: "Inspiration", tier: 1, profession: "Teacher" },
    { id: 'c_tea2', text: "Optimism is the faith that leads to achievement.", author: "Helen Keller", category: "Hope", tier: 1, profession: "Teacher" },

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
    { id: 'f_w1', text: "Amateurs sit and wait for inspiration. The rest of us just get up and go to work.", author: "Stephen King", category: "Work", tier: 2, profession: "Writer" },
    { id: 'f_w2', text: "There is nothing to writing. All you do is sit down at a typewriter and bleed.", author: "Ernest Hemingway", category: "Writing", tier: 2, profession: "Writer" },
    { id: 'f_w3', text: "If there's a book that you want to read, but it hasn't been written yet, then you must write it.", author: "Toni Morrison", category: "Writing", tier: 2, profession: "Writer" },
    { id: 'f_w4', text: "Write hard and clear about what hurts.", author: "Ernest Hemingway", category: "Writing", tier: 2, profession: "Writer" },

    // ARCHITECTS
    { id: 'f_a1', text: "You have to give up! You have to give up! You have to realize that someday you will die. Until you know that, you are useless!", author: "Chuck Palahniuk", category: "Reality", tier: 2, profession: "Designer" },
    { id: 'f_a2', text: "I don't build in order to have clients. I have clients in order to build.", author: "Ayn Rand", category: "Purpose", tier: 2, profession: "Designer" },
    { id: 'f_a3', text: "Space and light and order. Those are the things that men need just as much as they need bread or a place to sleep.", author: "Le Corbusier", category: "Design", tier: 2, profession: "Designer" },

    // PILOTS/AVIATION
    { id: 'f_p1', text: "A good landing is one you can walk away from. A great landing is one where you can use the airplane again.", author: "Chuck Yeager", category: "Excellence", tier: 2, profession: "Other" },
    { id: 'f_p2', text: "The most important thing is to fly. The machine will follow.", author: "Amelia Earhart", category: "Focus", tier: 2, profession: "Other" },
    { id: 'f_p3', text: "Everything is accomplished through teamwork.", author: "Chesley Sullenberger", category: "Teamwork", tier: 2, profession: "Other" },

    // BOXERS/FIGHTERS
    { id: 'f_box1', text: "Champions aren't made in gyms. Champions are made from something they have deep inside them.", author: "Muhammad Ali", category: "Character", tier: 2, profession: "Athlete" },
    { id: 'f_box2', text: "I hated every minute of training, but I said, 'Don't quit. Suffer now and live the rest of your life as a champion.'", author: "Muhammad Ali", category: "Discipline", tier: 2, profession: "Athlete" },
    { id: 'f_box3', text: "Discipline is doing what you hate to do, but nonetheless doing it like you love it.", author: "Mike Tyson", category: "Discipline", tier: 2, profession: "Athlete" },

    // COACHES
    { id: 'f_co1', text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi", category: "Resilience", tier: 2, profession: "Coach" },
    { id: 'f_co2', text: "The strength of the team is each individual member. The strength of each member is the team.", author: "Phil Jackson", category: "Teamwork", tier: 2, profession: "Coach" },
    { id: 'f_co3', text: "Do not let what you cannot do interfere with what you can do.", author: "John Wooden", category: "Focus", tier: 2, profession: "Coach" },

    // BUSINESS EXECUTIVES
    { id: 'f_b1', text: "Move fast and break things.", author: "Mark Zuckerberg", category: "Innovation", tier: 2, profession: "Executive" },
    { id: 'f_b2', text: "I think it is possible for ordinary people to choose to be extraordinary.", author: "Elon Musk", category: "Excellence", tier: 2, profession: "Executive" },
    { id: 'f_b3', text: "Done is better than perfect.", author: "Sheryl Sandberg", category: "Execution", tier: 2, profession: "Executive" },
    { id: 'f_b4', text: "The biggest risk is not taking any risk. In a world that's changing quickly, the only strategy that is guaranteed to fail is not taking risks.", author: "Mark Zuckerberg", category: "Risk", tier: 2, profession: "Executive" },

    // FILMMAKERS
    { id: 'f_f1', text: "The most important thing is story-telling. It's what we all do.", author: "Martin Scorsese", category: "Storytelling", tier: 2, profession: "Creative" },
    { id: 'f_f2', text: "I dream for a living.", author: "Steven Spielberg", category: "Creativity", tier: 2, profession: "Creative" },
    { id: 'f_f3', text: "You don't make a photograph just with a camera. You bring to the act of photography all the pictures you have seen, the books you have read, the music you have heard, the people you have loved.", author: "Ansel Adams", category: "Creativity", tier: 2, profession: "Creative" },

    // ATHLETES
    { id: 'f_at1', text: "Hard work beats talent when talent doesn't work hard.", author: "Tim Notke", category: "Work Ethic", tier: 2, profession: "Athlete" },
    { id: 'f_at2', text: "The only way to prove that you're a good sport is to lose.", author: "Ernie Banks", category: "Character", tier: 2, profession: "Athlete" },
    { id: 'f_at3', text: "It's not whether you get knocked down; it's whether you get up.", author: "Vince Lombardi", category: "Resilience", tier: 2, profession: "Athlete" },

    // SCIENTISTS
    { id: 'f_s1', text: "Science is not only a disciple of reason but also one of romance and passion.", author: "Stephen Hawking", category: "Science", tier: 2, profession: "Engineer" },
    { id: 'f_s2', text: "The good thing about science is that it's true whether or not you believe in it.", author: "Neil deGrasse Tyson", category: "Truth", tier: 2, profession: "Engineer" },

    // DOCTORS
    { id: 'f_doc1', text: "Better is possible. It does not take genius. It takes diligence.", author: "Atul Gawande", category: "Excellence", tier: 2, profession: "Healthcare" },
    { id: 'f_doc2', text: "Observe, record, tabulate, communicate. Use your five senses.", author: "William Osler", category: "Focus", tier: 2, profession: "Healthcare" },

    // ENGINEERS
    { id: 'f_eng1', text: "Physics is the law, everything else is a recommendation.", author: "Elon Musk", category: "Reality", tier: 2, profession: "Engineer" },
    { id: 'f_eng2', text: "Failure is simply the opportunity to begin again, this time more intelligently.", author: "Henry Ford", category: "Growth", tier: 2, profession: "Engineer" },

    // LAWYERS
    { id: 'f_law1', text: "Fight for the things that you care about, but do it in a way that will lead others to join you.", author: "Ruth Bader Ginsburg", category: "Leadership", tier: 2, profession: "Consultant" },
    { id: 'f_law2', text: "Justice too long delayed is justice denied.", author: "Martin Luther King Jr.", category: "Justice", tier: 2, profession: "Consultant" },

    // STUDENTS
    { id: 'f_stu1', text: "I would rather have questions that can't be answered than answers that can't be questioned.", author: "Richard Feynman", category: "Curiosity", tier: 2, profession: "Student" },
    { id: 'f_stu2', text: "Becoming is better than being.", author: "Carol Dweck", category: "Growth", tier: 2, profession: "Student" },

    // TEACHERS
    { id: 'f_tea1', text: "Educating the mind without educating the heart is no education at all.", author: "Aristotle", category: "Wisdom", tier: 2, profession: "Teacher" },
    { id: 'f_tea2', text: "Education is the kindling of a flame, not the filling of a vessel.", author: "Socrates", category: "Inspiration", tier: 2, profession: "Teacher" },

    // GENERAL FIRM
    { id: 'f1', text: "Discipline is freedom.", author: "Jocko Willink", category: "Discipline", tier: 2 },
    { id: 'f2', text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Stoicism", tier: 2 },
    { id: 'f3', text: "The obstacle is the way.", author: "Ryan Holiday", category: "Stoicism", tier: 2 },
    { id: 'f4', text: "Action is the foundational key to all success.", author: "Pablo Picasso", category: "Action", tier: 2 },

    // ============================================
    // TIER 3: DRILL SERGEANT (Aggressive, Profane, High Intensity)
    // ============================================

    // WRITERS
    { id: 'd_w1', text: "The scariest moment is always just before you start. After that, things can only get better.", author: "Stephen King", category: "Fear", tier: 3, profession: "Writer" },
    { id: 'd_w2', text: "If you don't have time to read, you don't have the time or the tools to write. Simple as that.", author: "Stephen King", category: "Discipline", tier: 3, profession: "Writer" },

    // BOXERS/FIGHTERS
    { id: 'd_box1', text: "Everyone has a plan until they get punched in the mouth.", author: "Mike Tyson", category: "Reality", tier: 3, profession: "Athlete" },
    { id: 'd_box2', text: "I'm the best. I just haven't played yet.", author: "Muhammad Ali", category: "Confidence", tier: 3, profession: "Athlete" },
    { id: 'd_box3', text: "Float like a butterfly, sting like a bee.", author: "Muhammad Ali", category: "Strategy", tier: 3, profession: "Athlete" },
    { id: 'd_box4', text: "If you even dream of beating me you'd better wake up and apologize.", author: "Muhammad Ali", category: "Dominance", tier: 3, profession: "Athlete" },

    // COACHES
    { id: 'd_co1', text: "Winning isn't everything, it's the only thing.", author: "Vince Lombardi", category: "Winning", tier: 3, profession: "Coach" },
    { id: 'd_co2', text: "The price of success is hard work, dedication to the job at hand, and the determination that whether we win or lose, we have applied the best of ourselves to the task at hand.", author: "Vince Lombardi", category: "Dedication", tier: 3, profession: "Coach" },

    // BUSINESS EXECUTIVES
    { id: 'd_b1', text: "If you're not pissing someone off, you're probably not doing anything important.", author: "Oliver Emberton", category: "Impact", tier: 3, profession: "Executive" },
    { id: 'd_b2', text: "I don't care if you think I'm Satan reincarnated. I want to make a fucking great product.", author: "Steve Jobs", category: "Excellence", tier: 3, profession: "Executive" },

    // ATHLETES (David Goggins, Kobe Bryant, etc.)
    { id: 'd_at1', text: "Nobody cares what you feel. Get up and do the work.", author: "David Goggins", category: "Hard Truths", tier: 3, profession: "Athlete" },
    { id: 'd_at2', text: "Don't stop when you're tired. Stop when you're done.", author: "David Goggins", category: "Endurance", tier: 3, profession: "Athlete" },
    { id: 'd_at3', text: "Get comfortable being uncomfortable.", author: "David Goggins", category: "Growth", tier: 3, profession: "Athlete" },
    { id: 'd_at4', text: "They don't know me son!", author: "David Goggins", category: "Mindset", tier: 3, profession: "Athlete" },
    { id: 'd_at5', text: "Stay hard.", author: "David Goggins", category: "Resilience", tier: 3, profession: "Athlete" },
    { id: 'd_at6', text: "You are in danger of living a life so comfortable and soft, that you will die without ever realizing your true potential.", author: "David Goggins", category: "Potential", tier: 3, profession: "Athlete" },
    { id: 'd_at7', text: "Everything negative - pressure, challenges - is all an opportunity for me to rise.", author: "Kobe Bryant", category: "Adversity", tier: 3, profession: "Athlete" },

    // DOCTORS
    { id: 'd_doc1', text: "Lives are on the line. Act like it.", author: "Unknown", category: "Responsibility", tier: 3, profession: "Healthcare" },
    { id: 'd_doc2', text: "Don't kill anyone today. Pay attention.", author: "Unknown", category: "Focus", tier: 3, profession: "Healthcare" },

    // ENGINEERS
    { id: 'd_eng1', text: "Build it right or don't build it at all.", author: "Unknown", category: "Excellence", tier: 3, profession: "Engineer" },
    { id: 'd_eng2', text: "Physics doesn't care about your feelings. Make it work.", author: "Unknown", category: "Reality", tier: 3, profession: "Engineer" },

    // LAWYERS
    { id: 'd_law1', text: "Facts don't lie. People do. Find the truth.", author: "Unknown", category: "Truth", tier: 3, profession: "Consultant" },
    { id: 'd_law2', text: "Win the case. No excuses.", author: "Unknown", category: "Winning", tier: 3, profession: "Consultant" },

    // STUDENTS
    { id: 'd_stu1', text: "Study like your life depends on it. Because it does.", author: "Unknown", category: "Focus", tier: 3, profession: "Student" },
    { id: 'd_stu2', text: "Grades don't matter. Knowledge does. Don't be a fraud.", author: "Unknown", category: "Integrity", tier: 3, profession: "Student" },

    // TEACHERS
    { id: 'd_tea1', text: "You are molding the future. Don't screw it up.", author: "Unknown", category: "Responsibility", tier: 3, profession: "Teacher" },
    { id: 'd_tea2', text: "If they fail, YOU failed. Teach better.", author: "Unknown", category: "Accountability", tier: 3, profession: "Teacher" },

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
    // NEW: ANCIENT WISDOM & PHILOSOPHY (100 Quotes)
    // ============================================
    { id: 'aw_1', text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", category: "Stoicism", tier: 1 },
    { id: 'aw_2', text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche", category: "Purpose", tier: 1 },
    { id: 'aw_3', text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", category: "Action", tier: 1 },
    { id: 'aw_4', text: "It is not death that a man should fear, but he should fear never beginning to live.", author: "Marcus Aurelius", category: "Life", tier: 1 },
    { id: 'aw_5', text: "Man conquers the world by conquering himself.", author: "Zeno of Citium", category: "Self-Control", tier: 1 },
    { id: 'aw_6', text: "We suffer more often in imagination than in reality.", author: "Seneca", category: "Anxiety", tier: 1 },
    { id: 'aw_7', text: "If a man knows not to which port he sails, no wind is favorable.", author: "Seneca", category: "Purpose", tier: 1 },
    { id: 'aw_8', text: "Life is long if you know how to use it.", author: "Seneca", category: "Time", tier: 1 },
    { id: 'aw_9', text: "To be calm is the highest achievement of the self.", author: "Zen Proverb", category: "Calm", tier: 1 },
    { id: 'aw_10', text: "When you arise in the morning think of what a privilege it is to be alive, to think, to enjoy, to love.", author: "Marcus Aurelius", category: "Gratitude", tier: 1 },
    { id: 'aw_11', text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", category: "Mindfulness", tier: 1 },
    { id: 'aw_12', text: "He who conquers himself is the mightiest warrior.", author: "Confucius", category: "Self-Control", tier: 1 },
    { id: 'aw_13', text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius", category: "Persistence", tier: 1 },
    { id: 'aw_14', text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Persistence", tier: 1 },
    { id: 'aw_15', text: "Act without expectation.", author: "Lao Tzu", category: "Action", tier: 1 },
    { id: 'aw_16', text: "Nature does not hurry, yet everything is accomplished.", author: "Lao Tzu", category: "Patience", tier: 1 },
    { id: 'aw_17', text: "Knowing others is intelligence; knowing yourself is true wisdom.", author: "Lao Tzu", category: "Wisdom", tier: 1 },
    { id: 'aw_18', text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu", category: "Power", tier: 1 },
    { id: 'aw_19', text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu", category: "Action", tier: 1 },
    { id: 'aw_20', text: "When I let go of what I am, I become what I might be.", author: "Lao Tzu", category: "Growth", tier: 1 },
    { id: 'aw_21', text: "Silence is a source of great strength.", author: "Lao Tzu", category: "Strength", tier: 1 },
    { id: 'aw_22', text: "Give a man a fish and you feed him for a day. Teach him how to fish and you feed him for a lifetime.", author: "Lao Tzu", category: "Education", tier: 1 },
    { id: 'aw_23', text: "Kindness in words creates confidence. Kindness in thinking creates profoundness. Kindness in giving creates love.", author: "Lao Tzu", category: "Kindness", tier: 1 },
    { id: 'aw_24', text: "Being deeply loved by someone gives you strength, while loving someone deeply gives you courage.", author: "Lao Tzu", category: "Love", tier: 1 },
    { id: 'aw_25', text: "The truth is not always beautiful, nor beautiful words the truth.", author: "Lao Tzu", category: "Truth", tier: 1 },
    { id: 'aw_26', text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci", category: "Simplicity", tier: 1 },
    { id: 'aw_27', text: "Knowing is not enough; we must apply. Being willing is not enough; we must do.", author: "Leonardo da Vinci", category: "Action", tier: 1 },
    { id: 'aw_28', text: "I have been impressed with the urgency of doing. Knowing is not enough; we must apply. Being willing is not enough; we must do.", author: "Leonardo da Vinci", category: "Action", tier: 1 },
    { id: 'aw_29', text: "Details make perfection, and perfection is not a detail.", author: "Leonardo da Vinci", category: "Excellence", tier: 1 },
    { id: 'aw_30', text: "Art is never finished, only abandoned.", author: "Leonardo da Vinci", category: "Creativity", tier: 1 },
    { id: 'aw_31', text: "Study without desire spoils the memory, and it retains nothing that it takes in.", author: "Leonardo da Vinci", category: "Learning", tier: 1 },
    { id: 'aw_32', text: "Learning never exhausts the mind.", author: "Leonardo da Vinci", category: "Learning", tier: 1 },
    { id: 'aw_33', text: "Time stays long enough for anyone who will use it.", author: "Leonardo da Vinci", category: "Time", tier: 1 },
    { id: 'aw_34', text: "Make your work to be in keeping with your purpose.", author: "Leonardo da Vinci", category: "Purpose", tier: 1 },
    { id: 'aw_35', text: "Who sows virtue reaps honor.", author: "Leonardo da Vinci", category: "Virtue", tier: 1 },
    { id: 'aw_36', text: "The unexamined life is not worth living.", author: "Socrates", category: "Wisdom", tier: 1 },
    { id: 'aw_37', text: "I cannot teach anybody anything. I can only make them think.", author: "Socrates", category: "Teaching", tier: 1 },
    { id: 'aw_38', text: "Wonder is the beginning of wisdom.", author: "Socrates", category: "Wisdom", tier: 1 },
    { id: 'aw_39', text: "To find yourself, think for yourself.", author: "Socrates", category: "Individuality", tier: 1 },
    { id: 'aw_40', text: "Be kind, for everyone you meet is fighting a hard battle.", author: "Plato", category: "Kindness", tier: 1 },
    { id: 'aw_41', text: "Wise men speak because they have something to say; Fools because they have to say something.", author: "Plato", category: "Wisdom", tier: 1 },
    { id: 'aw_42', text: "Music is a moral law. It gives soul to the universe, wings to the mind, flight to the imagination, and charm and gaiety to life and to everything.", author: "Plato", category: "Music", tier: 1 },
    { id: 'aw_43', text: "The first and greatest victory is to conquer yourself.", author: "Plato", category: "Self-Control", tier: 1 },
    { id: 'aw_44', text: "Human behavior flows from three main sources: desire, emotion, and knowledge.", author: "Plato", category: "Psychology", tier: 1 },
    { id: 'aw_45', text: "At the touch of love everyone becomes a poet.", author: "Plato", category: "Love", tier: 1 },
    { id: 'aw_46', text: "There is in every one of us, even those who seem to be most moderate, a type of desire that is terrible, wild, and lawless.", author: "Plato", category: "Human Nature", tier: 1 },
    { id: 'aw_47', text: "Good actions give strength to ourselves and inspire good actions in others.", author: "Plato", category: "Inspiration", tier: 1 },
    { id: 'aw_48', text: "Courage is knowing what not to fear.", author: "Plato", category: "Courage", tier: 1 },
    { id: 'aw_49', text: "You can discover more about a person in an hour of play than in a year of conversation.", author: "Plato", category: "Insight", tier: 1 },
    { id: 'aw_50', text: "We become just by performing just actions, temperate by performing temperate actions, brave by performing brave actions.", author: "Aristotle", category: "Habit", tier: 1 },
    { id: 'aw_51', text: "It is the mark of an educated mind to be able to entertain a thought without accepting it.", author: "Aristotle", category: "Intellect", tier: 1 },
    { id: 'aw_52', text: "Excellence is never an accident. It is always the result of high intention, sincere effort, and intelligent execution.", author: "Aristotle", category: "Excellence", tier: 1 },
    { id: 'aw_53', text: "Choice, not chance, determines your destiny.", author: "Aristotle", category: "Choice", tier: 1 },
    { id: 'aw_54', text: "The roots of education are bitter, but the fruit is sweet.", author: "Aristotle", category: "Education", tier: 1 },
    { id: 'aw_55', text: "Happiness depends upon ourselves.", author: "Aristotle", category: "Happiness", tier: 1 },
    { id: 'aw_56', text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", category: "Wisdom", tier: 1 },
    { id: 'aw_57', text: "Hope is a waking dream.", author: "Aristotle", category: "Hope", tier: 1 },
    { id: 'aw_58', text: "Quality is not an act, it is a habit.", author: "Aristotle", category: "Quality", tier: 1 },
    { id: 'aw_59', text: "He who is unable to live in society, or who has no need because he is sufficient for himself, must be either a beast or a god.", author: "Aristotle", category: "Society", tier: 1 },
    { id: 'aw_60', text: "Freedom is the right to tell people what they do not want to hear.", author: "George Orwell", category: "Freedom", tier: 1 },
    { id: 'aw_61', text: "In a time of deceit, telling the truth is a revolutionary act.", author: "George Orwell", category: "Truth", tier: 1 },
    { id: 'aw_62', text: "The most effective way to destroy people is to deny and obliterate their own understanding of their history.", author: "George Orwell", category: "History", tier: 1 },
    { id: 'aw_63', text: "If you want a vision of the future, imagine a boot stamping on a human face - forever.", author: "George Orwell", category: "Warning", tier: 1 },
    { id: 'aw_64', text: "Who controls the past controls the future. Who controls the present controls the past.", author: "George Orwell", category: "Power", tier: 1 },
    { id: 'aw_65', text: "Doublethink means the power of holding two contradictory beliefs in one's mind simultaneously, and accepting both of them.", author: "George Orwell", category: "Psychology", tier: 1 },
    { id: 'aw_66', text: "Perhaps one did not want to be loved so much as to be understood.", author: "George Orwell", category: "Understanding", tier: 1 },
    { id: 'aw_67', text: "Happiness can exist only in acceptance.", author: "George Orwell", category: "Happiness", tier: 1 },
    { id: 'aw_68', text: "The essence of being human is that one does not seek perfection.", author: "George Orwell", category: "Humanity", tier: 1 },
    { id: 'aw_69', text: "War is peace. Freedom is slavery. Ignorance is strength.", author: "George Orwell", category: "Paradox", tier: 1 },
    { id: 'aw_70', text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson", category: "Originality", tier: 1 },
    { id: 'aw_71', text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.", author: "Ralph Waldo Emerson", category: "Authenticity", tier: 1 },
    { id: 'aw_72', text: "For every minute you are angry you lose sixty seconds of happiness.", author: "Ralph Waldo Emerson", category: "Happiness", tier: 1 },
    { id: 'aw_73', text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", category: "Potential", tier: 1 },
    { id: 'aw_74', text: "It is not the length of life, but the depth.", author: "Ralph Waldo Emerson", category: "Life", tier: 1 },
    { id: 'aw_75', text: "Nothing great was ever achieved without enthusiasm.", author: "Ralph Waldo Emerson", category: "Passion", tier: 1 },
    { id: 'aw_76', text: "The only way to have a friend is to be one.", author: "Ralph Waldo Emerson", category: "Friendship", tier: 1 },
    { id: 'aw_77', text: "Dare to live the life you have dreamed for yourself. Go forward and make your dreams come true.", author: "Ralph Waldo Emerson", category: "Dreams", tier: 1 },
    { id: 'aw_78', text: "Our greatest glory is not in never failing, but in rising up every time we fail.", author: "Ralph Waldo Emerson", category: "Resilience", tier: 1 },
    { id: 'aw_79', text: "Adopt the pace of nature: her secret is patience.", author: "Ralph Waldo Emerson", category: "Nature", tier: 1 },
    { id: 'aw_80', text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt", category: "Action", tier: 1 },
    { id: 'aw_81', text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Belief", tier: 1 },
    { id: 'aw_82', text: "The only man who never makes a mistake is the man who never does anything.", author: "Theodore Roosevelt", category: "Action", tier: 1 },
    { id: 'aw_83', text: "Courage is not the absence of fear, but rather the assessment that something else is more important than fear.", author: "Franklin D. Roosevelt", category: "Courage", tier: 1 },
    { id: 'aw_84', text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt", category: "Doubt", tier: 1 },
    { id: 'aw_85', text: "When you reach the end of your rope, tie a knot in it and hang on.", author: "Franklin D. Roosevelt", category: "Perseverance", tier: 1 },
    { id: 'aw_86', text: "Happiness lies in the joy of achievement and the thrill of creative effort.", author: "Franklin D. Roosevelt", category: "Happiness", tier: 1 },
    { id: 'aw_87', text: "A smooth sea never made a skilled sailor.", author: "Franklin D. Roosevelt", category: "Adversity", tier: 1 },
    { id: 'aw_88', text: "There are many ways of going forward, but only one way of standing still.", author: "Franklin D. Roosevelt", category: "Progress", tier: 1 },
    { id: 'aw_89', text: "We cannot always build the future for our youth, but we can build our youth for the future.", author: "Franklin D. Roosevelt", category: "Future", tier: 1 },
    { id: 'aw_90', text: "I have a dream.", author: "Martin Luther King Jr.", category: "Vision", tier: 1 },
    { id: 'aw_91', text: "Darkness cannot drive out darkness; only light can do that. Hate cannot drive out hate; only love can do that.", author: "Martin Luther King Jr.", category: "Love", tier: 1 },
    { id: 'aw_92', text: "Injustice anywhere is a threat to justice everywhere.", author: "Martin Luther King Jr.", category: "Justice", tier: 1 },
    { id: 'aw_93', text: "Faith is taking the first step even when you don't see the whole staircase.", author: "Martin Luther King Jr.", category: "Faith", tier: 1 },
    { id: 'aw_94', text: "The time is always right to do what is right.", author: "Martin Luther King Jr.", category: "Ethics", tier: 1 },
    { id: 'aw_95', text: "Our lives begin to end the day we become silent about things that matter.", author: "Martin Luther King Jr.", category: "Action", tier: 1 },
    { id: 'aw_96', text: "Life's most persistent and urgent question is, 'What are you doing for others?'", author: "Martin Luther King Jr.", category: "Service", tier: 1 },
    { id: 'aw_97', text: "We must accept finite disappointment, but never lose infinite hope.", author: "Martin Luther King Jr.", category: "Hope", tier: 1 },
    { id: 'aw_98', text: "Love is the only force capable of transforming an enemy into a friend.", author: "Martin Luther King Jr.", category: "Love", tier: 1 },
    { id: 'aw_99', text: "If I cannot do great things, I can do small things in a great way.", author: "Martin Luther King Jr.", category: "Excellence", tier: 1 },
    { id: 'aw_100', text: "We may have all come on different ships, but we're in the same boat now.", author: "Martin Luther King Jr.", category: "Unity", tier: 1 },

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
