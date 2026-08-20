const fs = require('fs');
let code = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');

const importPattern = /import ProductCard from '\.\.\/components\/ProductCard';/;
const importReplacement = `import ProductCard from '../components/ProductCard';\nimport ProductVariantSelector from '../components/ProductVariantSelector';\nimport { ProductVariant } from '../lib/queries';`;
if(!code.includes('ProductVariantSelector')) {
    code = code.replace(importPattern, importReplacement);
}

const statePattern = /const \[selectedImage, setSelectedImage\] = useState<string>('');/;
const stateReplacement = `const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);`;
if(!code.includes('const [selectedVariant, setSelectedVariant]')) {
    code = code.replace(statePattern, stateReplacement);
}

const pricePattern = /const isOutOfStock = stockQty <= 0;/;
const priceReplacement = `const displayPrice = selectedVariant && selectedVariant.price !== null ? Number(selectedVariant.price) : Number(product.price);
  const displayComparePrice = selectedVariant && selectedVariant.compare_price !== null ? Number(selectedVariant.compare_price) : Number(product.compare_price || 0);
  const displayStock = selectedVariant ? Number(selectedVariant.stock_quantity) : stockQty;
  const isOutOfStock = displayStock <= 0;`;
if(!code.includes('const displayPrice = selectedVariant')) {
    code = code.replace(pricePattern, priceReplacement);
    code = code.replace(/Number\(product\.price\)/g, 'displayPrice');
    code = code.replace(/Number\(product\.compare_price \|\| 0\)/g, 'displayComparePrice');
}

const imageEffectPattern = /useEffect\(\(\) => \{\n\s*if \(images\.length > 0\) \{\n\s*setSelectedImage\(images\[0\]\);\n\s*\}\n\s*\}, \[images\.length\]\);/;
const imageEffectReplacement = `useEffect(() => {
    if (selectedVariant && selectedVariant.image_url) {
      setSelectedImage(selectedVariant.image_url);
    } else if (images.length > 0) {
      setSelectedImage(images[0]);
    }
  }, [selectedVariant, images.length]);`;
if(!code.includes('selectedVariant && selectedVariant.image_url')) {
    code = code.replace(imageEffectPattern, imageEffectReplacement);
}

const skuPattern = /SKU: \{product\.sku\}/;
const skuReplacement = `SKU: {selectedVariant ? selectedVariant.sku : product.sku}`;
if(!code.includes('selectedVariant.sku')) {
    code = code.replace(skuPattern, skuReplacement);
}

// Ensure add to cart passes the variant object
const handleAddPattern = /addToCart\(product, quantity\);/;
const handleAddReplacement = `addToCart(product, quantity, selectedVariant);`;
if(!code.includes('addToCart(product, quantity, selectedVariant)')) {
    code = code.replace(handleAddPattern, handleAddReplacement);
}

const handleBuyNowPattern = /setBuyNow\(product, quantity\);/;
const handleBuyNowReplacement = `setBuyNow(product, quantity, selectedVariant);`;
if(!code.includes('setBuyNow(product, quantity, selectedVariant)')) {
    code = code.replace(handleBuyNowPattern, handleBuyNowReplacement);
}


// Insert Variant Selector
const selectorInsertPattern = /\{\/\* Stock & Quantity \*\/\}/;
const selectorInsertReplacement = `
            {/* Variant Selector */}
            {product.has_variants && product.product_attributes && product.product_variants && product.product_variants.length > 0 && (
              <div className="pt-6 border-t border-slate-200">
                <ProductVariantSelector 
                  attributes={product.product_attributes} 
                  variants={product.product_variants} 
                  onVariantSelected={setSelectedVariant}
                />
              </div>
            )}

            {/* Stock & Quantity */}`;
if(!code.includes('ProductVariantSelector attributes')) {
    code = code.replace(selectorInsertPattern, selectorInsertReplacement);
}

// Require variant selection
const requiredVariantPattern = /if \(isOutOfStock\) return;/g;
const requiredVariantReplacement = `if (isOutOfStock) return;
    if (product.has_variants && !selectedVariant) {
      alert('Please select all options before adding to cart.');
      return;
    }`;
if(!code.includes('Please select all options before adding to cart.')) {
    code = code.replace(requiredVariantPattern, requiredVariantReplacement);
}

fs.writeFileSync('src/pages/ProductDetailsPage.tsx', code);
console.log('PDP updated');
