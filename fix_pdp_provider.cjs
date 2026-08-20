const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');

if (!code.includes('VariantProvider')) {
  code = code.replace(/import ProductVariantSelector from '\.\.\/components\/ProductVariantSelector';/, "import ProductVariantSelector from '../components/ProductVariantSelector';\nimport { VariantProvider } from '../context/VariantContext';");
  
  // Wrap the variant selector and add to cart section with VariantProvider? 
  // No, just wrap the whole ProductDetailsPage return or just the VariantSelector.
  // Wait, if ProductDetailsPage needs selectedVariant, maybe I should wrap the specific parts, but wait, the page itself manages selectedVariant via onVariantSelected.
  
  // Actually, I can just wrap the ProductVariantSelector in the page with VariantProvider!
  code = code.replace(/<ProductVariantSelector/g, '<VariantProvider><ProductVariantSelector');
  code = code.replace(/onVariantSelected=\{setSelectedVariant\}\n\s*\/>/g, 'onVariantSelected={setSelectedVariant}\n                /></VariantProvider>');

  fs.writeFileSync('src/pages/ProductDetailsPage.tsx', code);
}
