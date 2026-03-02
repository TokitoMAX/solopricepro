const fs = require('fs');
const path = require('path');

const EMOJI_REGEX = /([\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}\u{2B50}\u{23F3}])/gu;

const targetExts = ['.js', '.html'];
const exDirs = ['node_modules', '.git', '.vscode', 'backend', 'dist'];

function processDirectory(dir) {
    let filesReplaced = 0;
    let emojisRemoved = 0;

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!exDirs.includes(file)) {
                const result = processDirectory(fullPath);
                filesReplaced += result.filesReplaced;
                emojisRemoved += result.emojisRemoved;
            }
        } else if (targetExts.includes(path.extname(fullPath))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let hasEmoji = EMOJI_REGEX.test(content);

            if (hasEmoji) {
                const initialLen = content.length;
                content = content.replace(EMOJI_REGEX, '');
                fs.writeFileSync(fullPath, content, 'utf8');

                filesReplaced++;
                emojisRemoved += (initialLen - content.length);
                console.log(`Cleaned: ${fullPath}`);
            }
        }
    }

    return { filesReplaced, emojisRemoved };
}

console.log('--- Starting emoji cleanup ---');
const stats = processDirectory(__dirname);
console.log('--- Finished ---');
console.log(`Files modified: ${stats.filesReplaced}`);
console.log(`Emojis removed: ${stats.emojisRemoved}`);
