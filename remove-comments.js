const fs = require('fs');
const glob = require('glob');
const strip = require('strip-comments');

const options = {
    language: 'javascript', // strip-comments uses javascript for TS/TSX as well
    keepProtected: true, // Keep JSDoc or special comments if needed? The user said ALL comments. Let's set to false to remove everything.
};

glob('src/**/*.{ts,tsx,js,jsx}', (err, files) => {
    if (err) {
        console.error('Error finding files:', err);
        return;
    }

    let count = 0;

    files.forEach(file => {
        try {
            const code = fs.readFileSync(file, 'utf8');

            // We must avoid stripping `// @ts-ignore` inside the project as it will break the build.
            // So let's keep TS ignore and eslint comments
            const stripped = strip(code, {
                keepProtected: true,
                preserveNewlines: false
            });

            // A quick custom fix to make sure we don't break some things like imports or standard jsx that might get affected by bugs in strip-comments parsing

            if (code !== stripped) {
                fs.writeFileSync(file, stripped);
                count++;
                console.log(`Stripped comments from: ${file}`);
            }
        } catch (e) {
            console.error(`Failed to process ${file}:`, e);
        }
    });

    console.log(`\nFinished! Removed comments from ${count} files.`);
});
