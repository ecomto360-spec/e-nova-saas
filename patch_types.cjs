const fs = require('fs');
let code = fs.readFileSync('src/pages/LandingPages.tsx', 'utf8');

code = code.replace(
  /Array\.from\(e\.dataTransfer\.files\)\.filter\(f =>/g,
  'Array.from(e.dataTransfer.files).filter((f: any) =>'
);
code = code.replace(
  /Array\.from\(e\.target\.files\)\.filter\(f =>/g,
  'Array.from(e.target.files).filter((f: any) =>'
);

fs.writeFileSync('src/pages/LandingPages.tsx', code);
