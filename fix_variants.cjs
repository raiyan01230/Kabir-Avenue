const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminProductVariantsEditor.tsx', 'utf8');

code = code.replace(/id: \\\`new-\\\$\{Math\.random\(\)\}\\\`,/g, 'id: `new-${Math.random()}`,');
code = code.replace(/sku: \\\`\\\$\{productSku \|\| 'SKU'\}\\\-\\\$\{variantNamePart\}\\\`,/g, 'sku: `${productSku || \'SKU\'}-${variantNamePart}`,');
code = code.replace(/id: \\\`new-\\\$\{Math\.random\(\)\}\\\`/g, 'id: `new-${Math.random()}`');

fs.writeFileSync('src/components/admin/AdminProductVariantsEditor.tsx', code);
