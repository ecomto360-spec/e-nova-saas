const fs = require('fs');
let fileContent = fs.readFileSync('src/pages/LandingPagePublicView.tsx', 'utf8');
fileContent = fileContent.replace(/{section\.content\.split\('\\n'\)\.map\(/g, '{section.content.split(\'\\\\n\').map(');
fileContent = fileContent.replace(/section.content.split\('\n'\)/g, "section.content.split('\\n')");
fs.writeFileSync('src/pages/LandingPagePublicView.tsx', fileContent);
