const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

if (!code.includes('AdminProductVariantsEditor')) {
    code = code.replace(/import ProductImageUploader/, `import AdminProductVariantsEditor from '../../components/admin/AdminProductVariantsEditor';\nimport { ProductAttribute, ProductVariant } from '../../lib/queries';\nimport ProductImageUploader`);
    fs.writeFileSync('src/pages/admin/AdminProducts.tsx', code);
}
