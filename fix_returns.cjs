const fs = require('fs');

const fileContent = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');

const lastReturn = fileContent.lastIndexOf('return (');
const nextBrace = fileContent.lastIndexOf('}');
if (lastReturn !== -1) {
   let content = fileContent.substring(0, lastReturn);
   // Wait, what's wrong with the file? Let's check where the return ( is...
}

