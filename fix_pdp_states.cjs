const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');

// Add selectedVariant
const statePattern = /const \[toast, setToast\] = useState<\{ message: string; type: 'success' \| 'error' \} \| null>\(null\);/;
const stateReplacement = `const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);\n  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);`;
if (!code.includes('selectedVariant, setSelectedVariant')) {
  code = code.replace(statePattern, stateReplacement);
}

// Add Variant Selector Import
const importPattern = /import ProductCard from '\.\.\/components\/ProductCard';/;
const importReplacement = `import ProductCard from '../components/ProductCard';\nimport ProductVariantSelector from '../components/ProductVariantSelector';`;
if (!code.includes('ProductVariantSelector')) {
  code = code.replace(importPattern, importReplacement);
}

// Calculate displayPrice, displayStock
const stockPattern = /const inWishlist = isInWishlist\(product\.id\);\n\s*const isOutOfStock = Number\(product\.stock_quantity \|\| 0\) <= 0;/;
const stockReplacement = `const inWishlist = isInWishlist(product.id);\n  const displayPrice = selectedVariant && selectedVariant.price !== null ? Number(selectedVariant.price) : Number(product.price);\n  const displayComparePrice = selectedVariant && selectedVariant.compare_price !== null ? Number(selectedVariant.compare_price) : Number(product.compare_price || 0);\n  const displayStock = selectedVariant ? Number(selectedVariant.stock_quantity) : Number(product.stock_quantity || 0);\n  const isOutOfStock = displayStock <= 0;`;
if (!code.includes('const displayPrice =')) {
  code = code.replace(stockPattern, stockReplacement);
}

// Fix addToCart
const addToCartPattern = /if \(isOutOfStock\) \{\n\s*showToast\('This product is currently out of stock', 'error'\);\n\s*return;\n\s*\}/g;
const addToCartReplacement = `if (isOutOfStock) {
      showToast('This product is currently out of stock', 'error');
      return;
    }
    if (product.has_variants && !selectedVariant) {
      showToast('Please select all options before proceeding.', 'error');
      return;
    }`;
if (!code.includes('Please select all options before proceeding.')) {
  code = code.replace(addToCartPattern, addToCartReplacement);
}

const addCallPattern = /addToCart\(product, quantity\);/;
const addCallReplacement = `addToCart(product, quantity, selectedVariant);`;
code = code.replace(addCallPattern, addCallReplacement);

const buyCallPattern = /setBuyNow\(product, quantity\);/;
const buyCallReplacement = `setBuyNow(product, quantity, selectedVariant);`;
code = code.replace(buyCallPattern, buyCallReplacement);


// Inject selector
const selectorPattern = /\{\/\* Quantity Selector \*\/\}/;
const selectorReplacement = `{/* Variant Selector */}
            {product.has_variants && product.product_attributes && product.product_variants && product.product_variants.length > 0 && (
              <div className="pt-4 border-t border-slate-200">
                <ProductVariantSelector 
                  attributes={product.product_attributes} 
                  variants={product.product_variants} 
                  onVariantSelected={setSelectedVariant}
                />
              </div>
            )}

          {/* Quantity Selector */}`;
if (!code.includes('ProductVariantSelector attributes')) {
  code = code.replace(selectorPattern, selectorReplacement);
}

// Replace price rendering
code = code.replace(/৳\{Number\(product\.price\)\.toLocaleString\(\)\}/g, '৳{displayPrice.toLocaleString()}');
code = code.replace(/৳\{Number\(product\.compare_price\)\.toLocaleString\(\)\}/g, '৳{displayComparePrice.toLocaleString()}');
code = code.replace(/product\.compare_price/g, 'displayComparePrice');

fs.writeFileSync('src/pages/ProductDetailsPage.tsx', code);
