import { supabase } from './supabase';
import { wishlistItems } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { ensureCustomerRecord } from './customer';

export type WishlistItem = InferSelectModel<typeof wishlistItems> & {
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    comparePrice?: string | null;
    stockQuantity?: number;
    description?: string | null;
    status?: string;
  };
};

export async function getWishlist(userIdOrCustomerId: string): Promise<{ wishlistId: string; items: WishlistItem[] }> {
  if (!userIdOrCustomerId) {
    return { wishlistId: '', items: [] };
  }

  try {
    const validCustomerId = await ensureCustomerRecord(userIdOrCustomerId);

    // 1. Get or create wishlist for customer
    let { data: wishlist } = await supabase
      .from('wishlists')
      .select('id')
      .eq('customer_id', validCustomerId)
      .maybeSingle();

    if (!wishlist) {
      const { data: newWishlist, error: insertError } = await supabase
        .from('wishlists')
        .insert({ customer_id: validCustomerId })
        .select('id')
        .single();

      if (insertError) {
        // Fallback: If conflict or error, try query once more
        const { data: retryWishlist } = await supabase
          .from('wishlists')
          .select('id')
          .eq('customer_id', validCustomerId)
          .maybeSingle();
        if (retryWishlist) {
          wishlist = retryWishlist;
        } else {
          console.warn('Could not create/fetch wishlist in database:', insertError.message);
          return { wishlistId: '', items: [] };
        }
      } else {
        wishlist = newWishlist;
      }
    }

    if (!wishlist?.id) {
      return { wishlistId: '', items: [] };
    }

    // 2. Fetch items
    const { data: items, error: itemsError } = await supabase
      .from('wishlist_items')
      .select(`
        *,
        product:products(id, name, slug, price, compare_price, stock_quantity, description, status)
      `)
      .eq('wishlist_id', wishlist.id);

    if (itemsError) {
      console.warn('Wishlist items fetch warning:', itemsError.message);
      return { wishlistId: wishlist.id, items: [] };
    }

    const formattedItems = (items || []).map((item: any) => ({
      id: item.id,
      wishlistId: item.wishlist_id,
      productId: item.product_id,
      createdAt: item.created_at,
      product: {
        id: item.product?.id || item.product_id,
        name: item.product?.name || 'Product',
        slug: item.product?.slug || item.product_id,
        price: item.product?.price || '0',
        comparePrice: item.product?.compare_price,
        stockQuantity: item.product?.stock_quantity ?? 10,
        description: item.product?.description,
        status: item.product?.status || 'active',
      }
    }));

    return { wishlistId: wishlist.id, items: formattedItems };
  } catch (err) {
    console.error('getWishlist handled error:', err);
    return { wishlistId: '', items: [] };
  }
}

export async function addToWishlist(customerId: string, productId: string) {
  // Ensure wishlist exists
  const { wishlistId } = await getWishlist(customerId);
  if (!wishlistId) {
    throw new Error('Wishlist could not be initialized');
  }

  // Check if already in wishlist
  const { data: existing } = await supabase
    .from('wishlist_items')
    .select('id')
    .eq('wishlist_id', wishlistId)
    .eq('product_id', productId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const { data, error } = await supabase
    .from('wishlist_items')
    .insert({
      wishlist_id: wishlistId,
      product_id: productId,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromWishlist(customerId: string, productId: string) {
  const { wishlistId } = await getWishlist(customerId);
  if (!wishlistId) return;

  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('wishlist_id', wishlistId)
    .eq('product_id', productId);

  if (error) throw error;
}

export async function removeWishlistItemById(itemId: string) {
  const { error } = await supabase
    .from('wishlist_items')
    .delete()
    .eq('id', itemId);

  if (error) throw error;
}
