const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

if (!code.includes('jsonb,')) {
  code = code.replace(/boolean,/, "boolean,\n  jsonb,");
  fs.writeFileSync('src/db/schema.ts', code);
  console.log('Fixed imports');
}
