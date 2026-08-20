const fs = require('fs');
let code = fs.readFileSync('src/db/schema.ts', 'utf8');

if (!code.includes('jsonb(')) {
    code = code.replace(/boolean, timestamp } from 'drizzle-orm\/pg-core';/, `boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';`);
}

if (!code.includes('hasVariants:')) {
  code = code.replace(
    /categoryId: uuid\('category_id'\).references\(\(\) => categories.id\),/,
    `categoryId: uuid('category_id').references(() => categories.id),\n  hasVariants: boolean('has_variants').default(false),`
  );
}

if (!code.includes('export const productVariants')) {
  const newTables = `
export const productAttributes = pgTable('product_attributes', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  position: integer('position').default(0),
});

export const productAttributeValues = pgTable('product_attribute_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  attributeId: uuid('attribute_id').references(() => productAttributes.id, { onDelete: 'cascade' }).notNull(),
  value: text('value').notNull(),
  position: integer('position').default(0),
});

export const productVariants = pgTable('product_variants', {
  id: uuid('id').defaultRandom().primaryKey(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  sku: text('sku').notNull(),
  price: numeric('price', { precision: 12, scale: 2 }),
  comparePrice: numeric('compare_price', { precision: 12, scale: 2 }),
  stockQuantity: integer('stock_quantity').default(0).notNull(),
  imageUrl: text('image_url'),
  isActive: boolean('is_active').default(true).notNull(),
  attributes: jsonb('attributes').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

`;

  code = code.replace(
    /export const carts = pgTable\('carts', {/,
    newTables + `export const carts = pgTable('carts', {`
  );
}

if (!code.includes('variantId: uuid')) {
  code = code.replace(
    /productId: uuid\('product_id'\).references\(\(\) => products.id\).notNull\(\),/g,
    `productId: uuid('product_id').references(() => products.id).notNull(),\n  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),`
  );
  
  code = code.replace(
    /productId: uuid\('product_id'\).references\(\(\) => products.id\),/,
    `productId: uuid('product_id').references(() => products.id),\n  variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),\n  variantInfoSnapshot: jsonb('variant_info_snapshot'),`
  );
}

fs.writeFileSync('src/db/schema.ts', code);
console.log('Schema updated successfully');
