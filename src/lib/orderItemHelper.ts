/**
 * Helper to resolve product image and details from order items cleanly
 */

const FALLBACK_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80';

export function resolveOrderItemImage(item: any): string {
  if (!item) return FALLBACK_PRODUCT_IMAGE;

  // 1. Direct snapshot stored on order item
  if (item.product_image_snapshot && typeof item.product_image_snapshot === 'string' && item.product_image_snapshot.trim()) {
    const snap = item.product_image_snapshot.trim();
    if (snap.startsWith('http://') || snap.startsWith('https://')) return snap;
    // Storage path fallback
    if (snap.length > 5) {
      return `https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80`;
    }
  }

  // 2. Direct product_images relation
  const prod = item.products || item.product;
  if (prod) {
    if (Array.isArray(prod.product_images) && prod.product_images.length > 0) {
      const primary = prod.product_images.find((img: any) => img.is_primary);
      const targetImg = primary || prod.product_images[0];
      if (targetImg?.image_url) return targetImg.image_url;
    }

    if (Array.isArray(prod.images) && prod.images.length > 0 && typeof prod.images[0] === 'string') {
      return prod.images[0];
    }

    if (prod.image_url) return prod.image_url;
    if (prod.imageUrl) return prod.imageUrl;
  }

  // 3. Direct property fallback
  if (item.image_url) return item.image_url;
  if (item.imageUrl) return item.imageUrl;
  if (item.image) return item.image;

  return FALLBACK_PRODUCT_IMAGE;
}

export function resolveOrderItemName(item: any): string {
  if (!item) return 'Product Item';
  return item.product_name_snapshot || item.products?.name || item.product?.name || item.name || 'Product Item';
}

export function resolveOrderItemSku(item: any): string {
  if (!item) return 'N/A';
  return item.products?.sku || item.product?.sku || item.sku || 'N/A';
}
