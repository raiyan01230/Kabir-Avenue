import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string | string[];
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterSite?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
}

/**
 * SSR-safe helper to set or update a meta tag by name or property
 */
export function setMetaTag(attribute: 'name' | 'property', attrValue: string, content: string | undefined | null) {
  if (typeof document === 'undefined') return;
  if (!content && content !== '') return;

  let element = document.querySelector(`meta[${attribute}="${attrValue}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, attrValue);
    document.head.appendChild(element);
  }
  element.setAttribute('content', content);
}

/**
 * SSR-safe helper to set or update a link tag (e.g., canonical, icon)
 */
export function setLinkTag(rel: string, href: string | undefined | null, attributes?: Record<string, string>) {
  if (typeof document === 'undefined') return;
  if (!href) return;

  let selector = `link[rel="${rel}"]`;
  if (attributes?.hreflang) {
    selector += `[hreflang="${attributes.hreflang}"]`;
  }

  let element = document.querySelector(selector);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    if (attributes) {
      Object.entries(attributes).forEach(([k, v]) => element?.setAttribute(k, v));
    }
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Injects or updates a JSON-LD structured data script element safely
 */
export function injectStructuredData(schema: object | object[], scriptId: string = 'structured-data-jsonld') {
  if (typeof document === 'undefined') return;
  let script = document.getElementById(scriptId) as HTMLScriptElement | null;
  if (!script) {
    script = document.createElement('script');
    script.id = scriptId;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(schema, null, 2);
}

/**
 * Applies full SEO metadata to the DOM dynamically based on database store settings
 */
export function applySEOMetadata(seo: SEOProps, globalSettings?: Record<string, string>) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const storeName = globalSettings?.['store_name'] || 'Online Store BD';
  const defaultTitle = globalSettings?.['seo_title'] || `${storeName} | Best Online Gadget Store in Bangladesh`;
  const defaultDesc = globalSettings?.['seo_description'] || `Shop genuine electronics, gadgets, and tech accessories in Bangladesh at ${storeName}. Nationwide express delivery and official warranty.`;
  const defaultKeywords = globalSettings?.['seo_keywords'] || 'ecommerce bangladesh, gadget store, online shopping bd, genuine tech';
  const defaultOgImage = globalSettings?.['seo_og_image'] || globalSettings?.['store_logo'] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80';
  const twitterHandle = globalSettings?.['seo_twitter_handle'] || '@gadgetzone_bd';
  const siteUrl = globalSettings?.['seo_site_url'] || window.location.origin;
  const canonicalBase = globalSettings?.['seo_canonical_base'] || siteUrl;

  // Infer title from path if seo.title is not explicitly provided
  let inferredTitle = seo?.title;
  if (!inferredTitle) {
    let path = window.location.pathname;
    if (window.location.hash && window.location.hash.includes('#')) {
      const hashPart = window.location.hash.split('#')[1] || '';
      path = hashPart.split('?')[0] || '/';
    }
    
    if (path === '/' || path === '' || path === '/index.html') {
      inferredTitle = defaultTitle;
    } else if (path.includes('/shop') || path.includes('/products')) {
      inferredTitle = `Shop All Products | ${storeName}`;
    } else if (path.includes('/category')) {
      inferredTitle = `Category Collection | ${storeName}`;
    } else if (path.includes('/cart')) {
      inferredTitle = `Shopping Cart | ${storeName}`;
    } else if (path.includes('/checkout')) {
      inferredTitle = `Secure Checkout | ${storeName}`;
    } else if (path.includes('/orders') || path.includes('/order-success')) {
      inferredTitle = `My Order History | ${storeName}`;
    } else if (path.includes('/track')) {
      inferredTitle = `Track Order | ${storeName}`;
    } else if (path.includes('/wishlist')) {
      inferredTitle = `My Wishlist | ${storeName}`;
    } else if (path.includes('/account')) {
      inferredTitle = `Customer Account | ${storeName}`;
    } else if (path.includes('/login')) {
      inferredTitle = `Customer Login | ${storeName}`;
    } else if (path.includes('/admin')) {
      inferredTitle = `Admin Management Dashboard | ${storeName}`;
    } else {
      inferredTitle = `${storeName} Storefront`;
    }
  } else {
    // If title does not already include storeName, append it nicely
    if (!inferredTitle.includes(storeName) && !inferredTitle.includes('|') && !inferredTitle.includes('-')) {
      inferredTitle = `${inferredTitle} | ${storeName}`;
    }
  }

  const finalTitle = inferredTitle;
  const finalDesc = seo.description || defaultDesc;
  const rawKeywords = seo.keywords || defaultKeywords;
  const finalKeywords = Array.isArray(rawKeywords) ? rawKeywords.join(', ') : rawKeywords;
  const finalOgImage = seo.ogImage || defaultOgImage;
  const finalOgUrl = seo.ogUrl || window.location.href;
  const finalOgType = seo.ogType || 'website';
  const finalTwitterCard = seo.twitterCard || globalSettings?.['seo_twitter_card'] || 'summary_large_image';

  // 1. Title
  document.title = finalTitle;

  // 2. Standard Meta
  setMetaTag('name', 'description', finalDesc);
  setMetaTag('name', 'keywords', finalKeywords);
  setMetaTag('name', 'author', storeName);
  
  const robotsDirective = seo.noIndex 
    ? 'noindex, nofollow' 
    : (globalSettings?.['seo_robots_directive'] || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
  setMetaTag('name', 'robots', robotsDirective);
  setMetaTag('name', 'googlebot', robotsDirective);

  // 3. Open Graph (OG) Meta
  setMetaTag('property', 'og:title', finalTitle);
  setMetaTag('property', 'og:description', finalDesc);
  setMetaTag('property', 'og:image', finalOgImage);
  setMetaTag('property', 'og:url', finalOgUrl);
  setMetaTag('property', 'og:type', finalOgType);
  setMetaTag('property', 'og:site_name', storeName);

  // 4. Twitter Card Meta
  setMetaTag('name', 'twitter:card', finalTwitterCard);
  setMetaTag('name', 'twitter:title', finalTitle);
  setMetaTag('name', 'twitter:description', finalDesc);
  setMetaTag('name', 'twitter:image', finalOgImage);
  setMetaTag('name', 'twitter:site', twitterHandle);
  setMetaTag('name', 'twitter:creator', twitterHandle);

  // 5. Canonical Link
  const computedCanonical = seo.canonicalUrl || `${canonicalBase.replace(/\/+$/, '')}${window.location.pathname}${window.location.search}`;
  setLinkTag('canonical', computedCanonical);

  // 6. Favicon
  if (globalSettings?.['store_favicon']) {
    setLinkTag('icon', globalSettings['store_favicon']);
  }

  // 7. Webmaster Verification Tokens
  if (globalSettings?.['seo_google_verification']) {
    setMetaTag('name', 'google-site-verification', globalSettings['seo_google_verification']);
  }
  if (globalSettings?.['seo_bing_verification']) {
    setMetaTag('name', 'msvalidate.01', globalSettings['seo_bing_verification']);
  }

  // 8. Bangladesh Local SEO Geolocation Meta
  const geoRegion = globalSettings?.['seo_geo_region'] || 'BD-13';
  const geoPlacename = globalSettings?.['seo_geo_placename'] || 'Dhaka, Bangladesh';
  const geoPosition = globalSettings?.['seo_geo_position'] || '23.8103;90.4125';
  setMetaTag('name', 'geo.region', geoRegion);
  setMetaTag('name', 'geo.placename', geoPlacename);
  setMetaTag('name', 'geo.position', geoPosition);
  setMetaTag('name', 'ICBM', geoPosition.replace(';', ', '));
}

/**
 * Main React Hook for Dynamic SEO Management
 */
export function useSEO(customSEO?: SEOProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;
    fetch('/api/store/settings-map', { cache: 'no-store' })
      .then(res => res.json())
      .then(map => {
        if (isMounted && map) {
          setSettings(map);
          applySEOMetadata(customSEO || {}, map);
        }
      })
      .catch(() => {
        if (isMounted) {
          applySEOMetadata(customSEO || {});
        }
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, customSEO?.title, customSEO?.description, customSEO?.ogImage]);

  return { settings };
}
