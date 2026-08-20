const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminProductVariantsEditor.tsx', 'utf8');

// Imports
const importPattern = /import \{ ProductAttribute, ProductVariant \} from '\.\.\/\.\.\/lib\/queries';/;
const newImport = `import { ProductAttribute, ProductVariant, ProductPreset, getProductPresets, createProductPreset } from '../../lib/queries';
import { Save, Download, Loader2 } from 'lucide-react';`;
if (!code.includes('ProductPreset')) {
  code = code.replace(importPattern, newImport);
}

// Add state for presets
const statePattern = /const \[newAttrName, setNewAttrName\] = useState\(''\);/;
const newState = `const [newAttrName, setNewAttrName] = useState('');
  const [presets, setPresets] = useState<ProductPreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  useEffect(() => {
    async function loadPresets() {
      setLoadingPresets(true);
      const loaded = await getProductPresets();
      
      // Auto-create default Shoes preset if DB has no presets at all (as requested)
      if (loaded.length === 0) {
        const shoePreset = await createProductPreset("Shoes", "Default shoe size, color, and types", [
          { name: "Size", values: ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48"] },
          { name: "Color", values: ["Black", "White", "Red", "Blue", "Green", "Brown", "Grey", "Beige", "Pink", "Navy", "Multicolor"] },
          { name: "Gender", values: ["Men", "Women", "Unisex", "Kids"] },
          { name: "Shoe Type", values: ["Running", "Walking", "Training", "Sports", "Sneakers", "Casual", "Formal", "Boots", "Sandals", "Slippers", "Loafers", "Football", "Basketball", "Hiking"] },
          { name: "Material", values: ["Leather", "Synthetic Leather", "Mesh", "Canvas", "Suede", "Rubber", "Textile", "Fabric"] },
          { name: "Closure Type", values: ["Lace-Up", "Slip-On", "Velcro", "Zipper", "Buckle", "Elastic"] },
          { name: "Sole Material", values: ["Rubber", "EVA", "TPR", "PU", "PVC"] },
          { name: "Fit", values: ["Regular", "Wide", "Narrow"] },
          { name: "Occasion", values: ["Casual", "Sports", "Running", "Office", "Formal", "Outdoor", "Party", "Daily Wear"] },
          { name: "Season", values: ["All Season", "Summer", "Winter", "Rainy Season"] },
          { name: "Brand", values: [] },
          { name: "Country of Origin", values: ["Bangladesh", "China", "Vietnam", "India", "Indonesia", "Thailand", "Other"] }
        ]);
        if (shoePreset) setPresets([shoePreset]);
      } else {
        setPresets(loaded);
      }
      setLoadingPresets(false);
    }
    loadPresets();
  }, []);

  const handleApplyPreset = () => {
    const preset = presets.find(p => p.id === selectedPresetId);
    if (!preset) return;
    
    // Convert PresetAttribute to ProductAttribute
    const newAttrs: ProductAttribute[] = preset.attributes.map((attr, idx) => ({
      id: \`new-\${Math.random()}\`,
      name: attr.name,
      position: idx,
      product_attribute_values: attr.values.map((v: string, vIdx: number) => ({
        id: \`new-\${Math.random()}\`,
        value: v,
        position: vIdx
      }))
    }));
    
    setAttributes(newAttrs);
    setVariants([]); // Clear variants when applying a new preset
  };

  const handleSaveCurrentAsPreset = async () => {
    const name = prompt("Enter a name for this new preset:");
    if (!name) return;
    
    setIsSavingPreset(true);
    const presetAttrs = attributes.map(a => ({
      name: a.name,
      values: (a.product_attribute_values || []).map((v: any) => v.value)
    }));
    
    const newPreset = await createProductPreset(name, "", presetAttrs);
    if (newPreset) {
      setPresets([...presets, newPreset]);
      setSelectedPresetId(newPreset.id);
      alert("Preset saved successfully!");
    }
    setIsSavingPreset(false);
  };
`;
if (!code.includes('handleApplyPreset')) {
  code = code.replace(statePattern, newState);
}

const UI_Presets = `
      <div className="space-y-4 border-t border-slate-800 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-slate-300 font-bold text-xs uppercase tracking-wider">Load Preset</h4>
            <p className="text-slate-400 text-xs mt-1">Quickly load standard attributes like Shoes, Clothing, etc.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedPresetId}
              onChange={(e) => setSelectedPresetId(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2 rounded-lg outline-none focus:border-emerald-500"
            >
              <option value="">-- Select Preset --</option>
              {presets.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleApplyPreset}
              disabled={!selectedPresetId}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Apply
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t border-slate-800 pt-6">
        <div className="flex items-center justify-between">
          <h4 className="text-slate-300 font-bold text-xs uppercase tracking-wider">1. Options</h4>
          <button
            type="button"
            onClick={handleSaveCurrentAsPreset}
            disabled={isSavingPreset || attributes.length === 0}
            className="text-emerald-400 hover:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
          >
            {isSavingPreset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save as Preset
          </button>
        </div>
`;

code = code.replace(/<div className="space-y-4 border-t border-slate-800 pt-6">\s*<h4 className="text-slate-300 font-bold text-xs uppercase tracking-wider">1\. Options<\/h4>/, UI_Presets);

// Add remove variant button in the table
// First, add the header
code = code.replace(/<th className="pb-2 font-medium w-12 text-center">Active<\/th>/, `<th className="pb-2 font-medium w-12 text-center">Active</th>\n                  <th className="pb-2 font-medium w-12 text-center">Remove</th>`);
// Then add the cell
const cellRemove = `<td className="py-3 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Are you sure you want to remove this variant?')) {
                            setVariants(variants.filter((_, i) => i !== idx));
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>`;
code = code.replace(/<\/td>\s*<\/tr>\s*\}\)\)/, `</td>\n${cellRemove}\n                  </tr>\n                )))`);


fs.writeFileSync('src/components/admin/AdminProductVariantsEditor.tsx', code);
