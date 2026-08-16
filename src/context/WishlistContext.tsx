import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  getWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
  WishlistItem,
} from '../lib/wishlist';

interface WishlistContextType {
  items: WishlistItem[];
  count: number;
  loading: boolean;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: { id: string; name: string; price: string; slug?: string }) => Promise<boolean>;
  removeItem: (productId: string) => Promise<void>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType>({
  items: [],
  count: 0,
  loading: false,
  isInWishlist: () => false,
  toggleWishlist: async () => false,
  removeItem: async () => {},
  refreshWishlist: async () => {},
});

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadWishlist = useCallback(async () => {
    if (!user) {
      // Check local storage for guest wishlist
      try {
        const stored = localStorage.getItem('hyperdrive_guest_wishlist');
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          setItems([]);
        }
      } catch {
        setItems([]);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await getWishlist(user.id);
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadWishlist();
  }, [loadWishlist]);

  const isInWishlist = useCallback(
    (productId: string) => {
      return items.some((item) => item.productId === productId || item.product?.id === productId);
    },
    [items]
  );

  const toggleWishlist = async (product: {
    id: string;
    name: string;
    price: string;
    slug?: string;
  }): Promise<boolean> => {
    const currentlyIn = isInWishlist(product.id);

    if (!user) {
      // Guest local wishlist
      let updated: WishlistItem[];
      if (currentlyIn) {
        updated = items.filter((i) => i.productId !== product.id && i.product?.id !== product.id);
      } else {
        const newItem: WishlistItem = {
          id: `guest_${Date.now()}_${product.id}`,
          wishlistId: 'guest',
          productId: product.id,
          createdAt: new Date(),
          product: {
            id: product.id,
            name: product.name,
            slug: product.slug || product.id,
            price: product.price,
            stockQuantity: 15,
            status: 'active',
          },
        };
        updated = [...items, newItem];
      }
      setItems(updated);
      localStorage.setItem('hyperdrive_guest_wishlist', JSON.stringify(updated));
      return !currentlyIn;
    }

    try {
      if (currentlyIn) {
        await apiRemoveFromWishlist(user.id, product.id);
        setItems((prev) => prev.filter((i) => i.productId !== product.id && i.product?.id !== product.id));
        return false;
      } else {
        await apiAddToWishlist(user.id, product.id);
        await loadWishlist();
        return true;
      }
    } catch (err) {
      console.error('Failed to update wishlist:', err);
      return currentlyIn;
    }
  };

  const removeItem = async (productId: string) => {
    if (!user) {
      const updated = items.filter((i) => i.productId !== productId && i.product?.id !== productId);
      setItems(updated);
      localStorage.setItem('hyperdrive_guest_wishlist', JSON.stringify(updated));
      return;
    }

    try {
      await apiRemoveFromWishlist(user.id, productId);
      setItems((prev) => prev.filter((i) => i.productId !== productId && i.product?.id !== productId));
    } catch (err) {
      console.error('Failed to remove item from wishlist:', err);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        items,
        count: items.length,
        loading,
        isInWishlist,
        toggleWishlist,
        removeItem,
        refreshWishlist: loadWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
