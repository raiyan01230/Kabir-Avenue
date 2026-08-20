const fs = require('fs');
let lib = fs.readFileSync('src/lib/wishlist.ts', 'utf8');
lib = lib.replace(/export type WishlistItem = InferSelectModel<typeof wishlistItems> & \{[\s\S]*?\}\;\n\}\;/g, '');
fs.writeFileSync('src/lib/wishlist.ts', lib);
