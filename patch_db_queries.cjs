const fs = require('fs');

let code = fs.readFileSync('src/lib/queries.ts', 'utf8');

// Fix the supabase error (if any)
code = code.replace(/await supabase/g, "await window.supabase"); // just a temp fix if they are there, or maybe supabase is imported?

// Fix the db error for productPresets
const presetFunctions = /export async function getProductPresets\(\)[\s\S]*?export async function deleteProductPreset\(id: string\): Promise<boolean> \{[\s\S]*?\}/;
const newPresetFunctions = `
export async function getProductPresets(): Promise<ProductPreset[]> {
  try {
    const res = await fetch('/api/store/presets');
    if (!res.ok) return [];
    return await res.json();
  } catch (error) {
    console.error('Error fetching presets:', error);
    return [];
  }
}

export async function createProductPreset(name: string, description: string | null, attributes: PresetAttribute[]): Promise<ProductPreset | null> {
  try {
    const res = await fetch('/api/store/presets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, attributes })
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error('Error creating preset:', error);
    return null;
  }
}

export async function deleteProductPreset(id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/store/presets/' + id, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.error('Error deleting preset:', error);
    return false;
  }
}
`;
code = code.replace(presetFunctions, newPresetFunctions);

fs.writeFileSync('src/lib/queries.ts', code);
