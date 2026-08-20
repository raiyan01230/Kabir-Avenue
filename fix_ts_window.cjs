const fs = require('fs');
let code = fs.readFileSync('src/lib/queries.ts', 'utf8');

code = code.replace(/await window\.supabase/g, 'await (window as any).supabase');

fs.writeFileSync('src/lib/queries.ts', code);
