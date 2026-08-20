const fs = require('fs');
let code = fs.readFileSync('src/lib/queries.ts', 'utf8');

code = code.replace(/return res\.ok;\n   catch \(error\) \{/g, 'return res.ok;\n  } catch (error) {');

fs.writeFileSync('src/lib/queries.ts', code);
