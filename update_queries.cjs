const fs = require('fs');
let code = fs.readFileSync('src/lib/queries.ts', 'utf8');

const importPattern = /export type Product = InferSelectModel<typeof products> & \{/;
const importReplacement = `
export type ProductAttributeValue = {
  id: string;
  value: string;
  position: number;
};

export type ProductAttribute = {
  id: string;
  name: string;
  position: number;
  product_attribute_values?: ProductAttributeValue[];
};

export type ProductVariant = {
  id: string;
  sku: string;
  price: string | number | null;
  compare_price: string | number | null;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  attributes: Record<string, string>;
};

export type Product = InferSelectModel<typeof products> & {
  has_variants?: boolean;
  product_attributes?: ProductAttribute[];
  product_variants?: ProductVariant[];
`;
code = code.replace(importPattern, importReplacement);

fs.writeFileSync('src/lib/queries.ts', code);
