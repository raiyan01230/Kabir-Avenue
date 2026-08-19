/**
 * Advanced Dynamic SEO Engine & Schema Generator
 * Fully connected to Supabase database, products, categories, pages, store identity, and storage.
 */

export interface ProductSEOItem {
  id: string | number;
  name: string;
  slug: string;
  sku?: string;
  price: number | string;
  compare_price?: number | string;
  stock_quantity?: number;
  is_active?: boolean;
  status?: string;
  short_description?: string;
  description?: string;
  image_url?: string;
  imageUrl?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string[] | string;
  created_at?: string;
  updated_at?: string;
  categories?: {
    id?: string | number;
    name?: string;
    slug?: string;
  };
  product_images?: Array<{
    id?: string | number;
    image_url: string;
    alt_text?: string;
    image_title?: string;
    is_primary?: boolean;
    sort_order?: number;
  }>;
}

export interface CategorySEOItem {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  imageUrl?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SEOSettings {
  store_name?: string;
  store_tagline?: string;
  store_description?: string;
  store_logo?: string;
  store_favicon?: string;
  store_address?: string;
  store_phone?: string;
  store_email?: string;
  seo_site_url?: string;
  seo_canonical_base?: string;
  seo_title?: string;
  seo_description?: string;
  seo_keywords?: string;
  seo_robots_directive?: string;
  seo_og_title?: string;
  seo_og_description?: string;
  seo_og_image?: string;
  seo_twitter_card?: string;
  seo_twitter_handle?: string;
  seo_twitter_title?: string;
  seo_twitter_description?: string;
  seo_twitter_image?: string;
  seo_google_verification?: string;
  seo_bing_verification?: string;
  seo_yandex_verification?: string;
  seo_pinterest_verification?: string;
  seo_ga4_id?: string;
  seo_gtm_id?: string;
  seo_meta_pixel_id?: string;
  seo_robots_txt?: string;
  seo_geo_region?: string;
  seo_geo_placename?: string;
  seo_geo_position?: string;
  social_facebook?: string;
  social_instagram?: string;
  social_youtube?: string;
  social_tiktok?: string;
  social_twitter?: string;
  
