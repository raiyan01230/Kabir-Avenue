const fs = require('fs');

let lib = fs.readFileSync('src/lib/wishlist.ts', 'utf8');
// remove all definitions
lib = lib.replace(/export type WishlistItem = import\("drizzle-orm"\)\.InferSelectModel<typeof import\("\.\.\/db\/schema"\)\.wishlistItems> & \{[\s\S]*?\}\;\n\s*\}\;/g, '');
lib = lib.replace(/export type WishlistItem = import\("drizzle-orm"\)\.InferSelectModel<typeof import\("\.\.\/db\/schema"\)\.wishlistItems> & \{[\s\S]*?\}\;\n\s*\}\;/g, '');

const finalTypeDef = `export type WishlistItem = {
  id: string;
  wishlistId: string;
  productId: string;
  variantId?: string | null;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string | number;
    comparePrice?: string | number | null;
    stockQuantity: number;
    description?: string | null;
    status: string;
  };
};`;
lib = finalTypeDef + '\n' + lib;

// add variantId: null to all MOCK_WISHLIST_ITEMS
lib = lib.replace(/productId: '1',/g, "productId: '1', variantId: null,");
lib = lib.replace(/productId: '2',/g, "productId: '2', variantId: null,");
lib = lib.replace(/productId: 'p-1',/g, "productId: 'p-1', variantId: null,");

fs.writeFileSync('src/lib/wishlist.ts', lib);

let ctx = fs.readFileSync('src/context/WishlistContext.tsx', 'utf8');
ctx = ctx.replace(/productId: 'p-1',/g, "productId: 'p-1', variantId: null,");
fs.writeFileSync('src/context/WishlistContext.tsx', ctx);

