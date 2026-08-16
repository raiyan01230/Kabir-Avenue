import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, Zap, Check } from 'lucide-react';
import { Product } from '../lib/queries';
import { resolveProductImages } from '../lib/storage';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

export interface ProductCardProps {
  product: Product;
  onAddedToCart?: (productName: string) => void;
  key?: React.Key;
}

export default function ProductCard({ product, onAddedToCart }: ProductCardProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart, setBuyNow } = useCart();
  const navigate = useNavigate();
  const [loadingAction, setLoadingAction] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  const images = resolveProductImages(product, product.product_images);
  const primaryImg = images[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80';
  const secondaryImg = images[1] || primaryImg;
  const inWishlist = isInWishlist(product.id);
  const stockQty = Number(product.stock_quantity ?? (product as any).stockQuantity ?? 0);
  const isOutOfStock = stockQty <= 0;
  const categoryName = (product as any).categories?.name || (product as any).category?.name;
  const comparePrice = product.compare_price ?? (product as any).comparePrice;

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price,
      slug: product.slug,
    });
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;

    try {
      setLoadingAction(true);
      await addToCart(product, 1);
      setAddedSuccess(true);
      if (onAddedToCart) {
        onAddedToCart(product.name);
      }
      setTimeout(() => setAddedSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    setBuyNow(product, 1);
    navigate('/checkout?buyNow=1');
  };

  const productUrl = `/products/${product.slug || product.id}`;

  return (
    <div className="group bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Wishlist Button */}
      <button
        type="button"
        onClick={handleWishlist}
        className={`absolute top-3 right-3 z-20 p-2 rounded-full backdrop-blur-md transition-all shadow-xs ${
          inWishlist
            ? 'bg-rose-500 text-white'
            : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'
        }`}
        title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-4 h-4 ${inWishlist ? 'fill-white' : ''}`} />
      </button>

      {/* Product Image & Link */}
      <Link to={productUrl} className="block relative aspect-square overflow-hidden bg-slate-50">
        <img
          src={primaryImg}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        {images.length > 1 && (
          <img
            src={secondaryImg}
            alt={`${product.name} alternate view`}
            className="w-full h-full object-cover absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            loading="lazy"
          />
        )}

        {/* Stock Badge */}
        {isOutOfStock ? (
          <span className="absolute bottom-3 left-3 bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
            Out of Stock
          </span>
        ) : (
          categoryName && (
            <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-xs">
              {categoryName}
            </span>
          )
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <div className="space-y-1">
          {product.sku && (
            <p className="text-[10px] font-mono text-slate-400">SKU: {product.sku}</p>
          )}
          <Link
            to={productUrl}
            className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-slate-700 transition leading-snug"
          >
            {product.name}
          </Link>
        </div>

        {/* Price & Actions */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-slate-900">
              ৳{Number(product.price).toLocaleString()}
            </span>
            {comparePrice && Number(comparePrice) > Number(product.price) && (
              <span className="text-xs font-medium text-slate-400 line-through">
                ৳{Number(comparePrice).toLocaleString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loadingAction || isOutOfStock}
              onClick={handleAddToCart}
              className={`w-full py-2 px-2 border text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                addedSuccess
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-slate-900 hover:bg-slate-50 text-slate-800'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Cart</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="w-full py-2 px-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 shadow-xs text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
