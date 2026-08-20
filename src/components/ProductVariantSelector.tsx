import React, { useEffect } from 'react';
import { ProductAttribute, ProductVariant } from '../lib/queries';
import { useVariant } from '../context/VariantContext';

interface Props {
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  onVariantSelected?: (variant: ProductVariant | null) => void;
}

export default function ProductVariantSelector({ attributes, variants, onVariantSelected }: Props) {
  const { 
    setAttributes, 
    setVariants, 
    selectedOptions, 
    selectOption, 
    isOptionAvailable, 
    selectedVariant 
  } = useVariant();

  useEffect(() => {
    setAttributes(attributes);
    setVariants(variants);
  }, [attributes, variants, setAttributes, setVariants]);

  useEffect(() => {
    if (onVariantSelected) {
      onVariantSelected(selectedVariant);
    }
  }, [selectedVariant, onVariantSelected]);

  return (
    <div className="space-y-5">
      {attributes.map(attr => (
        <div key={attr.id} className="space-y-2">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{attr.name}</label>
          <div className="flex flex-wrap gap-2">
            {(attr.product_attribute_values || []).map(val => {
              const isSelected = selectedOptions[attr.name] === val.value;
              const isAvailable = isOptionAvailable(attr.name, val.value);
              
              let btnClass = "px-4 py-2 text-sm font-bold border rounded-lg transition-all duration-200 ";
              if (isSelected) {
                btnClass += "border-slate-900 bg-slate-900 text-white shadow-md";
              } else if (!isAvailable) {
                btnClass += "border-slate-200 bg-slate-50 text-slate-400 opacity-50 cursor-not-allowed line-through";
              } else {
                btnClass += "border-slate-300 bg-white text-slate-700 hover:border-slate-900 hover:bg-slate-50";
              }

              return (
                <button
                  key={val.id}
                  type="button"
                  disabled={!isAvailable && !isSelected} 
                  onClick={() => selectOption(attr.name, val.value)}
                  className={btnClass}
                >
                  {val.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
