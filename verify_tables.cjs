const fs = require('fs');
const schema = fs.readFileSync('src/db/schema.ts', 'utf8');

// just to make sure it compiles
console.log("Schema has variants:", schema.includes('product_variants'));
