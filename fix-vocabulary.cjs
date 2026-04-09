const fs = require('fs');
const path = require('path');

const srcDir = path.join('/Users/michaelvargas/Documents/AntiG/Palante App/src');

function walkSync(dir, filelist = []) {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walkSync(dirFile, filelist);
        } else {
            if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
                filelist.push(dirFile);
            }
        }
    });
    return filelist;
}

const files = walkSync(srcDir);

for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Replace Week Warrior
    content = content.replace(/Week Warrior/gi, "Week Thriver");
    content = content.replace(/week_warrior/gi, "week_thriver");
    content = content.replace(/year_warrior/gi, "year_thriver");
    content = content.replace(/Year Warrior/gi, "Year Thriver");

    // Replace fast name
    content = content.replace(/Warrior Fast/g, "Deep Fast");

    // Replace authors in affirmations.ts
    if (file.endsWith('affirmations.ts')) {
        content = content.replace(/author: "Fire"/g, 'author: "Palante Coach"');
        content = content.replace(/author: "Focus"/g, 'author: "Palante Coach"');
        content = content.replace(/author: "Muse"/g, 'author: "Palante Coach"');
    }

    // Handle specific quote replacements
    content = content.replace(/conquer yourself than to win a thousand battles/gi, 'master yourself than to win a thousand races');
    content = content.replace(/The successful warrior is/gi, 'The successful achiever is');
    content = content.replace(/Start conquering/gi, 'Start thriving');
    content = content.replace(/conquer self/gi, 'master self');
    content = content.replace(/He who conquers himself is the mightiest warrior/gi, 'He who masters himself possesses true strength');
    content = content.replace(/Man conquers the world by conquering himself/gi, 'Man transforms the world by mastering himself');
    content = content.replace(/victory is to conquer yourself/gi, 'victory is to master yourself');
    content = content.replace(/Victorious warriors win first and then go to war, while defeated warriors go to war first and then seek to win/gi, 'Victorious leaders succeed first and then act, while defeated leaders act first and then seek to succeed');
    content = content.replace(/persistence conquer all things/gi, 'persistence overcome all things');

    // Fix remaining conquer usages anywhere
    content = content.replace(/to conquer/gi, 'to master');
    content = content.replace(/conquers/gi, 'masters');

    if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log("Updated", file);
    }
}
