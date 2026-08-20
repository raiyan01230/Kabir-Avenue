import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '../lib/queries';
import { resolveProductImages, getStorageImageUrl } from '../lib/storage';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';
import { ensureCustomerRecord } from '../lib/customer';

export interface CartItemData {
  id: string;
  productId: string;
  name: string;
  price: number;
  comparePrice?: number | null;
  imageUrl?: string;
  slug?: string;
  sku?: string;
  quantity: number;
  stockQuantity?: number;
  variant?: string | null;
  variantId?: string | null;
  variantSnapshot?: any;
}

export type CartItem = CartItemData;

interface CartContextType {
  items: CartItemData[];
  itemCount: number; // total units
  uniqueCount: number;
  subtotal: number;
  isCartLoading: boolean;
  addToCart: (product: Product | any, quantity?: number, variant?: any | null) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number, variantId?: string | null) => Promise<void>;
  removeFromCart: (productId: string, variantId?: string | null) => Promise<void>;
  clearCart: () => Promise<void>;
  buyNowItem: CartItemData | null;
  setBuyNow: (product: Product | any, quantity?: number, variant?: any | null) => CartItemData;
  clearBuyNow: () => void;
  getBuyNowItem: () => CartItemData | null;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_CART_KEY = 'store_cart_items_v2';
