const fs = require('fs');

let content = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

// Modify the link to pass current slug if available, but for now we'll just open in a new tab
content = content.replace(
  /<Link\s*to="\/store"\s*className="flex items-center gap-2 rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 transition-colors"\s*>\s*<Eye className="h-4 w-4" \/>\s*\{t\('header\.viewStore'\)\}\s*<\/Link>/,
  `<a 
          href="/store"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-md bg-yellow-500 px-4 py-2 text-sm font-medium text-black hover:bg-yellow-400 transition-colors"
        >
          <Eye className="h-4 w-4" />
          {t('header.viewStore')}
        </a>`
);

fs.writeFileSync('src/components/layout/Header.tsx', content);
console.log("Header updated");
