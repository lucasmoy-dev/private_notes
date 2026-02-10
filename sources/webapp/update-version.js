import fs from 'fs';

// Simple script to sync package.json version to src/constants.js
const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = pkg.version;

const constantsPath = './src/constants.js';
let content = fs.readFileSync(constantsPath, 'utf8');

// Replace export const APP_VERSION = 'v...'; or '...'
// We use a regex that matches the current pattern
content = content.replace(/export const APP_VERSION = 'v?[^']+';/, `export const APP_VERSION = 'v${version}';`);

fs.writeFileSync(constantsPath, content);
console.log(`Updated src/constants.js to version v${version}`);