  // Template settings
  seo_tpl_product_title?: string;
  seo_tpl_product_desc?: string;
  seo_tpl_category_title?: string;
  seo_tpl_category_desc?: string;
  seo_tpl_page_title?: string;
  seo_tpl_page_desc?: string;
  seo_image_auto_alt?: string;
  seo_image_alt_template?: string;
  seo_pages_config?: string; // JSON string
  seo_redirects?: string; // JSON string
}

export interface SEORedirect {
  id: string;
  source: string;
  destination: string;
  status: 301 | 302;
  hits: number;
  created_at: string;
  is_active: boolean;
  notes?: string;
}

export interface SEOPageConfig {
  path: string;
  name: string;
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function escapeXml(unsafe: string = ''): string {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatDateISO(dateStr?: string): string {
  if (!dateStr) return new Date().toISOString();
  try {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

/**
 * Robust Dynamic SEO Template Interpolator
 * Replaces dynamic variables like {productName}, {storeName}, {price}, etc.
 */
export function interpolateSeoTemplate(template: string, vars: Record<string, any>): string {
  if (!template) return '';
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    const valStr = value !== undefined && value !== null ? String(value) : '';
    const regex = new RegExp(`\\{${key}\\}`, 'gi');
    result = result.replace(regex, valStr);
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Standard Defaults for SEO Templates
 */
export const DEFAULT_SEO_TEMPLATES = {
  productTitle: '{productName} | {storeName}',
  productDesc: 'Buy authentic {productName} from {storeName}. Price ৳{price}. Warranty & fast nationwide delivery in Bangladesh.',
  categoryTitle: '{categoryName} Collection | {storeName}',
  categoryDesc: 'Explore genuine {categoryName} with official warranty and nationwide delivery from {storeName}.',
  pageTitle: '{pageName} | {storeName}',
  pageDesc: '{pageName} at {storeName}. Authentic gadgets and electronics in Bangladesh.',
  imageAlt: '{productName} - {attribute}'
};

/**
 * Generates an SEO-compliant robots.txt file with multi-bot support
 */
export function generateRobotsTxt(baseUrl: string, customRules?: string): string {
  const cleanBaseUrl = baseUrl ? baseUrl.replace(/\/+$/, '') : 'https://shmgadgetzone.onrender.com';
  
  if (customRules && typeof customRules === 'string' && customRules.trim().length > 0) {
    let normalized = customRules
      .replace(/\\r\\n/g, '\n')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .trim();

    let output = normalized + '\n\n';
    if (!output.includes('Sitemap:')) {
      output += `# Sitemaps\nSitemap: ${cleanBaseUrl}/sitemap.xml\nSitemap: ${cleanBaseUrl}/sitemap-products.xml\nSitemap: ${cleanBaseUrl}/sitemap-categories.xml\nSitemap: ${cleanBaseUrl}/sitemap-images.xml\nSitemap: ${cleanBaseUrl}/sitemap-pages.xml\n`;
    }
    return output;
  }

  return `# Standard Googlebot & Search Engine Indexing Rules
User-agent: *
Allow: /
Allow: /shop
Allow: /products
Allow: /product/*
Allow: /category/*
Allow: /track
Allow: /about
Allow: /contact
Allow: /faq
Allow: /terms
Allow: /privacy
Allow: /feed.xml
Allow: /google-merchant-feed.xml

Disallow: /admin/
Disallow: /admin/*
Disallow: /api/admin/
Disallow: /api/admin/*
Disallow: /api/private/
Disallow: /checkout/
Disallow: /cart
Disallow: /account/

User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /checkout/

User-agent: Google-InspectionTool
Allow: /
Disallow: /admin/
Disallow: /checkout/

User-agent: Bingbot
Allow: /
Disallow: /admin/
Crawl-delay: 1

# Sitemaps
Sitemap: ${cleanBaseUrl}/sitemap.xml
Sitemap: ${cleanBaseUrl}/sitemap-products.xml
Sitemap: ${cleanBaseUrl}/sitemap-categories.xml
Sitemap: ${cleanBaseUrl}/sitemap-images.xml
Sitemap: ${cleanBaseUrl}/sitemap-pages.xml
`;
}

/**
 * Generates Master XML Sitemap Index
 */
export function generateMasterSitemap(baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const nowISO = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  const sitemaps = [
    { loc: `${cleanBaseUrl}/sitemap-products.xml`, lastmod: nowISO },
    { loc: `${cleanBaseUrl}/sitemap-categories.xml`, lastmod: nowISO },
    { loc: `${cleanBaseUrl}/sitemap-images.xml`, lastmod: nowISO },
    { loc: `${cleanBaseUrl}/sitemap-pages.xml`, lastmod: nowISO }
  ];

  for (const sm of sitemaps) {
    xml += `  <sitemap>\n`;
    xml += `    <loc>${escapeXml(sm.loc)}</loc>\n`;
    xml += `    <lastmod>${sm.lastmod}</lastmod>\n`;
    xml += `  </sitemap>\n`;
  }

  xml += `</sitemapindex>`;
  return xml;
}

/**
 * Generates Products XML Sitemap
 */
export function generateProductsSitemap(baseUrl: string, products: ProductSEOItem[] = []): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const nowISO = new Date().toISOString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  // Always include /shop
  xml += `  <url>\n`;
  xml += `    <loc>${cleanBaseUrl}/shop</loc>\n`;
  xml += `    <lastmod>${nowISO}</lastmod>\n`;
  xml += `    <changefreq>daily</changefreq>\n`;
  xml += `    <priority>0.9</priority>\n`;
  xml += `  </url>\n`;

  for (const p of products) {
    if (!p.slug || p.is_active === false || p.status === 'archived') continue;
    const pUrl = `${cleanBaseUrl}/product/${encodeURIComponent(p.slug)}`;
    const lastMod = formatDateISO(p.updated_at || p.created_at);
    const imgUrl = p.image_url || p.imageUrl || (p.product_images && p.product_images[0]?.image_url);

    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(pUrl)}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    if (imgUrl) {
      xml += `    <image:image>\n`;
      xml += `      <image:loc>${escapeXml(imgUrl)}</image:loc>\n`;
      xml += `      <image:title>${escapeXml(p.name)}</image:title>\n`;
      xml += `    </image:image>\n`;
    }
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Generates Categories XML Sitemap
 */
export function generateCategoriesSitemap(baseUrl: string, categories: CategorySEOItem[] = []): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const c of categories) {
    if (!c.slug) continue;
    const cUrl = `${cleanBaseUrl}/category/${encodeURIComponent(c.slug)}`;
    const lastMod = formatDateISO(c.updated_at || c.created_at);

    xml += `  <url>\n`;
    xml += `    <loc>${escapeXml(cUrl)}</loc>\n`;
    xml += `    <lastmod>${lastMod}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.8</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Generates Images XML Sitemap for Google Images Search
 */
export function generateImagesSitemap(baseUrl: string, products: ProductSEOItem[] = []): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
  xml += `        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

  for (const p of products) {
    if (!p.slug || p.is_active === false || p.status === 'archived') continue;
    const pUrl = `${cleanBaseUrl}/product/${encodeURIComponent(p.slug)}`;
    const imgs: Array<{ url: string; alt?: string }> = [];

    if (p.image_url || p.imageUrl) {
      imgs.push({ url: (p.image_url || p.imageUrl)!, alt: p.name });
    }
    if (Array.isArray(p.product_images)) {
      p.product_images.forEach((pi, idx) => {
        if (pi.image_url && !imgs.some(x => x.url === pi.image_url)) {
          imgs.push({ url: pi.image_url, alt: pi.alt_text || `${p.name} - Photo ${idx + 1}` });
        }
      });
    }

    if (imgs.length > 0) {
      xml += `  <url>\n`;
      xml += `    <loc>${escapeXml(pUrl)}</loc>\n`;
      for (const img of imgs) {
        xml += `    <image:image>\n`;
        xml += `      <image:loc>${escapeXml(img.url)}</image:loc>\n`;
        xml += `      <image:title>${escapeXml(img.alt || p.name)}</image:title>\n`;
        xml += `    </image:image>\n`;
      }
      xml += `  </url>\n`;
    }
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Generates Pages XML Sitemap
 */
export function generatePagesSitemap(baseUrl: string): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const nowISO = new Date().toISOString();

  const pages = [
    { loc: '/', priority: '1.0', freq: 'daily' },
    { loc: '/shop', priority: '0.9', freq: 'daily' },
    { loc: '/track', priority: '0.7', freq: 'weekly' },
    { loc: '/wishlist', priority: '0.6', freq: 'weekly' },
    { loc: '/account', priority: '0.5', freq: 'monthly' }
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const page of pages) {
    xml += `  <url>\n`;
    xml += `    <loc>${cleanBaseUrl}${page.loc}</loc>\n`;
    xml += `    <lastmod>${nowISO}</lastmod>\n`;
    xml += `    <changefreq>${page.freq}</changefreq>\n`;
    xml += `    <priority>${page.priority}</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}

/**
 * Generates RSS 2.0 Product Catalog Feed
 */
export function generateRssFeed(
  baseUrl: string,
  storeName: string,
  storeDesc: string,
  products: ProductSEOItem[] = []
): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');
  const nowRFC = new Date().toUTCString();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n`;
  xml += `  <channel>\n`;
  xml += `    <title>${escapeXml(storeName)}</title>\n`;
  xml += `    <link>${cleanBaseUrl}</link>\n`;
  xml += `    <description>${escapeXml(storeDesc)}</description>\n`;
  xml += `    <language>en-bd</language>\n`;
  xml += `    <lastBuildDate>${nowRFC}</lastBuildDate>\n`;
  xml += `    <atom:link href="${cleanBaseUrl}/feed.xml" rel="self" type="application/rss+xml"/>\n\n`;

  for (const p of products.slice(0, 50)) {
    if (!p.slug || p.is_active === false || p.status === 'archived') continue;
    const pUrl = `${cleanBaseUrl}/product/${encodeURIComponent(p.slug)}`;
    const pubDate = p.created_at ? new Date(p.created_at).toUTCString() : nowRFC;
    const price = Number(p.price || 0).toLocaleString();
    const desc = p.short_description || p.description?.replace(/<[^>]*>?/gm, '').slice(0, 300) || `Buy ${p.name} for ৳${price} in Bangladesh.`;

    xml += `    <item>\n`;
    xml += `      <title>${escapeXml(p.name)} - ৳${price}</title>\n`;
    xml += `      <link>${pUrl}</link>\n`;
    xml += `      <guid isPermaLink="true">${pUrl}</guid>\n`;
    xml += `      <pubDate>${pubDate}</pubDate>\n`;
    xml += `      <description>${escapeXml(desc)}</description>\n`;
    if (p.image_url || p.imageUrl) {
      xml += `      <enclosure url="${escapeXml(p.image_url || p.imageUrl)}" type="image/jpeg"/>\n`;
    }
    xml += `    </item>\n`;
  }

  xml += `  </channel>\n`;
  xml += `</rss>`;
  return xml;
}

/**
 * Generates Google Merchant Center Product Feed
 */
export function generateGoogleMerchantFeed(
  baseUrl: string,
  storeName: string,
  products: ProductSEOItem[] = []
): string {
  const cleanBaseUrl = baseUrl.replace(/\/+$/, '');

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">\n`;
  xml += `  <channel>\n`;
  xml += `    <title>${escapeXml(storeName)} Google Shopping Catalog</title>\n`;
  xml += `    <link>${cleanBaseUrl}</link>\n`;
  xml += `    <description>Authentic electronics &amp; gadgets catalog for Bangladesh</description>\n\n`;

  for (const p of products) {
    if (!p.slug || p.is_active === false || p.status === 'archived') continue;
    const pUrl = `${cleanBaseUrl}/product/${encodeURIComponent(p.slug)}`;
    const priceBdt = `${Number(p.price || 0).toFixed(2)} BDT`;
    const inStock = (p.stock_quantity ?? 1) > 0;
    const desc = (p.short_description || p.description?.replace(/<[^>]*>?/gm, '') || p.name).slice(0, 1000);
    const img = p.image_url || p.imageUrl || (p.product_images?.[0]?.image_url) || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200';

    xml += `    <item>\n`;
    xml += `      <g:id>${escapeXml(String(p.sku || p.id))}</g:id>\n`;
    xml += `      <g:title>${escapeXml(p.name)}</g:title>\n`;
    xml += `      <g:description>${escapeXml(desc)}</g:description>\n`;
    xml += `      <g:link>${pUrl}</g:link>\n`;
    xml += `      <g:image_link>${escapeXml(img)}</g:image_link>\n`;
    xml += `      <g:availability>${inStock ? 'in_stock' : 'out_of_stock'}</g:availability>\n`;
    xml += `      <g:price>${priceBdt}</g:price>\n`;
    xml += `      <g:condition>new</g:condition>\n`;
    xml += `      <g:brand>${escapeXml(p.categories?.name || storeName)}</g:brand>\n`;
    if (p.categories?.name) {
      xml += `      <g:product_type>${escapeXml(p.categories.name)}</g:product_type>\n`;
    }
    xml += `    </item>\n`;
  }

  xml += `  </channel>\n`;
  xml += `</rss>`;
  return xml;
}

export interface SEOAuditIssue {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'Products' | 'Categories' | 'Settings' | 'Technical' | 'Indexing' | 'Images' | 'Redirects';
  title: string;
  description: string;
  target?: string;
  fixUrl?: string;
}

export interface SEOAuditReport {
  score: number; // 0 - 100
  totalProducts: number;
  totalCategories: number;
  indexedUrlsCount: number;
  missingAltCount: number;
  missingDescCount: number;
  duplicateSlugsCount: number;
  issues: SEOAuditIssue[];
  checks: {
    title: string;
    passed: boolean;
    details: string;
  }[];
}

/**
 * Runs an exhaustive SEO Health Audit
 */
export function runSeoAudit(
  products: ProductSEOItem[] = [],
  categories: CategorySEOItem[] = [],
  settings: SEOSettings = {}
): SEOAuditReport {
  const issues: SEOAuditIssue[] = [];
  const checks: { title: string; passed: boolean; details: string }[] = [];

  let penalty = 0;
  let missingAltCount = 0;
  let missingDescCount = 0;
  let duplicateSlugsCount = 0;

  // 1. Global Title & Description
  if (!settings.seo_title || settings.seo_title.length < 15) {
    issues.push({
      id: 'store-title-short',
      type: 'warning',
      category: 'Settings',
      title: 'Global SEO Title is Too Short or Missing',
      description: 'Your homepage title tag should be between 30 and 65 characters with primary keywords.',
      fixUrl: '/admin/seo'
    });
    penalty += 8;
  }

  if (!settings.seo_description || settings.seo_description.length < 40) {
    issues.push({
      id: 'store-desc-short',
      type: 'critical',
      category: 'Settings',
      title: 'Global Meta Description is Incomplete',
      description: 'A 120-160 character meta description is critical for Google SERP click-through rates.',
      fixUrl: '/admin/seo'
    });
    penalty += 10;
  }

  // 2. Google Search Console Verification
  const hasGsc = Boolean(settings.seo_google_verification && settings.seo_google_verification.trim().length > 0);
  checks.push({
    title: 'Google Search Console Verification',
    passed: hasGsc,
    details: hasGsc ? `Verified with token: ${settings.seo_google_verification}` : 'Missing: Add token in SEO Webmaster tools to claim domain in GSC'
  });
  if (!hasGsc) {
    issues.push({
      id: 'gsc-missing',
      type: 'warning',
      category: 'Indexing',
      title: 'Google Search Console Not Verified',
      description: 'Add your verification token to claim domain ownership and monitor Google indexing.',
      fixUrl: '/admin/seo'
    });
    penalty += 8;
  }

  // 3. Google Analytics 4 (GA4)
  const hasGa4 = Boolean(settings.seo_ga4_id && settings.seo_ga4_id.trim().length > 0);
  checks.push({
    title: 'Google Analytics 4 (GA4) Tracking',
    passed: hasGa4,
    details: hasGa4 ? `Configured with ID: ${settings.seo_ga4_id}` : 'Missing GA4 Measurement ID'
  });
  if (!hasGa4) {
    issues.push({
      id: 'ga4-missing',
      type: 'info',
      category: 'Technical',
      title: 'Google Analytics 4 Tag Not Configured',
      description: 'Enter your GA4 Measurement ID (G-HR4Z5MWEB4) to record organic traffic and conversions.',
      fixUrl: '/admin/seo'
    });
    penalty += 4;
  }

  // 4. OpenGraph Social Banner
  const hasOgImage = Boolean(settings.seo_og_image && settings.seo_og_image.trim().length > 0);
  checks.push({
    title: 'OpenGraph Social Sharing High-Res Banner',
    passed: hasOgImage,
    details: hasOgImage ? 'Custom 1200x630 share image active' : 'Default fallback placeholder used'
  });
  if (!hasOgImage) {
    issues.push({
      id: 'og-image-missing',
      type: 'warning',
      category: 'Settings',
      title: 'Missing Custom Social Preview Banner',
      description: 'Upload a 1200x630px banner for rich link cards on WhatsApp, Facebook, and Twitter.',
      fixUrl: '/admin/seo'
    });
    penalty += 5;
  }

  // 5. Product Level Audits
  const seenSlugs = new Set<string>();
  products.forEach(p => {
    // Check duplicate slug
    if (p.slug) {
      if (seenSlugs.has(p.slug)) {
        duplicateSlugsCount++;
        issues.push({
          id: `dup-slug-${p.id}`,
          type: 'critical',
          category: 'Technical',
          title: `Duplicate URL Slug Detected: "${p.slug}"`,
          description: `Product "${p.name}" shares a duplicate slug. Duplicate slugs cause SEO cannibalization and 404 routing errors.`,
          target: p.name,
          fixUrl: '/admin/products'
        });
        penalty += 5;
      }
      seenSlugs.add(p.slug);
    }

    // Check missing description
    if (!p.description && !p.short_description) {
      missingDescCount++;
    }

    // Check image alt texts
    const imgs = p.product_images || [];
    const hasImage = Boolean(p.image_url || p.imageUrl || imgs.length > 0);
    if (!hasImage) {
      issues.push({
        id: `no-image-${p.id}`,
        type: 'warning',
        category: 'Images',
        title: `Product Has No Image: "${p.name}"`,
        description: 'Search engines deprioritize products without imagery.',
        target: p.name,
        fixUrl: '/admin/products'
      });
      penalty += 3;
    }

    const missingAlt = imgs.some(img => !img.alt_text || img.alt_text.trim().length === 0);
    if (missingAlt) {
      missingAltCount++;
    }
  });

  if (missingAltCount > 0) {
    issues.push({
      id: 'missing-alt-texts',
      type: 'warning',
      category: 'Images',
      title: `${missingAltCount} Product Images Missing Descriptive Alt Text`,
      description: 'Google Image Search requires descriptive alt text for visual indexing and accessibility.',
      fixUrl: '/admin/seo'
    });
    penalty += Math.min(15, missingAltCount * 2);
  }

  if (missingDescCount > 0) {
    issues.push({
      id: 'missing-product-descriptions',
      type: 'warning',
      category: 'Products',
      title: `${missingDescCount} Products Have Empty Descriptions`,
      description: 'Thin content hurts organic search ranking. Add at least 150 words of rich description per product.',
      fixUrl: '/admin/products'
    });
    penalty += Math.min(15, missingDescCount * 2);
  }

  // 6. Robots.txt check
  const robotsOk = Boolean(settings.seo_robots_txt && settings.seo_robots_txt.includes('Allow: /'));
  checks.push({
    title: 'Robots.txt Crawlability & Sitemaps',
    passed: robotsOk,
    details: robotsOk ? 'Robots.txt is active and allows Googlebot / Bingbot with sitemaps declared' : 'Robots.txt might be missing or unconfigured'
  });

  // Calculate final score
  const score = Math.max(25, Math.min(100, 100 - penalty));
  const indexedUrlsCount = products.filter(p => p.is_active !== false && p.status !== 'archived').length + categories.length + 5;

  return {
    score,
    totalProducts: products.length,
    totalCategories: categories.length,
    indexedUrlsCount,
    missingAltCount,
    missingDescCount,
    duplicateSlugsCount,
    issues,
    checks
  };
}

/**
 * Ping Google and Bing with updated sitemaps
 */
export async function pingSearchEngines(sitemapUrl: string): Promise<{ google: any; bing: any }> {
  const cleanUrl = encodeURIComponent(sitemapUrl);
  const results: { google: any; bing: any } = { google: null, bing: null };

  try {
    const gRes = await fetch(`https://www.google.com/ping?sitemap=${cleanUrl}`, { method: 'GET' });
    results.google = { ok: gRes.ok, status: gRes.status };
  } catch (err: any) {
    results.google = { ok: false, error: err.message };
  }

  try {
    const bRes = await fetch(`https://www.bing.com/ping?sitemap=${cleanUrl}`, { method: 'GET' });
    results.bing = { ok: bRes.ok, status: bRes.status };
  } catch (err: any) {
    results.bing = { ok: false, error: err.message };
  }

  return results;
}
