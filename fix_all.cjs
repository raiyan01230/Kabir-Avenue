const fs = require('fs');

// 1. Fix AdminProducts.tsx
let adminProducts = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');
if (!adminProducts.includes('AdminProductVariantsEditor')) {
  adminProducts = `import AdminProductVariantsEditor from '../../components/admin/AdminProductVariantsEditor';\nimport { ProductAttribute, ProductVariant } from '../../lib/queries';\n` + adminProducts;
  fs.writeFileSync('src/pages/admin/AdminProducts.tsx', adminProducts);
}

// 2. Fix ProductDetailsPage.tsx - hoist variables
let pdp = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');
// remove the block and put it at the top
const extractPattern = /const inWishlist = isInWishlist\(product\.id\);\n\s*const displayPrice = [^\n]+\n\s*const displayComparePrice = [^\n]+\n\s*const displayStock = [^\n]+\n\s*const isOutOfStock = [^\n]+/;
const extracted = pdp.match(extractPattern);
if (extracted) {
  pdp = pdp.replace(extractPattern, 'const inWishlist = isInWishlist(product.id);');
  
  // Find where to inject it before its usage
  // Usage is around line 218: `const currentImage = galleryImages[selectedImgIdx] || galleryImages[0] || '...'`
  pdp = pdp.replace(/const currentImage = galleryImages\[selectedImgIdx\]/g, extracted[0] + '\n  const currentImage = galleryImages[selectedImgIdx]');
  fs.writeFileSync('src/pages/ProductDetailsPage.tsx', pdp);
}

// 3. Fix queries.ts
let queries = fs.readFileSync('src/lib/queries.ts', 'utf8');
// make hasVariants: false in all MOCK_PRODUCTS
queries = queries.replace(/category_id: '1'/g, "category_id: '1', hasVariants: false");
queries = queries.replace(/category_id: '2'/g, "category_id: '2', hasVariants: false");
queries = queries.replace(/category_id: '3'/g, "category_id: '3', hasVariants: false");
queries = queries.replace(/category_id: '4'/g, "category_id: '4', hasVariants: false");

// wait, type Product = InferSelectModel<typeof products> & { ... }
// I can just make it `export type Product = Omit<InferSelectModel<typeof products>, 'hasVariants'> & { hasVariants?: boolean; ... }`
const productTypePattern = /export type Product = InferSelectModel<typeof products> & \{/;
const productTypeReplacement = `export type Product = Omit<InferSelectModel<typeof products>, 'hasVariants'> & {
  hasVariants?: boolean;`;
queries = queries.replace(productTypePattern, productTypeReplacement);
fs.writeFileSync('src/lib/queries.ts', queries);

// 4. Fix wishlist.ts and WishlistContext.tsx
let wishlist = fs.readFileSync('src/lib/wishlist.ts', 'utf8');
const wlItemPattern = /export interface WishlistItem \{[\s\S]*?\}/;
// let's change it to variantId?: string | null
wishlist = wishlist.replace(/variantId: string;/g, 'variantId?: string | null;');
// also mock data
wishlist = wishlist.replace(/productId: '1',/g, "productId: '1', variantId: null,");
fs.writeFileSync('src/lib/wishlist.ts', wishlist);

let wlCtx = fs.readFileSync('src/context/WishlistContext.tsx', 'utf8');
wlCtx = wlCtx.replace(/variantId: string;/g, 'variantId?: string | null;');
fs.writeFileSync('src/context/WishlistContext.tsx', wlCtx);

