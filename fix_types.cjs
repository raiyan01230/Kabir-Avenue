const fs = require('fs');

// queries.ts
let qCode = fs.readFileSync('src/lib/queries.ts', 'utf8');
qCode = qCode.replace(/hasVariants: boolean;/g, 'hasVariants?: boolean;');
fs.writeFileSync('src/lib/queries.ts', qCode);

// wishlist.ts
let wCode = fs.readFileSync('src/lib/wishlist.ts', 'utf8');
wCode = wCode.replace(/variantId: string;/g, 'variantId?: string;');
fs.writeFileSync('src/lib/wishlist.ts', wCode);

// WishlistContext.tsx
let wcCode = fs.readFileSync('src/context/WishlistContext.tsx', 'utf8');
wcCode = wcCode.replace(/variantId: string;/g, 'variantId?: string;');
fs.writeFileSync('src/context/WishlistContext.tsx', wcCode);

