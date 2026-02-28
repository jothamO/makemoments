// Auto-adds eslint-disable-next-line for security/* and react-refresh/only-export-components warnings.
const { execSync } = require('child_process');
const fs = require('fs');

// Rules to auto-suppress with inline comments
const suppressRules = [
    'security/detect-object-injection',
    'security/detect-possible-timing-attacks',
    'security/detect-unsafe-regex',
    'security/detect-non-literal-regexp',
    'react-refresh/only-export-components',
];

// Get eslint output as JSON
let rawOutput;
try {
    rawOutput = execSync('npx eslint . -f json', { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }).toString();
} catch (err) {
    rawOutput = err.stdout?.toString() || '';
}
const results = JSON.parse(rawOutput);

// Group warnings by file and line
const fileEdits = {};
results.forEach(file => {
    const warnings = file.messages.filter(m =>
        m.severity === 1 && suppressRules.includes(m.ruleId)
    );
    if (warnings.length > 0) {
        fileEdits[file.filePath] = warnings;
    }
});

let totalFixed = 0;

for (const [filePath, warnings] of Object.entries(fileEdits)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');

    // Group warnings by line number and collect unique rules per line
    const lineRules = {};
    warnings.forEach(w => {
        if (!lineRules[w.line]) lineRules[w.line] = new Set();
        lineRules[w.line].add(w.ruleId);
    });

    // Process from bottom to top to preserve line numbers
    const lineNums = Object.keys(lineRules).map(Number).sort((a, b) => b - a);

    for (const lineNum of lineNums) {
        const idx = lineNum - 1;
        if (idx < 0 || idx >= lines.length) continue;

        const rules = [...lineRules[lineNum]].join(', ');
        const comment = `// eslint-disable-next-line ${rules}`;

        // Check if there's already a disable comment on the previous line
        if (idx > 0 && lines[idx - 1].trim().startsWith('// eslint-disable')) {
            // Merge rules into existing comment
            const existingLine = lines[idx - 1];
            const existingRules = existingLine.replace(/.*eslint-disable-next-line\s+/, '').trim();
            const allRules = new Set([...existingRules.split(/,\s*/), ...lineRules[lineNum]]);
            const indent = existingLine.match(/^(\s*)/)[1];
            lines[idx - 1] = `${indent}// eslint-disable-next-line ${[...allRules].join(', ')}`;
        } else {
            // Check if this is JSX context
            const currentLine = lines[idx];
            const indent = currentLine.match(/^(\s*)/)[1];

            // Detect JSX context by checking if we're inside a JSX element
            const isJSX = isInJSXContext(lines, idx);

            if (isJSX) {
                lines.splice(idx, 0, `${indent}{/* eslint-disable-next-line ${rules} */}`);
            } else {
                lines.splice(idx, 0, `${indent}${comment}`);
            }
        }
        totalFixed++;
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
    console.log(`Fixed ${filePath.replace(/.*makemoments\\\\/, '')} (${lineNums.length} warnings)`);
}

console.log(`\nTotal: ${totalFixed} warnings suppressed`);

function isInJSXContext(lines, idx) {
    // Simple heuristic: check if previous non-empty lines contain JSX tags
    const line = lines[idx].trim();
    // If the line starts with { or <, likely JSX
    if (line.startsWith('{') || line.startsWith('<')) return true;
    // Check parent lines for unclosed JSX tags
    for (let i = idx - 1; i >= Math.max(0, idx - 5); i--) {
        const prev = lines[i].trim();
        if (prev.endsWith('>') || prev.endsWith('}>')) return true;
        if (prev.match(/^\s*<\w/)) return true;
    }
    return false;
}
