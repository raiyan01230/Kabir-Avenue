const fs = require('fs');

let wTs = fs.readFileSync('src/lib/wishlist.ts', 'utf8');
// WishlistItem was reduced to never because I probably added something conflicting. Let's rebuild the type
wTs = wTs.replace(/export interface WishlistItem \{[\s\S]*?product: \{/g, `export type WishlistItem = import("drizzle-orm").InferSelectModel<typeof import("../db/schema").wishlistItems> & {
  product?: any;
};
// `);
fs.writeFileSync('src/lib/wishlist.ts', wTs);


let wc = fs.readFileSync('src/context/WishlistContext.tsx', 'utf8');
wc = wc.replace(/export interface WishlistItem \{[\s\S]*?product: \{/g, `// `);
fs.writeFileSync('src/context/WishlistContext.tsx', wc);

let pdp = fs.readFileSync('src/pages/ProductDetailsPage.tsx', 'utf8');
// fix duplicate inWishlist
pdp = pdp.replace(/const inWishlist = isInWishlist\(product\.id\);\n  const displayPrice/g, '  const displayPrice');
fs.writeFileSync('src/pages/ProductDetailsPage.tsx', pdp);

