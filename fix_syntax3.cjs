const fs = require('fs');
let code = fs.readFileSync('src/lib/queries.ts', 'utf8');

const lastFuncPattern = /export async function deleteProductPreset[\s\S]*/;
const correctFunc = `export async function deleteProductPreset(id: string): Promise<boolean> {
  try {
    const res = await fetch('/api/store/presets/' + id, { method: 'DELETE' });
    return res.ok;
  } catch (error) {
    console.error('Error deleting preset:', error);
    return false;
  }
}
`;

code = code.replace(lastFuncPattern, correctFunc);

fs.writeFileSync('src/lib/queries.ts', code);
