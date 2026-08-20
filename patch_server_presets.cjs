const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const presetRoutes = `
// Product Presets API
app.get('/api/store/presets', async (req, res) => {
  try {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
    const { data, error } = await db.from('product_presets').select('*').order('name');
    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/store/presets', async (req, res) => {
  try {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
    const { name, description, attributes } = req.body;
    const { data, error } = await db.from('product_presets').insert([{
      name, description, attributes
    }]).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Error creating preset:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/store/presets/:id', async (req, res) => {
  try {
    const db = getSupabaseAdmin();
    if (!db) return res.status(500).json({ error: 'Supabase DB not configured' });
    const { error } = await db.from('product_presets').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT`;

if (!code.includes('/api/store/presets')) {
  code = code.replace(/app\.listen\(PORT/g, presetRoutes);
  fs.writeFileSync('server.ts', code);
}

