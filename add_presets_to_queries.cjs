const fs = require('fs');

let code = fs.readFileSync('src/lib/queries.ts', 'utf8');

const importPattern = /import {[\s\S]*?} from '\.\.\/db\/schema';/;
const newImport = `import {
  products, categories, homepageBanners, storeSettings, deliveryZones, productVariants, productAttributes, productAttributeValues, productPresets
} from '../db/schema';`;

if (code.match(importPattern)) {
    code = code.replace(importPattern, newImport);
}

const presetTypes = `
export type ProductPreset = InferSelectModel<typeof productPresets>;
export type PresetAttribute = { name: string; values: string[] };

export async function getProductPresets(): Promise<ProductPreset[]> {
  try {
    return await db.select().from(productPresets).orderBy(productPresets.name);
  } catch (error) {
    console.error('Error fetching presets:', error);
    return [];
  }
}

export async function createProductPreset(name: string, description: string | null, attributes: PresetAttribute[]): Promise<ProductPreset | null> {
  try {
    const [preset] = await db.insert(productPresets).values({
      name,
      description,
      attributes
    }).returning();
    return preset;
  } catch (error) {
    console.error('Error creating preset:', error);
    return null;
  }
}

export async function deleteProductPreset(id: string): Promise<boolean> {
  try {
    await db.delete(productPresets).where(eq(productPresets.id, id));
    return true;
  } catch (error) {
    console.error('Error deleting preset:', error);
    return false;
  }
}
`;

code = code + '\n' + presetTypes;

fs.writeFileSync('src/lib/queries.ts', code);
