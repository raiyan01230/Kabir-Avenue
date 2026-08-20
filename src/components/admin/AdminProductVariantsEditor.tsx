import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, Image as ImageIcon } from 'lucide-react';
import { ProductAttribute, ProductVariant, ProductPreset, getProductPresets, createProductPreset } from '../../lib/queries';
import { Save, Download, Loader2 } from 'lucide-react';

interface Props {
  hasVariants: boolean;
  setHasVariants: (val: boolean) => void;
  attributes: ProductAttribute[];
  setAttributes: (attrs: ProductAttribute[]) => void;
  variants: ProductVariant[];
  setVariants: (vars: ProductVariant[]) => void;
  productPrice: string;
  productSku: string;
}

export default function AdminProductVariantsEditor({
  hasVariants, setHasVariants, attributes, setAttributes, variants, setVariants, productPrice, productSku
}: Props) {
  const [newAttrName, setNewAttrName] = useState('');
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
      id: `new-${Math.random()}`,
      name: attr.name,
      position: idx,
      product_attribute_values: attr.values.map((v: string, vIdx: number) => ({
        id: `new-${Math.random()}`,
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

  
  // Initialize combinations when attributes change
  const generateCombinations = () => {
    if (attributes.length === 0) return setVariants([]);
    
    // Cartesian product of all attribute values
    const combine = (attrs: ProductAttribute[], index: number, current: Record<string, string>, result: Record<string, string>[]) => {
      if (index === attrs.length) {
        result.push({ ...current });
        return;
      }
      const attr = attrs[index];
      const values = attr.product_attribute_values || [];
      if (values.length === 0) {
        combine(attrs, index + 1, current, result);
      } else {
        for (const val of values) {
          current[attr.name] = val.value;
          combine(attrs, index + 1, current, result);
        }
      }
    };
    
    const newCombinations: Record<string, string>[] = [];
    combine(attributes, 0, {}, newCombinations);
    
    // Merge with existing variants to preserve price/stock
    const newVariants = newCombinations.map(combo => {
      const existing = variants.find(v => 
        Object.entries(combo).every(([k, val]) => v.attributes[k] === val) &&
        Object.keys(combo).length === Object.keys(v.attributes).length
      );
      
      const variantNamePart = Object.values(combo).join('-').toUpperCase();
      
      return existing || {
        id: `new-${Math.random()}`,
        sku: `${productSku || 'SKU'}-${variantNamePart}`,
        price: productPrice,
        compare_price: null,
        stock_quantity: 0,
        image_url: null,
        is_active: true,
        attributes: combo
      };
    });
    
    setVariants(newVariants as ProductVariant[]);
  };

  const addAttribute = () => {
    if (!newAttrName.trim()) return;
    setAttributes([
      ...attributes,
      { id: `new-${Math.random()}`, name: newAttrName.trim(), position: attributes.length, product_attribute_values: [] }
    ]);
    setNewAttrName('');
  };

  const removeAttribute = (attrId: string) => {
    setAttributes(attributes.filter(a => a.id !== attrId));
  };

  const addAttributeValue = (attrId: string, value: string) => {
    if (!value.trim()) return;
    setAttributes(attributes.map(a => {
      if (a.id === attrId) {
        const values = a.product_attribute_values || [];
        if (values.find(v => v.value.toLowerCase() === value.trim().toLowerCase())) return a;
        return {
          ...a,
          product_attribute_values: [...values, { id: `new-${Math.random()}`, value: value.trim(), position: values.length }]
        };
      }
      return a;
    }));
  };

  const removeAttributeValue = (attrId: string, valId: string) => {
    setAttributes(attributes.map(a => {
      if (a.id === attrId) {
        return {
          ...a,
          product_attribute_values: (a.product_attribute_values || []).filter(v => v.id !== valId)
        };
      }
      return a;
    }));
  };

  if (!hasVariants) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-sm">Product Variants</h3>
            <p className="text-slate-400 text-xs mt-1">This product currently has no variants.</p>
          </div>
          <button
            type="button"
            onClick={() => setHasVariants(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
          >
            Enable Variants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-white font-bold text-sm">Advanced Variants</h3>
          <p className="text-slate-400 text-xs mt-1">Manage sizes, colors, and other attributes.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setHasVariants(false);
            setAttributes([]);
            setVariants([]);
          }}
          className="text-rose-400 hover:text-rose-300 text-xs font-bold transition"
        >
          Disable Variants
        </button>
      </div>

      
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

        
        {attributes.map((attr, i) => (
          <div key={attr.id} className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold text-sm">{attr.name}</span>
              <button type="button" onClick={() => removeAttribute(attr.id)} className="text-slate-500 hover:text-rose-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {(attr.product_attribute_values || []).map(val => (
                <div key={val.id} className="bg-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-md flex items-center gap-2">
                  <span>{val.value}</span>
                  <button type="button" onClick={() => removeAttributeValue(attr.id, val.id)} className="hover:text-rose-400 text-slate-400">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add value..."
                  className="bg-slate-900 border border-slate-700 text-white text-xs px-2.5 py-1.5 rounded-md focus:border-emerald-500 outline-none w-32"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addAttributeValue(attr.id, e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newAttrName}
            onChange={(e) => setNewAttrName(e.target.value)}
            placeholder="New option name (e.g. Size, Color)"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-white focus:border-emerald-500 outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAttribute();
              }
            }}
          />
          <button type="button" onClick={addAttribute} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <button 
          type="button" 
          onClick={generateCombinations}
          className="mt-4 w-full py-2.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600 hover:text-white transition rounded-lg text-xs font-bold"
        >
          Generate Combinations
        </button>
      </div>

      {variants.length > 0 && (
        <div className="space-y-4 border-t border-slate-800 pt-6">
          <div className="flex items-center justify-between">
             <h4 className="text-slate-300 font-bold text-xs uppercase tracking-wider">2. Combinations ({variants.length})</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs text-slate-500">
                  <th className="pb-2 font-medium">Variant</th>
                  <th className="pb-2 font-medium">Price (৳)</th>
                  <th className="pb-2 font-medium">Stock</th>
                  <th className="pb-2 font-medium">SKU</th>
                  <th className="pb-2 font-medium w-12 text-center">Image</th>
                  <th className="pb-2 font-medium w-12 text-center">Active</th>
                  <th className="pb-2 font-medium w-12 text-center">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {variants.map((v, idx) => (
                  <tr key={idx} className="group">
                    <td className="py-3 pr-4">
                      <span className="text-xs font-bold text-white">
                        {Object.values(v.attributes).join(' / ')}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <input 
                        type="number" 
                        value={v.price || ''}
                        onChange={(e) => {
                          const newVars = [...variants];
                          newVars[idx].price = e.target.value;
                          setVariants(newVars);
                        }}
                        className="w-24 bg-slate-950 border border-slate-800 text-white text-xs px-2 py-1.5 rounded focus:border-emerald-500 outline-none"
                        placeholder={productPrice}
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input 
                        type="number" 
                        value={v.stock_quantity}
                        onChange={(e) => {
                          const newVars = [...variants];
                          newVars[idx].stock_quantity = parseInt(e.target.value) || 0;
                          setVariants(newVars);
                        }}
                        className="w-20 bg-slate-950 border border-slate-800 text-white text-xs px-2 py-1.5 rounded focus:border-emerald-500 outline-none"
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <input 
                        type="text" 
                        value={v.sku}
                        onChange={(e) => {
                          const newVars = [...variants];
                          newVars[idx].sku = e.target.value;
                          setVariants(newVars);
                        }}
                        className="w-32 bg-slate-950 border border-slate-800 text-white text-xs px-2 py-1.5 rounded focus:border-emerald-500 outline-none font-mono"
                      />
                    </td>
                    <td className="py-3 pr-4 text-center">
                       <button 
                        type="button"
                        onClick={() => {
                          const url = prompt("Enter Variant Image URL (or leave empty):", v.image_url || "");
                          if (url !== null) {
                            const newVars = [...variants];
                            newVars[idx].image_url = url;
                            setVariants(newVars);
                          }
                        }}
                        className={`p-1.5 rounded-md ${v.image_url ? 'bg-emerald-600/20 text-emerald-400' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                       >
                         <ImageIcon className="w-4 h-4" />
                       </button>
                    </td>
                    <td className="py-3 text-center">
                      <input
                        type="checkbox"
                        checked={v.is_active}
                        onChange={(e) => {
                          const newVars = [...variants];
                          newVars[idx].is_active = e.target.checked;
                          setVariants(newVars);
                        }}
                        className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500/20"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
