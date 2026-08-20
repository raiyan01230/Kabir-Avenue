const fs = require('fs');
let code = fs.readFileSync('src/lib/queries.ts', 'utf8');

if (!code.includes('import { eq, desc } from')) {
    code = code.replace(/import { InferSelectModel } from 'drizzle-orm';/, "import { InferSelectModel, eq, desc } from 'drizzle-orm';");
    fs.writeFileSync('src/lib/queries.ts', code);
}
