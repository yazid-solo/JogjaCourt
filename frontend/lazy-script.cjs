const fs = require('fs');
let content = fs.readFileSync('src/App.jsx', 'utf8');

// Replace standard imports with lazy imports for pages
const importRegex = /import\s+([A-Za-z0-9_]+)\s+from\s+'\.\/pages([^']+)'/g;
let lazyImports = '';
content = content.replace(importRegex, (match, p1, p2) => {
    lazyImports += `const ${p1} = lazy(() => import('./pages${p2}'));\n`;
    return '';
});

// Fix imports from react
content = content.replace(/import React from 'react';/, "import React, { Suspense, lazy } from 'react';");

// Insert lazy imports after static imports
content = content.replace(/(import GlobalToast.*)/, "$1\n\n// Lazy loaded pages\n" + lazyImports);

// Add PageLoader component
const pageLoader = `\nconst PageLoader = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-neutral-800 border-t-[#D4AF37] rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-neutral-800 border-b-white rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
      </div>
    </div>
    <p className="text-[#D4AF37] font-bold text-sm tracking-widest animate-pulse">MEMUAT...</p>
  </div>
);\n`;
content = content.replace(/const BlankPage/, pageLoader + '\nconst BlankPage');

// Wrap Routes with Suspense
content = content.replace(/<Routes>/, '<Suspense fallback={<PageLoader />}>\n                    <Routes>');
content = content.replace(/<\/Routes>/, '</Routes>\n                    </Suspense>');

fs.writeFileSync('src/App.jsx', content);
console.log('App.jsx updated with lazy loading!');
