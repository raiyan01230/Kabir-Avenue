import 'dotenv/config';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createClient } from '@supabase/supabase-js';
import { sendOrderConfirmation, sendAccountConfirmationEmail } from './src/lib/email';

let supabaseAdmin: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin(): ReturnType<typeof createClient> | null {
    if (!supabaseAdmin) {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            return null;
        }
        supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    }
    return supabaseAdmin;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  app.use(express.json({ limit: '30mb' }));
  app.use(express.urlencoded({ limit: '30mb', extended: true }));

  // Supabase Storage Upload & Delete
  app.post("/api/admin/storage/upload", async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });

      const { fileBase64, fileName, mimeType, folder = 'products' } = req.body;
      if (!fileBase64 || !fileName) {
        return res.status(400).json({ error: 'File data and file name are required' });
      }

      // Convert base64 data to buffer
      const base64Clean = fileBase64.replace(/^data:image\/\w+;base64,/, '').replace(/^data:application\/octet-stream;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');
      
      const cleanFileName = fileName.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
      const uniquePath = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}-${cleanFileName}`;
      const bucketName = 'ecommerce';

      // Ensure bucket exists
      try {
        await db.storage.createBucket(bucketName, { public: true });
      } catch (bErr) {
        // Bucket may already exist
      }

      const { error: uploadError } = await db.storage
        .from(bucketName)
        .upload(uniquePath, buffer, {
          contentType: mimeType || 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase Storage Upload Error:', uploadError);
        return res.status(500).json({ error: uploadError.message || 'Failed to upload to Supabase Storage' });
      }

      const { data: publicData } = db.storage.from(bucketName).getPublicUrl(uniquePath);
      const publicUrl = publicData?.publicUrl || '';

      res.json({
        success: true,
        storagePath: uniquePath,
        publicUrl,
        fileName: cleanFileName
      });
    } catch (err: any) {
      console.error('Storage upload route exception:', err);
      res.status(500).json({ error: err.message || 'Storage upload failed' });
    }
  });

  app.post("/api/admin/storage/delete", async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });

      const { storagePath, bucket = 'ecommerce' } = req.body;
      if (!storagePath) {
        return res.status(400).json({ error: 'Storage path is required' });
      }

      const { error } = await db.storage.from(bucket).remove([storagePath]);
      if (error) {
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Storage delete failed' });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/auth/register-notify", async (req, res) => {
    try {
      const { fullName, email, phone, userId } = req.body;
      if (!email || !fullName) {
        return res.status(400).json({ error: 'Full name and email are required' });
      }

      // Sync customer in database if client is available
      try {
        const db = getSupabaseAdmin();
        if (db) {
          const isUserUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
          let custFilter = `email.eq.${email}`;
          if (userId) {
            custFilter += isUserUuid ? `,id.eq.${userId},firebase_uid.eq.${userId}` : `,firebase_uid.eq.${userId}`;
          }
          const { data: existingCustomer } = await (db.from('customers') as any)
            .select('id')
            .or(custFilter)
            .maybeSingle();

          if (!existingCustomer) {
            const customerPayload: any = {
              firebase_uid: userId || `usr_${Date.now()}`,
              full_name: fullName,
              email,
              phone: phone || null,
            };
            if (isUserUuid) {
              customerPayload.id = userId;
            }
            await (db.from('customers') as any).insert(customerPayload);
          }
        }
      } catch (dbErr) {
        console.warn('Customer table sync warning:', dbErr);
      }

      // Send confirmation email
      const emailResult = await sendAccountConfirmationEmail({
        fullName,
        email,
        phone,
      });

      res.status(200).json({ success: true, emailSent: emailResult.success });
    } catch (error: any) {
      console.error('Registration notification failed:', error);
      res.status(500).json({ error: error.message || 'Failed to process registration notification' });
    }
  });

  app.post("/api/promo/validate", async (req, res) => {
    try {
      const { code, subtotal } = req.body;
      const db = getSupabaseAdmin();
      
      if (!db || !code) return res.status(400).json({ error: 'Invalid request' });
      
      const { data: promo, error } = await (db.from('promo_codes') as any)
        .select('*')
        .eq('code', code.toUpperCase())
        .single();
        
      if (error || !promo) {
        return res.status(400).json({ error: 'Invalid promo code.' });
      }
      
      const now = new Date();
      if (!promo.is_active) return res.status(400).json({ error: 'This promo code is no longer active.' });
      if (promo.start_date && new Date(promo.start_date) > now) return res.status(400).json({ error: 'This promo code is not yet active.' });
      if (promo.expiry_date && new Date(promo.expiry_date) < now) return res.status(400).json({ error: 'This promo code has expired.' });
      if (promo.usage_limit && promo.usage_count >= promo.usage_limit) return res.status(400).json({ error: 'This promo code has reached its usage limit.' });
      
      const finalSubtotal = parseFloat(subtotal);
      if (promo.minimum_order_amount && finalSubtotal < parseFloat(promo.minimum_order_amount)) {
        return res.status(400).json({ error: `Minimum order amount of ৳${promo.minimum_order_amount} is required.` });
      }
      
      let calcDiscount = 0;
      if (promo.discount_type === 'percentage') {
        calcDiscount = finalSubtotal * (parseFloat(promo.discount_value) / 100);
      } else if (promo.discount_type === 'fixed') {
        calcDiscount = parseFloat(promo.discount_value);
      }

      if (promo.maximum_discount_amount && calcDiscount > parseFloat(promo.maximum_discount_amount)) {
        calcDiscount = parseFloat(promo.maximum_discount_amount);
      }
      
      res.json({
        success: true,
        code: promo.code,
        discountAmount: calcDiscount.toFixed(2),
        description: promo.description || `${promo.discount_type === 'percentage' ? promo.discount_value + '% discount' : '৳' + promo.discount_value + ' OFF'}`
      });
      
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Validation failed' });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
        const { customer_id, items, shipping_info, subtotal, shipping_fee, tax, promo_code, payment_method, email, order_note } = req.body;

        const db = getSupabaseAdmin();
        if (!db) {
          throw new Error('Supabase database client is not configured. Please set SUPABASE_URL / VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY / VITE_SUPABASE_ANON_KEY.');
        }
        
        let targetCustomerId = customer_id;
        const isCustomerUuid = customer_id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customer_id);
        let custFilter = email ? `email.eq.${email}` : '';
        if (customer_id) {
          if (isCustomerUuid) {
            custFilter = custFilter ? `${custFilter},id.eq.${customer_id},firebase_uid.eq.${customer_id}` : `id.eq.${customer_id},firebase_uid.eq.${customer_id}`;
          } else {
            custFilter = custFilter ? `${custFilter},firebase_uid.eq.${customer_id}` : `firebase_uid.eq.${customer_id}`;
          }
        }
        const { data: existingCustomer } = await (db.from('customers') as any)
          .select('id')
          .or(custFilter)
          .maybeSingle();

        if (existingCustomer?.id) {
          targetCustomerId = existingCustomer.id;
        } else {
          const insertPayload: any = {
            firebase_uid: customer_id || `usr_${Date.now()}`,
            full_name: shipping_info?.full_name || 'Valued Customer',
            email: email || `${customer_id || Date.now()}@customer.store`,
            phone: shipping_info?.phone || null,
          };
          if (isCustomerUuid) {
            insertPayload.id = customer_id;
          }
          const { data: newCustomer } = await (db.from('customers') as any)
            .insert(insertPayload)
            .select('id')
            .maybeSingle();

          if (newCustomer?.id) {
            targetCustomerId = newCustomer.id;
          }
        }

        // Validate promo code server-side
        let discount = '0.00';
        let promoCodeId = null;
        let discountType = null;
        let discountValue = null;
        let finalSubtotal = parseFloat(subtotal);

        if (promo_code) {
          const { data: promo } = await (db.from('promo_codes') as any)
            .select('*')
            .eq('code', promo_code.toUpperCase())
            .single();

          if (promo) {
            const now = new Date();
            let isValid = promo.is_active;
            
            if (promo.start_date && new Date(promo.start_date) > now) isValid = false;
            if (promo.expiry_date && new Date(promo.expiry_date) < now) isValid = false;
            if (promo.usage_limit && promo.usage_count >= promo.usage_limit) isValid = false;
            if (promo.minimum_order_amount && finalSubtotal < parseFloat(promo.minimum_order_amount)) isValid = false;

            // Note: per_customer_limit is omitted for brevity, but you'd query orders table here.
            if (isValid) {
              let calcDiscount = 0;
              if (promo.discount_type === 'percentage') {
                calcDiscount = finalSubtotal * (parseFloat(promo.discount_value) / 100);
              } else if (promo.discount_type === 'fixed') {
                calcDiscount = parseFloat(promo.discount_value);
              }

              if (promo.maximum_discount_amount && calcDiscount > parseFloat(promo.maximum_discount_amount)) {
                calcDiscount = parseFloat(promo.maximum_discount_amount);
              }

              discount = calcDiscount.toFixed(2);
              promoCodeId = promo.id;
              discountType = promo.discount_type;
              discountValue = promo.discount_value;
            } else {
              throw new Error('Promo code is invalid, expired, or requirements not met.');
            }
          } else {
             throw new Error('Promo code not found.');
          }
        }

        const total = (finalSubtotal + parseFloat(shipping_fee || '0') + parseFloat(tax || '0') - parseFloat(discount)).toFixed(2);
        const generatedOrderNumber = `ORD-${Date.now()}`;

        // 1. Insert Order
        const { data: order, error: orderError } = await (db.from('orders') as any)
            .insert({
                order_number: generatedOrderNumber,
                customer_id: targetCustomerId,
                subtotal,
                shipping_fee,
                tax: tax || '0.00',
                promo_code_id: promoCodeId,
                promo_code: promoCodeId ? promo_code.toUpperCase() : null,
                discount_type: discountType,
                discount_value: discountValue,
                discount: discount || '0.00',
                total,
                payment_method,
                order_note,
                order_status: 'pending'
            })
            .select('id, order_number').single();

        if (orderError || !order) throw (orderError || new Error('Failed to create order'));

        // Increment promo usage
        if (promoCodeId) {
          try {
            const { data: promoData } = await (db.from('promo_codes') as any)
              .select('usage_count')
              .eq('id', promoCodeId)
              .single();

            if (promoData) {
              await (db.from('promo_codes') as any)
                .update({ usage_count: (promoData.usage_count || 0) + 1 })
                .eq('id', promoCodeId);
            }
          } catch (promoCountErr) {
            console.warn('Could not increment promo usage count:', promoCountErr);
          }
        }

        // 2. Insert Items
        if (items && items.length > 0) {
          const orderItemsData = items.map((item: any) => ({
              order_id: order.id,
              product_id: item.productId,
              product_name_snapshot: item.product?.name || 'Product Item',
              unit_price: item.unitPrice,
              quantity: item.quantity,
              subtotal: parseFloat(item.unitPrice) * item.quantity
          }));
          const { error: itemsError } = await (db.from('order_items') as any).insert(orderItemsData);
          if (itemsError) console.warn('Item insert warning:', itemsError);
        }

        // 3. Insert Shipping Address
        if (shipping_info) {
          const { error: shippingError } = await (db.from('shipping_addresses') as any).insert({
              order_id: order.id,
              customer_id: targetCustomerId,
              full_name: shipping_info.full_name,
              phone: shipping_info.phone,
              email: shipping_info.email || email,
              division: shipping_info.division,
              district: shipping_info.district,
              thana: shipping_info.thana,
              full_address: shipping_info.full_address,
              delivery_area: shipping_info.delivery_area,
              shipping_fee
          });
          if (shippingError) console.warn('Shipping address insert warning:', shippingError);
        }

        // 4. Send Email
        try {
          await sendOrderConfirmation({
            ...order,
            items,
            shipping_info,
            subtotal,
            shipping_fee,
            tax,
            discount,
            total,
            payment_method
          }, email);
        } catch (emailErr) {
          console.warn('Email dispatch warning:', emailErr);
        }
        
        res.status(200).json({ success: true, orderId: order.id, orderNumber: order.order_number });
    } catch (error: any) {
        console.error('Order creation failed:', error);
        res.status(500).json({ error: error.message || 'Failed to place order' });
    }
  });

  // --- ADMIN API ROUTES ---

  async function logAdminAction(db: any, adminEmail: string, action: string, resource: string, resourceId?: string, prev?: any, next?: any, desc?: string) {
    try {
      await (db.from('audit_logs') as any).insert({
        admin_email: adminEmail,
        action,
        resource,
        resource_id: resourceId || null,
        previous_value: prev ? JSON.stringify(prev) : null,
        new_value: next ? JSON.stringify(next) : null,
        description: desc || `${action} on ${resource}`
      });
    } catch (err) {
      console.warn('Audit log write error:', err);
    }
  }

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase client not initialized' });

      // Default bootstrap admin fallback if table is empty or credentials match default
      if (email === 'admin@hyperdrive.bd' && password === 'admin123') {
        return res.json({ success: true, admin: { email, fullName: 'Super Administrator', role: 'super_admin' } });
      }

      const { data: adminUser, error } = await (db.from('admin_users') as any)
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error || !adminUser || adminUser.password_hash !== password) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      if (!adminUser.is_active) {
        return res.status(403).json({ error: 'Admin account is deactivated' });
      }

      res.json({
        success: true,
        admin: {
          id: adminUser.id,
          email: adminUser.email,
          fullName: adminUser.full_name,
          role: adminUser.role
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Login failed' });
    }
  });

  // Products CRUD
  app.get("/api/admin/products", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data, error } = await (db.from('products') as any).select('*, categories(*), product_images(*)').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  app.post("/api/admin/products", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    let { name, slug, sku, short_description, description, price, compare_price, discount_percentage, stock_quantity, status, featured, category_id, images, admin_email } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }

    let cleanSlug = (slug && slug.trim()) ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    if (!cleanSlug) cleanSlug = `prod-${Date.now().toString(36)}`;

    // Check slug uniqueness
    const { data: existingSlug } = await (db.from('products') as any).select('id').eq('slug', cleanSlug).maybeSingle();
    if (existingSlug) {
      cleanSlug = `${cleanSlug}-${Date.now().toString(36).slice(-4)}`;
    }

    if (!sku || !sku.trim()) {
      sku = `SKU-${Date.now().toString().slice(-6)}`;
    }

    // Default status to 'active' so it is immediately visible in the store
    const finalStatus = (status === 'draft' || status === 'archived') ? status : 'active';
    
    const { data: prod, error } = await (db.from('products') as any).insert({
      name: name.trim(),
      slug: cleanSlug,
      sku: sku.trim(),
      short_description: short_description ? short_description.trim() : null,
      description: description ? description.trim() : null,
      price: parseFloat(price),
      compare_price: compare_price ? parseFloat(compare_price) : null,
      discount_percentage: discount_percentage ? parseInt(discount_percentage, 10) : null,
      stock_quantity: parseInt(stock_quantity, 10) || 0,
      status: finalStatus,
      featured: Boolean(featured),
      category_id: category_id || null
    }).select('*').single();

    if (error || !prod) {
      console.error('Failed to insert product:', error);
      return res.status(400).json({ error: error?.message || 'Failed to create product' });
    }

    if (images && Array.isArray(images) && images.length > 0) {
      const imgRows = images.map((img: any, idx: number) => {
        const isObj = typeof img === 'object' && img !== null;
        const imageUrl = isObj ? (img.image_url || img.imageUrl || img.storage_path) : img;
        const storagePath = isObj ? (img.storage_path || img.storagePath || img.image_url || img.imageUrl) : img;
        const isPrimary = isObj ? (img.is_primary ?? img.isPrimary ?? idx === 0) : idx === 0;
        const sortOrder = isObj ? (img.sort_order ?? img.sortOrder ?? idx) : idx;
        const altText = isObj ? (img.alt_text || img.altText || name) : name;

        return {
          product_id: prod.id,
          image_url: imageUrl,
          storage_path: storagePath,
          sort_order: sortOrder,
          is_primary: isPrimary,
          alt_text: altText
        };
      });

      const { error: imgInsertErr } = await (db.from('product_images') as any).insert(imgRows);
      if (imgInsertErr) {
        console.warn('Image record insert warning:', imgInsertErr);
      }
    }

    // Fetch full newly created record with joined relations
    const { data: fullProduct } = await (db.from('products') as any)
      .select('*, categories(*), product_images(*)')
      .eq('id', prod.id)
      .single();

    await logAdminAction(db, admin_email || 'system@admin', 'CREATE', 'products', prod.id, null, fullProduct || prod, `Created product ${name}`);
    res.json({ success: true, product: fullProduct || prod });
  });

  app.put("/api/admin/products/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    const { admin_email, images, ...updates } = req.body;

    const { data: oldProd } = await (db.from('products') as any).select('*').eq('id', id).single();

    // Ensure price/stock types
    if (updates.price !== undefined) updates.price = parseFloat(updates.price);
    if (updates.compare_price !== undefined) updates.compare_price = updates.compare_price ? parseFloat(updates.compare_price) : null;
    if (updates.stock_quantity !== undefined) updates.stock_quantity = parseInt(updates.stock_quantity, 10);
    if (updates.status && updates.status === 'published') updates.status = 'active';

    const { data: updated, error } = await (db.from('products') as any).update({
      ...updates,
      updated_at: new Date()
    }).eq('id', id).select('*').single();

    if (error) return res.status(400).json({ error: error.message });

    if (images && Array.isArray(images)) {
      // Find existing images to detect orphaned files in storage
      const { data: currentImgs } = await (db.from('product_images') as any).select('storage_path').eq('product_id', id);
      const newPaths = new Set(images.map((img: any) => typeof img === 'object' ? (img.storage_path || img.storagePath) : img));
      
      const removedPaths = (currentImgs || [])
        .map((r: any) => r.storage_path)
        .filter((p: string) => p && !p.startsWith('http://') && !p.startsWith('https://') && !newPaths.has(p));

      if (removedPaths.length > 0) {
        try {
          await db.storage.from('ecommerce').remove(removedPaths);
        } catch (sErr) {
          console.warn('Storage cleanup non-fatal warning:', sErr);
        }
      }

      await (db.from('product_images') as any).delete().eq('product_id', id);
      if (images.length > 0) {
        const imgRows = images.map((img: any, idx: number) => {
          const isObj = typeof img === 'object' && img !== null;
          const imageUrl = isObj ? (img.image_url || img.imageUrl || img.storage_path) : img;
          const storagePath = isObj ? (img.storage_path || img.storagePath || img.image_url || img.imageUrl) : img;
          const isPrimary = isObj ? (img.is_primary ?? img.isPrimary ?? idx === 0) : idx === 0;
          const sortOrder = isObj ? (img.sort_order ?? img.sortOrder ?? idx) : idx;
          const altText = isObj ? (img.alt_text || img.altText || updated.name) : updated.name;

          return {
            product_id: id,
            image_url: imageUrl,
            storage_path: storagePath,
            sort_order: sortOrder,
            is_primary: isPrimary,
            alt_text: altText
          };
        });
        await (db.from('product_images') as any).insert(imgRows);
      }
    }

    const { data: fullProduct } = await (db.from('products') as any)
      .select('*, categories(*), product_images(*)')
      .eq('id', id)
      .single();

    await logAdminAction(db, admin_email || 'system@admin', 'UPDATE', 'products', id, oldProd, fullProduct || updated, `Updated product ${updated.name}`);
    res.json({ success: true, product: fullProduct || updated });
  });

  app.delete("/api/admin/products/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    const { admin_email } = req.body || {};

    try {
      const { data: oldProd, error: fetchErr } = await (db.from('products') as any).select('*').eq('id', id).maybeSingle();
      if (fetchErr || !oldProd) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Check if product is referenced in historical customer order items
      const { data: orderItemRefs, error: checkOrderErr } = await (db.from('order_items') as any)
        .select('id')
        .eq('product_id', id)
        .limit(1);

      if (orderItemRefs && orderItemRefs.length > 0) {
        // Product is part of historical customer order(s) - preserve order history integrity by archiving from storefront
        await (db.from('cart_items') as any).delete().eq('product_id', id);
        const { data: archivedProd, error: archiveError } = await (db.from('products') as any)
          .update({ status: 'archived', updated_at: new Date() })
          .eq('id', id)
          .select('*')
          .single();

        if (archiveError) {
          return res.status(400).json({ error: archiveError.message });
        }

        await logAdminAction(
          db,
          admin_email || 'system@admin',
          'ARCHIVE',
          'products',
          id,
          oldProd,
          archivedProd,
          `Archived product "${oldProd.name}" because it is part of historical customer orders.`
        );

        return res.json({
          success: true,
          archived: true,
          message: `Product "${oldProd.name}" is referenced by existing customer orders. It has been safely archived from the store catalog to preserve historical order records.`
        });
      }

      // No orders reference this product - proceed with safe complete deletion:
      // 1. Delete associated cart items
      await (db.from('cart_items') as any).delete().eq('product_id', id);

      // 2. Delete associated reviews
      await (db.from('reviews') as any).delete().eq('product_id', id);

      // 3. Find and clean up Storage images
      const { data: imgRecords } = await (db.from('product_images') as any)
        .select('storage_path, image_url')
        .eq('product_id', id);

      if (imgRecords && imgRecords.length > 0) {
        const storagePaths = imgRecords
          .map((r: any) => r.storage_path || r.image_url)
          .filter((p: string) => p && !p.startsWith('http://') && !p.startsWith('https://'));

        if (storagePaths.length > 0) {
          try {
            await db.storage.from('ecommerce').remove(storagePaths);
          } catch (storageErr) {
            console.warn('Storage cleanup non-fatal warning:', storageErr);
          }
        }
      }

      // 4. Delete product_images rows
      await (db.from('product_images') as any).delete().eq('product_id', id);

      // 5. Delete product row
      const { error: delError } = await (db.from('products') as any).delete().eq('id', id);
      if (delError) {
        return res.status(400).json({ error: delError.message });
      }

      await logAdminAction(
        db,
        admin_email || 'system@admin',
        'DELETE',
        'products',
        id,
        oldProd,
        null,
        `Permanently deleted product "${oldProd.name}" and removed all images.`
      );

      res.json({
        success: true,
        deleted: true,
        message: `Product "${oldProd.name}" and its image files have been permanently deleted.`
      });
    } catch (err: any) {
      console.error('Delete product error:', err);
      res.status(500).json({ error: err.message || 'Failed to delete product' });
    }
  });

  // Categories CRUD
  app.get("/api/admin/categories", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data } = await (db.from('categories') as any).select('*').order('sort_order', { ascending: true });
    res.json(data || []);
  });

  app.post("/api/admin/categories", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { name, slug, description, image_url, storage_path, icon, sort_order, is_active, admin_email } = req.body;
    const { data, error } = await (db.from('categories') as any).insert({
      name, slug, description, image_url, storage_path, icon, sort_order: sort_order || 0, is_active: is_active ?? true
    }).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    await logAdminAction(db, admin_email || 'system@admin', 'CREATE', 'categories', data.id, null, data, `Created category ${name}`);
    res.json({ success: true, category: data });
  });

  app.put("/api/admin/categories/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    const { admin_email, ...updates } = req.body;
    const { data, error } = await (db.from('categories') as any).update({ ...updates, updated_at: new Date() }).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    await logAdminAction(db, admin_email || 'system@admin', 'UPDATE', 'categories', id, null, data, `Updated category`);
    res.json({ success: true, category: data });
  });

  app.delete("/api/admin/categories/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    await (db.from('categories') as any).delete().eq('id', id);
    res.json({ success: true });
  });

  // Orders Management
  app.get("/api/admin/orders", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data, error } = await (db.from('orders') as any)
      .select('*, customers(full_name, email, phone), shipping_addresses(*), order_items(*)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.put("/api/admin/orders/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    const { order_status, payment_status, tracking_code, admin_email, note } = req.body;

    const updateFields: any = { updated_at: new Date() };
    if (order_status) updateFields.order_status = order_status;
    if (payment_status) updateFields.payment_status = payment_status;
    if (tracking_code !== undefined) updateFields.tracking_code = tracking_code;

    const { data: updated, error } = await (db.from('orders') as any).update(updateFields).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ error: error.message });

    if (order_status) {
      await (db.from('order_status_history') as any).insert({
        order_id: id,
        status: order_status,
        note: note || `Status updated to ${order_status} by admin`
      });
    }

    await logAdminAction(db, admin_email || 'system@admin', 'UPDATE', 'orders', id, null, updated, `Updated order ${updated.order_number} status to ${order_status}`);
    res.json({ success: true, order: updated });
  });

  // Manual / VIP Order Creation
  app.post("/api/admin/orders/manual", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const {
      customer_name,
      customer_email,
      customer_phone,
      items,
      shipping_info,
      payment_method = 'Cash on Delivery',
      order_note,
      order_type = 'VIP/Phone',
      discount = 0,
      discount_type = 'fixed',
      discount_value = 0,
      promo_code = null,
      tax = 0,
      custom_shipping_fee = null,
      admin_email
    } = req.body;

    if (!customer_name || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Customer name and at least one item are required' });
    }

    // Find or create customer
    const emailToUse = customer_email && customer_email.trim() ? customer_email.trim() : `vip_${Date.now()}@hyperdrive.bd`;
    let { data: cust } = await (db.from('customers') as any).select('id, full_name, email, phone').eq('email', emailToUse).maybeSingle();
    if (!cust) {
      const { data: newCust, error: cErr } = await (db.from('customers') as any).insert({
        firebase_uid: `admin_created_${Date.now()}`,
        full_name: customer_name,
        email: emailToUse,
        phone: customer_phone || null
      }).select('id, full_name, email, phone').single();
      if (cErr) return res.status(400).json({ error: cErr.message });
      cust = newCust;
    }

    let subtotal = 0;
    const orderItemsPayload = items.map((i: any) => {
      const itemSub = Number(i.unitPrice || i.unit_price) * Number(i.quantity);
      subtotal += itemSub;
      return {
        product_id: i.productId || i.product_id || null,
        product_name_snapshot: i.productName || i.product_name_snapshot || i.name || 'Product',
        product_image_snapshot: i.productImageSnapshot || i.product_image_snapshot || i.image_url || null,
        unit_price: Number(i.unitPrice || i.unit_price),
        quantity: Number(i.quantity),
        subtotal: itemSub
      };
    });

    const parsedDiscount = Number(discount) || 0;
    const parsedTax = Number(tax) || 0;
    const shippingFee = custom_shipping_fee !== null && custom_shipping_fee !== undefined
      ? Number(custom_shipping_fee)
      : (shipping_info?.delivery_area === 'Outside Dhaka' ? 130 : 70);

    const total = Math.max(0, subtotal - parsedDiscount + shippingFee + parsedTax);
    const orderNumber = `VIP-${Date.now()}`;

    const { data: order, error: oErr } = await (db.from('orders') as any).insert({
      order_number: orderNumber,
      customer_id: cust.id,
      subtotal,
      shipping_fee: shippingFee,
      discount: parsedDiscount,
      discount_type: discount_type || null,
      discount_value: discount_value || null,
      promo_code: promo_code || null,
      tax: parsedTax,
      total,
      payment_method: payment_method || 'Cash on Delivery',
      payment_status: 'pending',
      order_status: 'confirmed',
      order_note: order_note || `Manual ${order_type || 'VIP'} Order created by Admin`
    }).select('*').single();

    if (oErr) return res.status(400).json({ error: oErr.message });

    const itemsToInsert = orderItemsPayload.map((it: any) => ({ ...it, order_id: order.id }));
    await (db.from('order_items') as any).insert(itemsToInsert);

    // Deduct stock in Supabase database for products
    for (const item of orderItemsPayload) {
      if (item.product_id) {
        try {
          const { data: prodData } = await (db.from('products') as any).select('stock_quantity').eq('id', item.product_id).maybeSingle();
          if (prodData && prodData.stock_quantity !== undefined) {
            const newStock = Math.max(0, Number(prodData.stock_quantity) - item.quantity);
            await (db.from('products') as any).update({ stock_quantity: newStock }).eq('id', item.product_id);
          }
        } catch (stockErr) {
          console.warn('Stock update warning for manual order item:', stockErr);
        }
      }
    }

    let insertedShipping = null;
    if (shipping_info) {
      const { data: shipData } = await (db.from('shipping_addresses') as any).insert({
        order_id: order.id,
        customer_id: cust.id,
        full_name: shipping_info.full_name || customer_name,
        phone: shipping_info.phone || customer_phone,
        email: shipping_info.email || emailToUse,
        division: shipping_info.division || 'Dhaka',
        district: shipping_info.district || 'Dhaka',
        thana: shipping_info.thana || 'Gulshan',
        full_address: shipping_info.full_address || 'Address provided offline',
        delivery_area: shipping_info.delivery_area || 'Inside Dhaka',
        shipping_fee: shippingFee
      }).select('*').single();
      insertedShipping = shipData;
    }

    // Insert order status history
    await (db.from('order_status_history') as any).insert({
      order_id: order.id,
      status: 'confirmed',
      note: `Manual order created by ${admin_email || 'Admin'}`
    });

    // Send confirmation email via Resend if valid email
    try {
      if (emailToUse && !emailToUse.includes('vip_') && emailToUse.includes('@')) {
        await sendOrderConfirmation({
          orderNumber,
          customerName: customer_name,
          customerEmail: emailToUse,
          customerPhone: customer_phone || '',
          shippingAddress: shipping_info?.full_address || '',
          deliveryArea: shipping_info?.delivery_area || 'Inside Dhaka',
          items: orderItemsPayload.map(it => ({
            name: it.product_name_snapshot,
            quantity: it.quantity,
            price: it.unit_price,
            total: it.subtotal
          })),
          subtotal,
          shipping_fee: shippingFee,
          discount: parsedDiscount,
          total,
          payment_method: payment_method
        }, emailToUse);
      }
    } catch (emailErr) {
      console.warn('VIP order confirmation email dispatch warning:', emailErr);
    }

    await logAdminAction(db, admin_email || 'system@admin', 'CREATE', 'orders', order.id, null, order, `Created manual VIP order ${orderNumber}`);
    
    res.json({
      success: true,
      orderId: order.id,
      orderNumber,
      order: {
        ...order,
        order_items: orderItemsPayload,
        shipping_addresses: insertedShipping ? [insertedShipping] : [],
        customers: cust
      }
    });
  });

  // Customers
  app.get("/api/admin/customers", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data, error } = await (db.from('customers') as any).select('*, orders(id, total, created_at)').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  // Deliveries
  app.get("/api/admin/deliveries", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data, error } = await (db.from('orders') as any)
      .select('order_number, order_status, tracking_code, created_at, customers(full_name, phone), shipping_addresses(*)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  // Reviews Moderation
  app.get("/api/admin/reviews", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data, error } = await (db.from('reviews') as any)
      .select('*, customers(full_name), products(name)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data || []);
  });

  app.put("/api/admin/reviews/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    const { status, admin_email } = req.body;
    const { data, error } = await (db.from('reviews') as any).update({ status, updated_at: new Date() }).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    await logAdminAction(db, admin_email || 'system@admin', 'UPDATE', 'reviews', id, null, data, `Updated review status to ${status}`);
    res.json({ success: true, review: data });
  });

  app.delete("/api/admin/reviews/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    await (db.from('reviews') as any).delete().eq('id', id);
    res.json({ success: true });
  });

  // Promo Codes CRUD
  app.get("/api/admin/promo-codes", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data } = await (db.from('promo_codes') as any).select('*').order('created_at', { ascending: false });
    res.json(data || []);
  });

  app.post("/api/admin/promo-codes", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { code, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, is_active, start_date, expiry_date, admin_email } = req.body;
    const { data, error } = await (db.from('promo_codes') as any).insert({
      code: code.toUpperCase(), description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, is_active: is_active ?? true, start_date, expiry_date
    }).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    await logAdminAction(db, admin_email || 'system@admin', 'CREATE', 'promo_codes', data.id, null, data, `Created promo code ${code}`);
    res.json({ success: true, promo: data });
  });

  app.put("/api/admin/promo-codes/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    const { admin_email, ...updates } = req.body;
    if (updates.code) updates.code = updates.code.toUpperCase();
    const { data, error } = await (db.from('promo_codes') as any).update({ ...updates, updated_at: new Date() }).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    await logAdminAction(db, admin_email || 'system@admin', 'UPDATE', 'promo_codes', id, null, data, `Updated promo code`);
    res.json({ success: true, promo: data });
  });

  app.delete("/api/admin/promo-codes/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    await (db.from('promo_codes') as any).delete().eq('id', id);
    res.json({ success: true });
  });

  // Banners CRUD
  app.get("/api/admin/banners", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data } = await (db.from('homepage_banners') as any).select('*').order('sort_order', { ascending: true });
    res.json(data || []);
  });

  app.post("/api/admin/banners", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { title, subtitle, image_url, button_text, button_link, sort_order, is_active, admin_email } = req.body;
    const { data, error } = await (db.from('homepage_banners') as any).insert({
      title, subtitle, image_url, storage_path: image_url, button_text, button_link, sort_order: sort_order || 0, is_active: is_active ?? true
    }).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    await logAdminAction(db, admin_email || 'system@admin', 'CREATE', 'homepage_banners', data.id, null, data, `Created banner`);
    res.json({ success: true, banner: data });
  });

  app.put("/api/admin/banners/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    const { admin_email, ...updates } = req.body;
    const { data, error } = await (db.from('homepage_banners') as any).update({ ...updates, updated_at: new Date() }).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    await logAdminAction(db, admin_email || 'system@admin', 'UPDATE', 'homepage_banners', id, null, data, `Updated banner`);
    res.json({ success: true, banner: data });
  });

  app.delete("/api/admin/banners/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    await (db.from('homepage_banners') as any).delete().eq('id', id);
    res.json({ success: true });
  });

  // Inventory
  app.get("/api/admin/inventory", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data } = await (db.from('products') as any).select('id, name, sku, stock_quantity, price, status').order('name');
    res.json(data || []);
  });

  app.put("/api/admin/inventory/:id", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { id } = req.params;
    const { stock_quantity, admin_email } = req.body;
    const { data, error } = await (db.from('products') as any).update({ stock_quantity, updated_at: new Date() }).eq('id', id).select('*').single();
    if (error) return res.status(400).json({ error: error.message });
    await logAdminAction(db, admin_email || 'system@admin', 'UPDATE', 'inventory', id, null, data, `Updated stock to ${stock_quantity}`);
    res.json({ success: true, product: data });
  });

  // Store Settings & Maintenance Mode
  app.get("/api/admin/settings", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data } = await (db.from('store_settings') as any).select('*');
    res.json(data || []);
  });

  app.put("/api/admin/settings", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { settings, admin_email } = req.body; // Array of { settingKey, settingValue }

    for (const s of settings) {
      const { data: existing } = await (db.from('store_settings') as any)
        .select('id')
        .eq('setting_key', s.settingKey)
        .maybeSingle();

      if (existing) {
        await (db.from('store_settings') as any)
          .update({ setting_value: s.settingValue, updated_at: new Date() })
          .eq('setting_key', s.settingKey);
      } else {
        await (db.from('store_settings') as any)
          .insert({ setting_key: s.settingKey, setting_value: s.settingValue });
      }
    }

    await logAdminAction(db, admin_email || 'system@admin', 'UPDATE', 'store_settings', 'settings', null, settings, 'Updated store settings');
    res.json({ success: true });
  });

  // Analytics
  app.get("/api/admin/analytics", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });

    const { data: orders } = await (db.from('orders') as any).select('total, order_status, created_at');
    const { data: customers } = await (db.from('customers') as any).select('id, created_at');
    const { data: products } = await (db.from('products') as any).select('id, name, stock_quantity');

    let totalRevenue = 0;
    let deliveredCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    (orders || []).forEach((o: any) => {
      if (o.order_status !== 'cancelled' && o.order_status !== 'returned') {
        totalRevenue += Number(o.total || 0);
      }
      if (o.order_status === 'delivered') deliveredCount++;
      if (o.order_status === 'pending' || o.order_status === 'confirmed') pendingCount++;
      if (o.order_status === 'cancelled') cancelledCount++;
    });

    res.json({
      totalRevenue,
      totalOrders: (orders || []).length,
      totalCustomers: (customers || []).length,
      totalProducts: (products || []).length,
      deliveredCount,
      pendingCount,
      cancelledCount,
      averageOrderValue: orders && orders.length > 0 ? totalRevenue / orders.length : 0
    });
  });

  // Activity / Audit Logs
  app.get("/api/admin/activity", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'DB error' });
    const { data } = await (db.from('audit_logs') as any).select('*').order('created_at', { ascending: false }).limit(100);
    res.json(data || []);
  });

  // System Health
  app.get("/api/admin/system-health", async (req, res) => {
    const db = getSupabaseAdmin();
    let dbStatus = 'connected';
    try {
      await db.from('products').select('id').limit(1);
    } catch {
      dbStatus = 'disconnected';
    }
    res.json({
      database: dbStatus,
      storage: 'operational',
      emailService: process.env.RESEND_API_KEY ? 'configured' : 'fallback-mode',
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime()
    });
  });

  // Data Export CSV
  app.get("/api/admin/export/:type", async (req, res) => {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).send('DB Error');
    const { type } = req.params;

    let rows: any[] = [];
    if (type === 'orders') {
      const { data } = await (db.from('orders') as any).select('order_number, total, order_status, payment_method, created_at');
      rows = data || [];
    } else if (type === 'customers') {
      const { data } = await (db.from('customers') as any).select('full_name, email, phone, created_at');
      rows = data || [];
    } else if (type === 'products') {
      const { data } = await (db.from('products') as any).select('name, sku, price, stock_quantity, status');
      rows = data || [];
    } else if (type === 'reviews') {
      const { data } = await (db.from('reviews') as any).select('rating, review_text, status, created_at');
      rows = data || [];
    }

    if (rows.length === 0) return res.send('No data available for export');

    const headers = Object.keys(rows[0]).join(',');
    const csvRows = rows.map(r => Object.values(r).map(val => `"${String(val || '').replace(/"/g, '""')}"`).join(','));
    const csv = [headers, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-export.csv`);
    res.send(csv);
  });

  // Storefront data proxy endpoints using server-side Supabase client
  app.get("/api/store/products", async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.json([]);
      const { data, error } = await (db.from('products') as any)
        .select('*, categories(*), product_images(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/store/products/:slug", async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(404).json({ error: 'Not found' });
      const { slug } = req.params;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
      let query = (db.from('products') as any).select('*, categories(*), product_images(*)');
      if (isUuid) {
        query = query.or(`slug.eq.${slug},id.eq.${slug}`);
      } else {
        query = query.eq('slug', slug);
      }
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: 'Product not found' });
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/store/categories", async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.json([]);
      const { data, error } = await (db.from('categories') as any).select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/store/banners", async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.json([]);
      const { data, error } = await (db.from('homepage_banners') as any).select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/store/delivery-zones", async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.json([]);
      const { data, error } = await (db.from('delivery_zones') as any).select('*');
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Store settings fetch endpoint for storefront maintenance check
  app.get("/api/store/settings-map", async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.json({});
      const { data } = await (db.from('store_settings') as any).select('*');
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        map[row.setting_key] = row.setting_value;
      });
      res.json(map);
    } catch {
      res.json({});
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
