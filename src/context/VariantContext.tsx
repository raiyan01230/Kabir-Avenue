import React, { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { ProductAttribute, ProductVariant } from '../lib/queries';

interface VariantContextType {
  attributes: ProductAttribute[];
  variants: ProductVariant[];
  selectedOptions: Record<string, string>;
  selectedVariant: ProductVariant | null;
  setAttributes: (attrs: ProductAttribute[]) => void;
  setVariants: (vars: ProductVariant[]) => void;
  selectOption: (attrName: string, value: string) => void;
  isOptionAvailable: (attrName: string, value: string) => boolean;
  clearSelection: () => void;
}

const VariantContext = createContext<VariantContextType | undefined>(undefined);

export function VariantProvider({ children }: { children: ReactNode }) {
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});

  const selectedVariant = useMemo(() => {
    if (attributes.length === 0 || Object.keys(selectedOptions).length !== attributes.length) {
      return null;
    }
    return variants.find(v => 
      v.is_active && 
      Object.entries(selectedOptions).every(([k, val]) => v.attributes[k] === val)
    ) || null;
  }, [selectedOptions, attributes, variants]);

  const selectOption = (attrName: string, value: string) => {
    setSelectedOptions(prev => ({ ...prev, [attrName]: value }));
  };

  const clearSelection = () => setSelectedOptions({});

  const isOptionAvailable = (attrName: string, value: string) => {
    return variants.some(v => {
      if (!v.is_active || v.stock_quantity <= 0) return false;
      if (v.attributes[attrName] !== value) return false;
      for (const [k, val] of Object.entries(selectedOptions)) {
        if (k !== attrName && v.attributes[k] !== val) return false;
      }
      return true;
    });
  };

  return (
    <VariantContext.Provider value={{
      attributes,
      variants,
      selectedOptions,
      selectedVariant,
      setAttributes,
      setVariants,
      selectOption,
      isOptionAvailable,
      clearSelection
    }}>
      {children}
    </VariantContext.Provider>
  );
}

export function useVariant() {
  const context = useContext(VariantContext);
  if (context === undefined) {
    throw new Error('useVariant must be used within a VariantProvider');
  }
  return context;
}
