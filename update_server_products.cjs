const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// POST replace
const postPattern = /let \{ name, slug, sku, short_description, description, price, compare_price, discount_percentage, stock_quantity, status, featured, category_id, images, admin_email \} = req\.body;/;
const postReplacement = `let { name, slug, sku, short_description, description, price, compare_price, discount_percentage, stock_quantity, status, featured, category_id, images, admin_email, has_variants, attributes, variants } = req.body;`;
code = code.replace(postPattern, postReplacement);

const postInsertPattern = /status: finalStatus,\n\s*featured: Boolean\(featured\),\n\s*category_id: category_id \|\| null\n\s*\}\)\.select\('\*'\)\.single\(\);/;
const postInsertReplacement = `status: finalStatus,
      featured: Boolean(featured),
      category_id: category_id || null,
      has_variants: Boolean(has_variants)
    }).select('*').single();`;
code = code.replace(postInsertPattern, postInsertReplacement);

const postImagesPattern = /if \(images && Array\.isArray\(images\) && images\.length > 0\) \{/;
const postImagesReplacement = `
    if (has_variants && Array.isArray(attributes) && Array.isArray(variants)) {
      for (const attr of attributes) {
        const { data: attrData } = await (db.from('product_attributes') as any).insert({
          product_id: prod.id,
          name: attr.name,
          position: attr.position || 0
        }).select().single();
        if (attrData && Array.isArray(attr.values)) {
          for (const val of attr.values) {
            await (db.from('product_attribute_values') as any).insert({
              attribute_id: attrData.id,
              value: val.value,
              position: val.position || 0
            });
          }
        }
      }
      for (const v of variants) {
        await (db.from('product_variants') as any).insert({
          product_id: prod.id,
          sku: v.sku || \`\${sku}-\${Date.now().toString().slice(-4)}\`,
          price: v.price ? parseFloat(v.price) : null,
          compare_price: v.comparePrice ? parseFloat(v.comparePrice) : null,
          stock_quantity: parseInt(v.stockQuantity, 10) || 0,
          image_url: v.imageUrl || null,
          is_active: v.isActive !== false,
          attributes: v.attributes || {}
        });
      }
    }

    if (images && Array.isArray(images) && images.length > 0) {`;

code = code.replace(postImagesPattern, postImagesReplacement);


// PUT replace
const putPattern = /const \{ admin_email, images, \.\.\.updates \} = req\.body;/;
const putReplacement = `const { admin_email, images, attributes, variants, ...updates } = req.body;
    if (updates.has_variants !== undefined) updates.has_variants = Boolean(updates.has_variants);
`;
code = code.replace(putPattern, putReplacement);

const putImagesPattern = /if \(images !== undefined\) \{/;
const putImagesReplacement = `
    if (updates.has_variants && Array.isArray(attributes) && Array.isArray(variants)) {
      // Very simple variant sync: Delete old attributes/variants and reinsert
      await (db.from('product_attributes') as any).delete().eq('product_id', id);
      await (db.from('product_variants') as any).delete().eq('product_id', id);

      for (const attr of attributes) {
        const { data: attrData } = await (db.from('product_attributes') as any).insert({
          product_id: id,
          name: attr.name,
          position: attr.position || 0
        }).select().single();
        if (attrData && Array.isArray(attr.values)) {
          for (const val of attr.values) {
            await (db.from('product_attribute_values') as any).insert({
              attribute_id: attrData.id,
              value: val.value,
              position: val.position || 0
            });
          }
        }
      }
      for (const v of variants) {
        await (db.from('product_variants') as any).insert({
          product_id: id,
          sku: v.sku,
          price: v.price ? parseFloat(v.price) : null,
          compare_price: v.comparePrice ? parseFloat(v.comparePrice) : null,
          stock_quantity: parseInt(v.stockQuantity, 10) || 0,
          image_url: v.imageUrl || null,
          is_active: v.isActive !== false,
          attributes: v.attributes || {}
        });
      }
    } else if (!updates.has_variants && attributes !== undefined) {
       await (db.from('product_attributes') as any).delete().eq('product_id', id);
       await (db.from('product_variants') as any).delete().eq('product_id', id);
    }

    if (images !== undefined) {`;

code = code.replace(putImagesPattern, putImagesReplacement);

// GET modify (so products include variants)
const getPattern = /\.select\('\*, categories\(\*\), product_images\(\*\)'\)/;
const getReplacement = `.select('*, categories(*), product_images(*), product_attributes(*, product_attribute_values(*)), product_variants(*)')`;
code = code.replace(new RegExp(getPattern, 'g'), getReplacement);

fs.writeFileSync('server.ts', code);
console.log('Server routes updated');
