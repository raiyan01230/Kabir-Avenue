const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(/await db\.from\('product_presets'\)\.insert\(\[\{/g, "await db.from('product_presets').insert([{\n      name, description, attributes\n    }] as any).select().single(); // ");

fs.writeFileSync('server.ts', code);
