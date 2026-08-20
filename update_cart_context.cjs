const fs = require('fs');
let code = fs.readFileSync('src/context/CartContext.tsx', 'utf8');

if(!code.includes('variantId?: string')) {
  code = code.replace(/variant\?: string \| null;/, `variant?: string | null;\n  variantId?: string | null;\n  variantSnapshot?: any;`);
  
  // Also update addToCart type to take variant object
  code = code.replace(/addToCart: \(product: Product \| any, quantity\?: number, variant\?: string \| null\)/g, `addToCart: (product: Product | any, quantity?: number, variant?: any | null)`);
  code = code.replace(/updateQuantity: \(productId: string, quantity: number, variant\?: string \| null\)/g, `updateQuantity: (productId: string, quantity: number, variantId?: string | null)`);
  code = code.replace(/removeFromCart: \(productId: string, variant\?: string \| null\)/g, `removeFromCart: (productId: string, variantId?: string | null)`);
  code = code.replace(/setBuyNow: \(product: Product \| any, quantity\?: number, variant\?: string \| null\)/g, `setBuyNow: (product: Product | any, quantity?: number, variant?: any | null)`);

  // We need to implement the actual JS changes in addToCart
  // Let's replace the addToCart function body
  const addToCartPattern = /const addToCart = useCallback\(async \(product: Product \| any, quantity = 1, variant = null\) => \{[\s\S]*?return true;\n    \} catch \(err\) \{/;
  
  const addToCartReplacement = `const addToCart = useCallback(async (product: Product | any, quantity = 1, variant = null) => {
    try {
      const images = resolveProductImages(product, product.product_images);
      const imageUrl = (variant && variant.image_url) ? variant.image_url : (images[0] || getStorageImageUrl(product.image_url));
      
      const price = variant && variant.price !== null ? Number(variant.price) : Number(product.price);
      const comparePrice = variant && variant.compare_price !== null ? Number(variant.compare_price) : Number(product.compare_price);
      const sku = variant ? variant.sku : product.sku;
      const stockQuantity = variant ? Number(variant.stock_quantity || 0) : Number(product.stock_quantity || 0);

      const newItem: CartItemData = {
        id: variant ? \`\${product.id}-\${variant.id}\` : product.id,
        productId: product.id,
        name: product.name,
        price,
        comparePrice,
        imageUrl,
        slug: product.slug,
        sku,
        quantity,
        stockQuantity,
        variant: variant ? Object.entries(variant.attributes).map(([k,v]) => \`\${k}: \${v}\`).join(', ') : null,
        variantId: variant ? variant.id : null,
        variantSnapshot: variant
      };

      if (user) {
        // Sync to database
        const customerId = await ensureCustomerRecord(user);
        if (customerId) {
          const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', customerId).maybeSingle();
          let cartId = cart?.id;
          if (!cartId) {
            const { data: newCart } = await supabase.from('carts').insert({ customer_id: customerId }).select('id').single();
            cartId = newCart?.id;
          }
          if (cartId) {
            const matchQuery = supabase.from('cart_items').select('id, quantity').eq('cart_id', cartId).eq('product_id', product.id);
            if (variant) matchQuery.eq('variant_id', variant.id);
            else matchQuery.is('variant_id', null);
            
            const { data: existing } = await matchQuery.maybeSingle();

            if (existing) {
              await supabase.from('cart_items').update({
                quantity: existing.quantity + quantity,
                unit_price: price
              }).eq('id', existing.id);
            } else {
              await supabase.from('cart_items').insert({
                cart_id: cartId,
                product_id: product.id,
                variant_id: variant ? variant.id : null,
                quantity,
                unit_price: price
              });
            }
          }
        }
      }

      setItems(prev => {
        const existing = prev.find(i => i.productId === product.id && i.variantId === (variant ? variant.id : null));
        if (existing) {
          return prev.map(i => i.productId === product.id && i.variantId === (variant ? variant.id : null) ? { ...i, quantity: i.quantity + quantity } : i);
        }
        return [...prev, newItem];
      });

      return true;
    } catch (err) {`;
    
  code = code.replace(addToCartPattern, addToCartReplacement);
  
  
  const updateQuantityPattern = /const updateQuantity = useCallback\(async \(productId: string, quantity: number, variant = null\) => \{[\s\S]*?\}\);/;
  const updateQuantityReplacement = `const updateQuantity = useCallback(async (productId: string, quantity: number, variantId = null) => {
    if (quantity < 1) return;
    
    if (user) {
      const customerId = await ensureCustomerRecord(user);
      if (customerId) {
        const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', customerId).maybeSingle();
        if (cart) {
          const matchQuery = supabase.from('cart_items').update({ quantity }).eq('cart_id', cart.id).eq('product_id', productId);
          if (variantId) matchQuery.eq('variant_id', variantId);
          else matchQuery.is('variant_id', null);
          await matchQuery;
        }
      }
    }
    
    setItems(prev => prev.map(i => i.productId === productId && i.variantId === variantId ? { ...i, quantity } : i));
  }, [user]);`;
  
  code = code.replace(updateQuantityPattern, updateQuantityReplacement);
  

  const removePattern = /const removeFromCart = useCallback\(async \(productId: string, variant = null\) => \{[\s\S]*?\}\);/;
  const removeReplacement = `const removeFromCart = useCallback(async (productId: string, variantId = null) => {
    if (user) {
      const customerId = await ensureCustomerRecord(user);
      if (customerId) {
        const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', customerId).maybeSingle();
        if (cart) {
          const matchQuery = supabase.from('cart_items').delete().eq('cart_id', cart.id).eq('product_id', productId);
          if (variantId) matchQuery.eq('variant_id', variantId);
          else matchQuery.is('variant_id', null);
          await matchQuery;
        }
      }
    }
    setItems(prev => prev.filter(i => !(i.productId === productId && i.variantId === variantId)));
  }, [user]);`;
  code = code.replace(removePattern, removeReplacement);
  
  const setBuyNowPattern = /const setBuyNow = useCallback\(\(product: Product \| any, quantity = 1, variant = null\): CartItemData => \{[\s\S]*?return item;\n  \}, \[\]\);/;
  const setBuyNowReplacement = `const setBuyNow = useCallback((product: Product | any, quantity = 1, variant = null): CartItemData => {
    const images = resolveProductImages(product, product.product_images);
    const imageUrl = (variant && variant.image_url) ? variant.image_url : (images[0] || getStorageImageUrl(product.image_url));
    const price = variant && variant.price !== null ? Number(variant.price) : Number(product.price);
    const sku = variant ? variant.sku : product.sku;

    const item: CartItemData = {
      id: variant ? \`\${product.id}-\${variant.id}\` : product.id,
      productId: product.id,
      name: product.name,
      price,
      imageUrl,
      slug: product.slug,
      sku,
      quantity,
      variant: variant ? Object.entries(variant.attributes).map(([k,v]) => \`\${k}: \${v}\`).join(', ') : null,
      variantId: variant ? variant.id : null,
      variantSnapshot: variant
    };
    setBuyNowItem(item);
    return item;
  }, []);`;
  code = code.replace(setBuyNowPattern, setBuyNowReplacement);

  const localEffectPattern = /localStorage\.setItem\('cart', JSON\.stringify\(items\)\);/;
  // ensure we do nothing if nothing to replace
  
  fs.writeFileSync('src/context/CartContext.tsx', code);
  console.log('Cart updated');
}

