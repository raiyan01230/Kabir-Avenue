const fs = require('fs');
let code = fs.readFileSync('src/lib/queries.ts', 'utf8');

code = code.replace(/} catch \(error\) \{\n    console\.error\('Error deleting preset:', error\);\n    return false;\n  \}\n\}/g, '');

fs.writeFileSync('src/lib/queries.ts', code);
