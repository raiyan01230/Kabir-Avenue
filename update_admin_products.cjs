const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

const importPattern = /import \{ Edit2, Plus, Trash2, Search, Package, AlertCircle, RefreshCw, X, Link as LinkIcon, Download, Sparkles, Check, ChevronDown, Camera \} from 'lucide-react';/;
const importReplacement = `import { Edit2, Plus, Trash2, Search, Package, AlertCircle, RefreshCw, X, Link as LinkIcon, Download, Sparkles, Check, ChevronDown, Camera } from 'lucide-react';\nimport AdminProductVariantsEditor from '../../components/admin/AdminProductVariantsEditor';\nimport { ProductAttribute, ProductVariant } from '../../lib/queries';`;

if(!code.includes('AdminProductVariantsEditor')) {
    code = code.replace(importPattern, importReplacement);
}

const statePattern = /const \[description, setDescription\] = useState\(''\);/;
const stateReplacement = `const [description, setDescription] = useState('');
  const [hasVariants, setHasVariants] = useState(false);
  const [attributes, setAttributes] = useState<ProductAttribute[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);`;
if(!code.includes('const [hasVariants, setHasVariants]')) {
    code = code.replace(statePattern, stateReplacement);
}

const openModalPattern = /setShortDescription\(product\?\.short_description \|\| ''\);/;
const openModalReplacement = `setShortDescription(product?.short_description || '');
    setHasVariants(product?.has_variants || false);
    setAttributes(product?.product_attributes || []);
    setVariants(product?.product_variants || []);`;
if(!code.includes('setHasVariants(product?.has_variants')) {
    code = code.replace(openModalPattern, openModalReplacement);
}

const savePattern = /body: JSON\.stringify\(\{/;
const saveReplacement = `body: JSON.stringify({\n        has_variants: hasVariants,\n        attributes,\n        variants,`;
if(!code.includes('has_variants: hasVariants,')) {
    code = code.replace(new RegExp(savePattern, 'g'), saveReplacement);
}


const editorPattern = /\{\/\* Editor Tabs \*\/\}/;
const editorReplacement = `{/* Editor Tabs */}
            <div className="flex border-b border-slate-800 px-6">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className={\`px-4 py-3 text-xs font-bold border-b-2 transition-colors \${
                  activeTab === 'details' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }\`}
              >
                Basic Details
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('variants' as any)}
                className={\`px-4 py-3 text-xs font-bold border-b-2 transition-colors \${
                  activeTab === 'variants' as any ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }\`}
              >
                Variants
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={\`px-4 py-3 text-xs font-bold border-b-2 transition-colors \${
                  activeTab === 'seo' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'
                }\`}
              >
                AI &amp; SEO Data
              </button>
            </div>
`;

// Remove original tab buttons which were near <form>
const oldTabsPattern = /\{\/\* Editor Tabs \*\/\}\s*<div className="flex border-b border-slate-800 px-6">[\s\S]*?<\/div>/;

if(!code.includes('setActiveTab(\'variants\'')) {
    code = code.replace(oldTabsPattern, editorReplacement);
}

const formPattern = /\{activeTab === 'details' && \(/;
const formReplacement = `
            {activeTab === 'variants' as any && (
              <div className="p-6">
                <AdminProductVariantsEditor
                  hasVariants={hasVariants}
                  setHasVariants={setHasVariants}
                  attributes={attributes}
                  setAttributes={setAttributes}
                  variants={variants}
                  setVariants={setVariants}
                  productPrice={price}
                  productSku={sku}
                />
              </div>
            )}
            {activeTab === 'details' && (`;

if(!code.includes('activeTab === \'variants\'')) {
    code = code.replace(formPattern, formReplacement);
}

fs.writeFileSync('src/pages/admin/AdminProducts.tsx', code);
