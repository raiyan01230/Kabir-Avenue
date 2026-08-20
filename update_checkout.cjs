const fs = require('fs');
let code = fs.readFileSync('src/components/Checkout.tsx', 'utf8');

const mapPattern = /items: activeItems\.map\(\(item\) => \(\{\n\s*productId: item\.productId,\n\s*quantity: item\.quantity \|\| 1,\n\s*unitPrice: item\.price,\n\s*variant: item\.variant \|\| null,\n\s*product: \{/g;
const mapReplacement = `items: activeItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity || 1,
            unitPrice: item.price,
            variant: item.variant || null,
            variantId: item.variantId || null,
            variantSnapshot: item.variantSnapshot || null,
            product: {`;
if (!code.includes('variantId: item.variantId')) {
  code = code.replace(mapPattern, mapReplacement);
  fs.writeFileSync('src/components/Checkout.tsx', code);
  console.log('Checkout.tsx updated');
}
