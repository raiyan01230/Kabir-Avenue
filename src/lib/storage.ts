import { supabase } from './supabase';

/**
 * Resolves an image URL from either a direct HTTP/HTTPS URL, a Supabase Storage path, or returns fallback.
 * @param pathOrUrl Storage path (e.g. 'products/uuid/img-1.webp') or full URL ('https://...')
 * @param bucket Default bucket name (defaults to 'ecommerce')
 * @returns Fully qualified public URL
 */
export function getStorageImageUrl(
  pathOrUrl?: string | null,
  bucket: string = 'ecommerce',
  fallback: string = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'
): string {
  if (!pathOrUrl || typeof pathOrUrl !== 'string' || pathOrUrl.trim() === '') {
    return fallback;
  }

  const trimmed = pathOrUrl.trim();

  // If it's already a full HTTP/HTTPS URL, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  try {
    // Generate public URL using Supabase Storage client
    const { data } = supabase.storage.from(bucket).getPublicUrl(trimmed);
    return data?.publicUrl || fallback;
  } catch (err) {
    console.warn(`Could not resolve storage path for ${trimmed}:`, err);
    return fallback;
  }
}

export interface ProductImageRecord {
  id?: string;
  product_id?: string;
  productId?: string;
  image_url?: string;
  imageUrl?: string;
  storage_path?: string | null;
  storagePath?: string | null;
  alt_text?: string | null;
  altText?: string | null;
  sort_order?: number;
  sortOrder?: number;
  is_primary?: boolean;
  isPrimary?: boolean;
  created_at?: string;
}

/**
 * Resolves a list of product images given a product and its related product_images records
 */
export function resolveProductImages(
  product?: { id?: string; image_url?: string; imageUrl?: string; images?: string[]; product_images?: any[]; productImages?: any[] } | null,
  productImagesList?: ProductImageRecord[]
): string[] {
  if (!product && (!productImagesList || productImagesList.length === 0)) {
    return ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'];
  }

  const rawList = productImagesList || product?.product_images || (product as any)?.productImages;

  // If product_images relational table rows exist, sort by sort_order and is_primary
  if (rawList && Array.isArray(rawList) && rawList.length > 0) {
    const sorted = [...rawList].sort((a: any, b: any) => {
      const aPrim = a.is_primary ?? a.isPrimary;
      const bPrim = b.is_primary ?? b.isPrimary;
      if (aPrim && !bPrim) return -1;
      if (!aPrim && bPrim) return 1;
      const aOrder = a.sort_order ?? a.sortOrder ?? 0;
      const bOrder = b.sort_order ?? b.sortOrder ?? 0;
      return aOrder - bOrder;
    });

    const urls = sorted
      .map((img: any) => {
        if (typeof img === 'string') {
          return getStorageImageUrl(img, 'ecommerce');
        }
        const pathOrUrl = img.image_url || img.imageUrl || img.storage_path || img.storagePath;
        return getStorageImageUrl(pathOrUrl, 'ecommerce');
      })
      .filter(Boolean);

    if (urls.length > 0) return urls;
  }

  // If product has an images array
  if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
    const urls = product.images.map((img) => getStorageImageUrl(img, 'ecommerce')).filter(Boolean);
    if (urls.length > 0) return urls;
  }

  // Fallback to product.image_url or product.imageUrl
  const singleUrl = product?.image_url || (product as any)?.imageUrl;
  if (singleUrl) {
    return [getStorageImageUrl(singleUrl, 'ecommerce')];
  }

  return ['https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&auto=format&fit=crop&q=80'];
}
