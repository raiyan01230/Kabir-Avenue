const fs = require('fs');
let code = fs.readFileSync('src/pages/admin/AdminProducts.tsx', 'utf8');

const tabsPattern = /<button\n\s*type="button"\n\s*onClick=\{\(\) => setActiveTab\('seo'\)\}/;
const replacement = `<button
                  type="button"
                  onClick={() => setActiveTab('variants' as any)}
                  className={\`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 \${
                    activeTab === 'variants' as any ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }\`}
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Variants</span>
                  {hasVariants && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('seo')}`;

if (!code.includes("setActiveTab('variants'")) {
    code = code.replace(tabsPattern, replacement);
}

fs.writeFileSync('src/pages/admin/AdminProducts.tsx', code);