const LOCAL_BUY_NOW_KEY = 'store_buynow_item_v2';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItemData[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [buyNowItem, setBuyNowItemState] = useState<CartItemData | null>(() => {
    try {
      const saved = sessionStorage.getItem(LOCAL_BUY_NOW_KEY) || localStorage.getItem(LOCAL_BUY_NOW_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isCartLoading, setIsCartLoading] = useState(false);

  // Helper to persist local cart
  const saveLocalCart = (newItems: CartItemData[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.warn('LocalStorage save warning:', e);
    }
  };

  // Sync with Supabase for authenticated user
  const syncWithDatabase = useCallback(async () => {
    if (!user) return;
    try {
      setIsCartLoading(true);
      const customerId = await ensureCustomerRecord(
        user.id,
        user.email,
        user.displayName || user.user_metadata?.full_name
      );

      // 1. Get or create cart in DB
      let { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('customer_id', customerId)
        .maybeSingle();

      if (!cart) {
        const { data: newCart } = await supabase
          .from('carts')
          .insert({ customer_id: customerId })
          .select('id')
          .maybeSingle();
        cart = newCart;
      }

      if (!cart?.id) return;

      // 2. Fetch items from DB
      const { data: dbItems } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          unit_price,
          products (
            id,
            name,
            price,
            compare_price,
            slug,
            sku,
            stock_quantity,
            status,
            product_images (*)
          )
        `)
        .eq('cart_id', cart.id);

      if (dbItems && Array.isArray(dbItems) && dbItems.length > 0) {
        const mappedItems: CartItemData[] = dbItems
          .filter((row: any) => row.products && row.products.status !== 'archived')
          .map((row: any) => {
            const prod = row.products;
            const images = resolveProductImages(prod, prod.product_images);
            return {
              id: row.id,
              productId: prod.id,
              name: prod.name,
              price: parseFloat(row.unit_price || prod.price || '0'),
              comparePrice: prod.compare_price ? parseFloat(prod.compare_price) : null,
              imageUrl: images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
              slug: prod.slug,
              sku: prod.sku,
              quantity: row.quantity || 1,
              stockQuantity: prod.stock_quantity ?? 99,
              variant: null
            };
          });

        saveLocalCart(mappedItems);
      }
    } catch (err) {
      console.warn('Database cart sync warning:', err);
    } finally {
      setIsCartLoading(false);
    }
  }, [user]);

  // Initial load and auth change sync
  useEffect(() => {
    if (user) {
      syncWithDatabase();
    }
  }, [user, syncWithDatabase]);

  const addToCart = async (
    product: Product | any,
    quantity: number = 1,
    variant: string | null = null
  ): Promise<boolean> => {
    if (!product || !product.id) return false;

    const stock = Number(product.stock_quantity ?? (product as any).stockQuantity ?? 99);
    if (stock <= 0) {
      return false;
    }

    const price = parseFloat(product.price || '0');
    const images = resolveProductImages(product, product.product_images);
    const imageUrl = images[0] || product.imageUrl || product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80';

    const existingIndex = items.findIndex(
      (i) => i.productId === product.id && (i.variant || null) === (variant || null)
    );

    let updatedItems: CartItemData[];
    if (existingIndex > -1) {
      updatedItems = [...items];
      const newQty = Math.min(stock, updatedItems[existingIndex].quantity + quantity);
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: newQty,
        price,
        imageUrl: imageUrl || updatedItems[existingIndex].imageUrl,
        stockQuantity: stock
      };
    } else {
      const newItem: CartItemData = {
        id: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        productId: product.id,
        name: product.name,
        price,
        comparePrice: product.compare_price ? parseFloat(product.compare_price) : null,
        imageUrl,
        slug: product.slug,
        sku: product.sku,
        quantity: Math.min(stock, quantity),
        stockQuantity: stock,
        variant: variant || null
      };
      updatedItems = [newItem, ...items];
    }

    saveLocalCart(updatedItems);

    // Sync to DB in background if user is logged in
    if (user) {
      try {
        const customerId = await ensureCustomerRecord(user.id, user.email);
        const { data: cart } = await supabase
          .from('carts')
          .select('id')
          .eq('customer_id', customerId)
          .maybeSingle();

        if (cart?.id) {
          const { data: existingDbItem } = await supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('cart_id', cart.id)
            .eq('product_id', product.id)
            .maybeSingle();

          if (existingDbItem) {
            await supabase
              .from('cart_items')
              .update({ quantity: existingDbItem.quantity + quantity, unit_price: price.toString() })
              .eq('id', existingDbItem.id);
          } else {
            await supabase
              .from('cart_items')
              .insert({
                cart_id: cart.id,
                product_id: product.id,
                quantity,
                unit_price: price.toString()
              });
          }
        }
      } catch (dbErr) {
        console.warn('DB add to cart non-fatal error:', dbErr);
      }
    }

    return true;
  };

  const updateQuantity = async (
    productId: string,
    quantity: number,
    variant: string | null = null
  ) => {
    if (quantity <= 0) {
      await removeFromCart(productId, variant);
      return;
    }

    const updated = items.map((i) => {
      if (i.productId === productId && (i.variant || null) === (variant || null)) {
        const maxStock = i.stockQuantity ?? 99;
        return { ...i, quantity: Math.min(maxStock, quantity) };
      }
      return i;
    });

    saveLocalCart(updated);

    if (user) {
      try {
        const customerId = await ensureCustomerRecord(user.id, user.email);
        const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', customerId).maybeSingle();
        if (cart?.id) {
          await supabase
            .from('cart_items')
            .update({ quantity })
            .eq('cart_id', cart.id)
            .eq('product_id', productId);
        }
      } catch (err) {
        console.warn('DB update quantity warning:', err);
      }
    }
  };

  const removeFromCart = async (productId: string, variant: string | null = null) => {
    const updated = items.filter(
      (i) => !(i.productId === productId && (i.variant || null) === (variant || null))
    );
    saveLocalCart(updated);

    if (user) {
      try {
        const customerId = await ensureCustomerRecord(user.id, user.email);
        const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', customerId).maybeSingle();
        if (cart?.id) {
          await supabase
            .from('cart_items')
            .delete()
            .eq('cart_id', cart.id)
            .eq('product_id', productId);
        }
      } catch (err) {
        console.warn('DB remove item warning:', err);
      }
    }
  };

  const clearCart = async () => {
    saveLocalCart([]);

    if (user) {
      try {
        const customerId = await ensureCustomerRecord(user.id, user.email);
        const { data: cart } = await supabase.from('carts').select('id').eq('customer_id', customerId).maybeSingle();
        if (cart?.id) {
          await supabase.from('cart_items').delete().eq('cart_id', cart.id);
        }
      } catch (err) {
        console.warn('DB clear cart warning:', err);
      }
    }
  };

  const setBuyNow = (
    product: Product | any,
    quantity: number = 1,
    variant: string | null = null
  ): CartItemData => {
    const price = parseFloat(product.price || '0');
    const images = resolveProductImages(product, product.product_images);
    const imageUrl = images[0] || product.imageUrl || product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80';

    const item: CartItemData = {
      id: `buynow_${Date.now()}`,
      productId: product.id,
      name: product.name,
      price,
      comparePrice: product.compare_price ? parseFloat(product.compare_price) : null,
      imageUrl,
      slug: product.slug,
      sku: product.sku,
      quantity: Math.max(1, quantity),
      stockQuantity: Number(product.stock_quantity ?? (product as any).stockQuantity ?? 99),
      variant: variant || null
    };

    setBuyNowItemState(item);
    try {
      sessionStorage.setItem(LOCAL_BUY_NOW_KEY, JSON.stringify(item));
      localStorage.setItem(LOCAL_BUY_NOW_KEY, JSON.stringify(item));
    } catch (e) {
      console.warn('Could not save buy now session:', e);
    }

    return item;
  };

  const getBuyNowItem = (): CartItemData | null => {
    if (buyNowItem) return buyNowItem;
    try {
      const saved = sessionStorage.getItem(LOCAL_BUY_NOW_KEY) || localStorage.getItem(LOCAL_BUY_NOW_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBuyNowItemState(parsed);
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  };

  const clearBuyNow = () => {
    setBuyNowItemState(null);
    try {
      sessionStorage.removeItem(LOCAL_BUY_NOW_KEY);
      localStorage.removeItem(LOCAL_BUY_NOW_KEY);
    } catch {
      // ignore
    }
  };

  const itemCount = items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  const uniqueCount = items.length;
  const subtotal = items.reduce((sum, i) => sum + (i.price * (i.quantity || 1)), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        uniqueCount,
        subtotal,
        isCartLoading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        buyNowItem,
        setBuyNow,
        clearBuyNow,
        getBuyNowItem,
        refreshCart: syncWithDatabase
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
