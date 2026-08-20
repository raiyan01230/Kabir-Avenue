const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const extensionRoutes = `
  // --- CONTACT MESSAGES API ---
  app.get('/api/contact-messages', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.json([]);
      const { data, error } = await (db.from('contact_messages') as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/contact-messages', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const { data, error } = await (db.from('contact_messages') as any).insert([{
        name, email, phone, subject, message, status: 'unread'
      }]).select().single();
      if (error) throw error;
      res.json({ success: true, message: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/contact-messages/:id', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
      const { status } = req.body;
      const { data, error } = await (db.from('contact_messages') as any)
        .update({ status })
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, message: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/contact-messages/:id', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
      const { error } = await (db.from('contact_messages') as any).delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ABOUT US API ---
  app.get('/api/about-us', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.json({});
      const { data } = await (db.from('store_settings') as any)
        .select('setting_value')
        .eq('setting_key', 'about_us_content')
        .maybeSingle();
      if (data?.setting_value) {
        try {
          return res.json(JSON.parse(data.setting_value));
        } catch {
          // fallback
        }
      }
      // Default About Us structure
      res.json({
        pageTitle: "About Us",
        subtitle: "Building Bangladesh's Premier Next-Gen E-Commerce Experience",
        mainDescription: "Welcome to our store, where technology meets uncompromising quality. We pride ourselves on delivering authentic products with world-class customer service across Bangladesh.",
        ourStory: "Founded with a passion for excellence, we started as a small team dedicated to bringing genuine, high-performance electronics and lifestyle products directly to doorstep buyers in Dhaka and beyond.",
        mission: "To empower every Bangladeshi household and professional with cutting-edge gear, unbeatable prices, and lightning-fast nationwide delivery.",
        vision: "To become the most trusted and customer-centric e-commerce brand in South Asia.",
        whyChooseUs: [
          "100% Authentic Products with Official Warranty",
          "Lightning Fast Delivery Inside & Outside Dhaka",
          "Dedicated 24/7 Customer Support Hotline",
          "Secure & Flexible Payment Options"
        ],
        customerCommitment: "Your satisfaction is our ultimate benchmark. Every order is meticulously packaged and inspected before dispatch.",
        callToAction: "Ready to upgrade your daily lifestyle?",
        buttonText: "Explore Shop Now",
        buttonLink: "/shop",
        imageUrl: "https://images.unsplash.com/photo-1556742049-0a67d553c24d?auto=format&fit=crop&q=80&w=1200",
        enabledSections: {
          story: true,
          missionVision: true,
          whyChooseUs: true,
          commitment: true,
          cta: true
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/about-us', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
      const content = req.body;
      const { error } = await (db.from('store_settings') as any).upsert({
        setting_key: 'about_us_content',
        setting_value: JSON.stringify(content),
        description: 'Dynamic About Us Page Content',
        updated_at: new Date().toISOString()
      }, { onConflict: 'setting_key' });
      if (error) throw error;
      res.json({ success: true, content });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- ADMIN USERS / STAFF MANAGEMENT API ---
  app.get('/api/admin/users', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.json([]);
      const { data, error } = await (db.from('admin_users') as any).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data || []);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/admin/users', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
      const { email, password, fullName, role, permissions } = req.body;
      if (!email || !password || !fullName) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const { data, error } = await (db.from('admin_users') as any).insert([{
        email,
        password_hash: password, // in production hash or store securely
        full_name: fullName,
        role: role || 'staff',
        permissions: permissions || {},
        is_active: true
      }]).select().single();
      if (error) throw error;
      res.json({ success: true, user: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.patch('/api/admin/users/:id', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
      const { fullName, role, isActive, permissions, password } = req.body;
      const updateData: any = {};
      if (fullName !== undefined) updateData.full_name = fullName;
      if (role !== undefined) updateData.role = role;
      if (isActive !== undefined) updateData.is_active = isActive;
      if (permissions !== undefined) updateData.permissions = permissions;
      if (password !== undefined && password.trim() !== '') updateData.password_hash = password;

      const { data, error } = await (db.from('admin_users') as any)
        .update(updateData)
        .eq('id', req.params.id)
        .select()
        .single();
      if (error) throw error;
      res.json({ success: true, user: data });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/users/:id', async (req, res) => {
    try {
      const db = getSupabaseAdmin();
      if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
      const { error } = await (db.from('admin_users') as any).delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
`;

if (!code.includes('/api/contact-messages')) {
  code = code.replace(/app\.listen\(PORT/, extensionRoutes + '\n\n  app.listen(PORT');
  fs.writeFileSync('server.ts', code);
}
