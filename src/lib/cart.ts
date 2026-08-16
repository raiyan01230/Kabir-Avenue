import { supabase } from './supabase';
import { cartItems } from '../db/schema';
import { InferSelectModel } from 'drizzle-orm';
import { ensureCustomerRecord } from './customer';

export type CartItem = InferSelectModel<typeof cartItems> & {
  product: {
    name: string;
    price: string;
    imageUrl: string;
  }
};

export async function getCart(userIdOrCustomerId: string): Promise<{ cartId: string; items: CartItem[] }> {
  if (!userIdOrCustomerId) {
    return { cartId: '', items: [] };
  }

  try {
    // Ensure customer record exists in customers table
    const validCustomerId = await ensureCustomerRecord(userIdOrCustomerId);

    // 1. Get or create cart
    let { data: cart } = await supabase
      .from('carts')
      .select('id')
      .eq('customer_id', validCustomerId)
      .maybeSingle();

    if (!cart) {
      const { data: newCart, error: insertError } = await supabase
        .from('carts')
        .insert({ customer_id: validCustomerId })
        .select('id')
        .single();

      if (insertError) {
        // Retry query in case created concurrently
        const { data: retryCart } = await supabase
          .from('carts')
          .select('id')
          .eq('customer_id', validCustomerId)
          .maybeSingle();

        if (retryCart) {
          cart = retryCart;
        } else {
          console.warn('Cart creation warning:', insertError.message);
          return { cartId: '', items: [] };
        }
      } else {
        cart = newCart;
      }
    }

    if (!cart?.id) {
      return { cartId: '', items: [] };
    }

    // 2. Get items
    const { data: items, error: itemsError } = await supabase
      .from('cart_items')
      .select(`
        *,
        product:products(name, price)
      `)
      .eq('cart_id', cart.id);

    if (itemsError) {
      console.warn('Cart items fetch warning:', itemsError.message);
      return { cartId: cart.id, items: [] };
    }

    return { cartId: cart.id, items: (items as unknown as CartItem[]) || [] };
  } catch (err) {
    console.error('getCart handled error:', err);
    return { cartId: '', items: [] };
  }
}

export async function addToCart(cartId: string, productId: string, quantity: number, unitPrice: string) {
  // Check if item exists
  const { data: existingItem } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', productId)
    .single();

  if (existingItem) {
    return await supabase
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id);
  } else {
    return await supabase
      .from('cart_items')
      .insert({ cart_id: cartId, product_id: productId, quantity, unit_price: unitPrice });
  }
}

export async function addItemToCustomerCart(customerId: string, productId: string, unitPrice: string, quantity = 1) {
  const { cartId } = await getCart(customerId);
  return await addToCart(cartId, productId, quantity, unitPrice);
}

export async function removeItem(cartItemId: string) {
  return await supabase
    .from('cart_items')
    .delete()
    .eq('id', cartItemId);
}
