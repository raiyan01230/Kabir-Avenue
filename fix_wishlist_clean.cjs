const fs = require('fs');

let ctx = fs.readFileSync('src/context/WishlistContext.tsx', 'utf8');
ctx = ctx.replace(/variantId: null,\n\s*product: \{/g, 'product: {');
fs.writeFileSync('src/context/WishlistContext.tsx', ctx);

let lib = fs.readFileSync('src/lib/wishlist.ts', 'utf8');
lib = lib.replace(/variantId: null,\n\s*product: \{/g, 'product: {');
// Let's redefine WishlistItem fully in lib
lib = lib.replace(/export type WishlistItem = [\s\S]*?\n\/\/\s*/g, '');
lib = lib.replace(/export interface WishlistItem \{[\s\S]*?\}/g, '');

const typeDef = `
export type WishlistItem = import("drizzle-orm").InferSelectModel<typeof import("../db/schema").wishlistItems> & {
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
};
`;
lib = typeDef + '\n' + lib;
fs.writeFileSync('src/lib/wishlist.ts', lib);
