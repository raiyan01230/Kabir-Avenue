import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
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
export function setLinkTag(rel: string, href: string | undefined | null) {
  if (typeof document === 'undefined') return;
  if (!href) return;

  let element = document.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Applies full SEO metadata to the DOM in an SSR-safe manner
 */
export function applySEOMetadata(seo: SEOProps, globalSettings?: Record<string, string>) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;

  const storeName = globalSettings?.['store_name'] || 'HYPERDRIVE';
  const defaultTitle = globalSettings?.['seo_title'] || `${storeName} | Authentic Enthusiast Hardware Bangladesh`;
  const defaultDesc = globalSettings?.['seo_description'] || `Shop genuine enthusiast electronics, premium PC hardware, and gaming peripherals in Bangladesh at ${storeName}. Nationwide express delivery.`;
  const defaultKeywords = globalSettings?.['seo_keywords'] || 'ecommerce, bangladesh, hardware, pc components, graphics cards, mechanical keyboards, dhaka tech';
  const defaultOgImage = globalSettings?.['seo_og_image'] || globalSettings?.['og_image'] || globalSettings?.['store_logo'] || 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&auto=format&fit=crop&q=80';
  const twitterHandle = globalSettings?.['seo_twitter_handle'] || '@hyperdrive_bd';
  const siteUrl = globalSettings?.['seo_site_url'] || window.location.origin;

  // Infer title from path if seo.title is not explicitly provided
  let inferredTitle = seo?.title;
  if (!inferredTitle) {
    let path = window.location.pathname;
    if (window.location.hash && window.location.hash.includes('#')) {
      const hashPart = window.location.hash.split('#')[1] || '';
      path = hashPart.split('?')[0] || '/';
    }
    
    if (path === '/' || path === '' || path === '/index.html') {
      inferredTitle = 'Home';
    } else if (path.includes('/shop') || path.includes('/products')) {
      inferredTitle = 'Shop All Products';
    } else if (path.includes('/category')) {
      inferredTitle = 'Category Collection';
    } else if (path.includes('/cart')) {
      inferredTitle = 'Shopping Cart';
    } else if (path.includes('/checkout')) {
      inferredTitle = 'Secure Checkout';
    } else if (path.includes('/orders') || path.includes('/order-success')) {
      inferredTitle = 'My Order History';
    } else if (path.includes('/track')) {
      inferredTitle = 'Track Order';
    } else if (path.includes('/wishlist')) {
      inferredTitle = 'My Wishlist';
    } else if (path.includes('/account')) {
      inferredTitle = 'Customer Account';
    } else if (path.includes('/login')) {
      inferredTitle = 'Customer Login';
    } else if (path.includes('/admin')) {
      inferredTitle = 'Admin Management Dashboard';
    } else {
      inferredTitle = 'Storefront';
    }
  }

  const finalTitle = inferredTitle ? `${inferredTitle} | ${storeName}` : defaultTitle;
  const finalDesc = seo.description || defaultDesc;
  const finalKeywords = seo.keywords || defaultKeywords;
  const finalOgImage = seo.ogImage || defaultOgImage;
  const finalOgUrl = seo.ogUrl || window.location.href;
  const finalOgType = seo.ogType || 'website';
  const finalTwitterCard = seo.twitterCard || 'summary_large_image';

  // 1. Title
  document.title = finalTitle;

  // 2. Standard Meta
  setMetaTag('name', 'description', finalDesc);
  setMetaTag('name', 'keywords', finalKeywords);
  setMetaTag('name', 'author', storeName);
  setMetaTag('name', 'robots', seo.noIndex ? 'noindex, nofollow' : 'index, follow');

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
  setLinkTag('canonical', seo.canonicalUrl || finalOgUrl);

  // 6. Favicon if configured in settings
  const faviconUrl = globalSettings?.['store_favicon'] || globalSettings?.['favicon_url'] || globalSettings?.['favicon'];
  if (faviconUrl) {
    setLinkTag('icon', faviconUrl);
    setLinkTag('shortcut icon', faviconUrl);
    setLinkTag('apple-touch-icon', faviconUrl);

    if (typeof document !== 'undefined') {
      const existingIcons = document.querySelectorAll("link[rel*='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']");
      if (existingIcons.length > 0) {
        existingIcons.forEach(el => el.setAttribute('href', faviconUrl));
      } else {
        const link = document.createElement('link');
        link.rel = 'icon';
        link.href = faviconUrl;
        document.head.appendChild(link);
      }
    }
  }
}

/**
 * Inject Schema.org JSON-LD structured data for Google search ranking & rich snippets
 */
export function injectStructuredData(schemaObj: object) {
  if (typeof document === 'undefined') return;
  let scriptEl = document.querySelector('script#structured-data');
  if (!scriptEl) {
    scriptEl = document.createElement('script');
    scriptEl.id = 'structured-data';
    scriptEl.setAttribute('type', 'application/ld+json');
    document.head.appendChild(scriptEl);
  }
  scriptEl.textContent = JSON.stringify(schemaObj);
}

/**
 * Custom React hook for dynamic database-backed SEO
 */
export function useSEO(customSEO?: SEOProps) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const location = useLocation();

  useEffect(() => {
    let isMounted = true;

    fetch('/api/store/settings-map', { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (!isMounted) return;
        if (data && typeof data === 'object') {
          setSettings(data);
          applySEOMetadata(customSEO || {}, data);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        applySEOMetadata(customSEO || {}, {});
      });

    return () => {
      isMounted = false;
    };
  }, [location.pathname, customSEO?.title, customSEO?.description, customSEO?.ogImage]);

  return { settings };
}
