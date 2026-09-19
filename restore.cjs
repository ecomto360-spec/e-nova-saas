const fs = require('fs');
let fileContent = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

// The issue was `fileContent.indexOf('return (')` found the FIRST return inside `if (loading) { return ( ... ) }`
// Let's restore from git
const { execSync } = require('child_process');
execSync('git checkout src/pages/LandingPagePublicView.tsx');

