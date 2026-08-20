const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const itemsPattern = /const orderItemsData = items\.map\(\(item: any\) => \{[\s\S]*?subtotal: parseFloat\(item\.unitPrice\) \* item\.quantity\n\s*\}\;\n\s*\}\)\;/;
const itemsReplacement = `const orderItemsData = items.map((item: any) => {
            const p = item.product || {};
            const resolvedImg = item.productImageSnapshot || item.product_image_snapshot || item.imageUrl || item.image || p.imageUrl || p.image_url || p.images?.[0] || p.product_images?.[0]?.image_url || null;
            return {
              order_id: order.id,
              product_id: item.productId || item.product_id || p.id || null,
              variant_id: item.variantId || item.variant_id || null,
              variant_info_snapshot: item.variantSnapshot || item.variant_info_snapshot || null,
              product_name_snapshot: p.name || item.productName || item.name || 'Product Item',
              product_image_snapshot: resolvedImg,
              unit_price: item.unitPrice,
              quantity: item.quantity,
              subtotal: parseFloat(item.unitPrice) * item.quantity
            };
          });`;

if(!code.includes('variant_id: item.variantId')) {
    code = code.replace(itemsPattern, itemsReplacement);
    
    // Also we must reduce stock of the variant and the product.
    // I will add a block right after itemsError to decrement stock.
    const insertItemsPattern = /const \{ error: itemsError \} = await \(db\.from\('order_items'\) as any\)\.insert\(orderItemsData\);\n\s*if \(itemsError\) console\.warn\('Item insert warning:', itemsError\);\n\s*\}/;
    const insertItemsReplacement = `const { error: itemsError } = await (db.from('order_items') as any).insert(orderItemsData);
          if (itemsError) {
             console.warn('Item insert warning:', itemsError);
          } else {
             // Deduct Stock
             for (const item of items) {
                const pId = item.productId || item.product_id || item.product?.id;
                const vId = item.variantId || item.variant_id;
                const qty = item.quantity || 1;
                if (pId) {
                  // Try to deduct from base product stock
                  try {
                     const { data: prodData } = await (db.from('products') as any).select('stock_quantity').eq('id', pId).single();
                     if (prodData) {
                        await (db.from('products') as any).update({ stock_quantity: Math.max(0, (prodData.stock_quantity || 0) - qty) }).eq('id', pId);
                     }
                  } catch (e) {}
                }
                if (vId) {
                  try {
                     const { data: varData } = await (db.from('product_variants') as any).select('stock_quantity').eq('id', vId).single();
                     if (varData) {
                        await (db.from('product_variants') as any).update({ stock_quantity: Math.max(0, (varData.stock_quantity || 0) - qty) }).eq('id', vId);
                     }
                  } catch (e) {}
                }
             }
          }
        }`;
    
    code = code.replace(insertItemsPattern, insertItemsReplacement);
    
    fs.writeFileSync('server.ts', code);
    console.log('Orders POST updated');
}

