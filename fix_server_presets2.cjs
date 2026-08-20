const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const postPattern = /app\.post\('\/api\/store\/presets'[\s\S]*?\}\);/g;
const newPost = `app.post('/api/store/presets', async (req, res) => {
  try {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
    const { name, description, attributes } = req.body;
    const { data, error } = await db.from('product_presets').insert([{
      name, description, attributes
    }] as any).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error creating preset:', error);
    res.status(500).json({ error: error.message });
  }
});`;

code = code.replace(postPattern, newPost);

fs.writeFileSync('server.ts', code);
