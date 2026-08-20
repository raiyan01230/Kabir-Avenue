const fs = require('fs');
let ctx = fs.readFileSync('src/context/WishlistContext.tsx', 'utf8');
ctx = ctx.replace(/productId: '1',/g, "productId: '1', variantId: null,");
ctx = ctx.replace(/productId: '2',/g, "productId: '2', variantId: null,");
fs.writeFileSync('src/context/WishlistContext.tsx', ctx);

let lib = fs.readFileSync('src/lib/wishlist.ts', 'utf8');
lib = lib.replace(/productId: '1',/g, "productId: '1', variantId: null,");
lib = lib.replace(/productId: '2',/g, "productId: '2', variantId: null,");
fs.writeFileSync('src/lib/wishlist.ts', lib);
