const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

code = code.replace(/useState<'details' \| 'seo'>/g, "useState<'details' | 'seo' | 'variants'>");

// Also fix the bottom modal footer buttons to handle Variants tab
code = code.replace(/activeTab === 'details' \? 'seo' : 'details'/g, "activeTab === 'details' ? 'variants' : activeTab === 'variants' ? 'seo' : 'details'");
code = code.replace(/activeTab === 'details' \? 'View Google SEO Preview →' : '← Back to Product Data'/g, "activeTab === 'details' ? 'Manage Variants →' : activeTab === 'variants' ? 'View Google SEO Preview →' : '← Back to Product Data'");

fs.writeFileSync('src/pages/admin/AdminProducts.tsx', code);
