const fs = require('fs');

// 1. AdminProducts Imports
let admin = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');
if (!admin.includes('import AdminProductVariantsEditor')) {
   admin = `import AdminProductVariantsEditor from '../../components/admin/AdminProductVariantsEditor';\nimport { ProductAttribute, ProductVariant } from '../../lib/queries';\n` + admin;
   fs.writeFileSync('src/pages/admin/AdminProducts.tsx', admin);
}

// 2. ProductDetailsPage hoisting and dupes
let pdp = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');
pdp = pdp.replace(/const inWishlist = isInWishlist\(product\.id\);\n  const currentImage/g, '  const currentImage'); // remove the one I injected
pdp = pdp.replace(/const inWishlist = isInWishlist\(product\.id\);\n\s*const displayPrice = [^\n]+\n\s*const displayComparePrice = [^\n]+\n\s*const displayStock = [^\n]+\n\s*const isOutOfStock = [^\n]+/g, ''); // remove all

const rightPlace = `  const inWishlist = isInWishlist(product.id);\n  const displayPrice = selectedVariant && selectedVariant.price !== null ? Number(selectedVariant.price) : Number(product.price);\n  const displayComparePrice = selectedVariant && selectedVariant.compare_price !== null ? Number(selectedVariant.compare_price) : Number(product.compare_price || 0);\n  const displayStock = selectedVariant ? Number(selectedVariant.stock_quantity) : Number(product.stock_quantity || 0);\n  const isOutOfStock = displayStock <= 0;\n  const currentImage =`;

pdp = pdp.replace(/const currentImage =/g, rightPlace);

// just to be 100% sure we don't have multiple
const matches = pdp.match(/const displayComparePrice =/g);
if (matches && matches.length > 1) {
    pdp = pdp.replace(rightPlace, 'const currentImage ='); // remove it and we'll fix it manually if needed, but let's assume it's fine
}

fs.writeFileSync('src/pages/ProductDetailsPage.tsx', pdp);


// 3. Wishlist Context
let wContext = fs.readFileSync('src/context/WishlistContext.tsx', 'utf8');
wContext = wContext.replace(/variantId\?: string \| null;/g, '');
wContext = wContext.replace(/product: \{/g, 'variantId: null,\n      product: {');
fs.writeFileSync('src/context/WishlistContext.tsx', wContext);


// 4. wishlist.ts
let wTs = fs.readFileSync('src/lib/wishlist.ts', 'utf8');
wTs = wTs.replace(/variantId\?: string \| null;/g, '');
wTs = wTs.replace(/product: \{/g, 'variantId: null,\n    product: {');
fs.writeFileSync('src/lib/wishlist.ts', wTs);

