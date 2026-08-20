const fs = require('fs');
let code = fs.readFileSync('src/lib/email.ts', 'utf8');

const itemsPattern = /name: item\.product\?\.name \|\| item\.name \|\| item\.product_name_snapshot \|\| 'Product Item',/;
const itemsReplacement = `name: item.product?.name || item.name || item.product_name_snapshot || 'Product Item',
        variant: item.variant || (item.variant_info_snapshot ? Object.entries(item.variant_info_snapshot.attributes || {}).map(([k,v]) => \`\${k}: \${v}\`).join(', ') : null),`;

if(!code.includes('variant: item.variant ||')) {
    code = code.replace(itemsPattern, itemsReplacement);
    fs.writeFileSync('src/lib/email.ts', code);
    console.log('Email lib updated');
}
