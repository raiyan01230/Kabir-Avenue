import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, Check, Percent } from 'lucide-react';
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
    <div className="group bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden relative">
      {/* Elite Choice Badge */}
      <div className="absolute top-2 left-2 z-20 bg-[#e62e2d] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-sm">
        <Percent className="w-2.5 h-2.5" />
        <span>ELITE CHOICE</span>
      </div>

      {/* Wishlist Button (Kept but made subtle) */}
      <button
        type="button"
        onClick={handleWishlist}
        className={`absolute top-2 right-2 z-20 p-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
          inWishlist
            ? 'bg-rose-500 text-white'
            : 'bg-white/80 text-slate-400 hover:text-rose-500 hover:bg-white'
        }`}
        title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <Heart className={`w-3.5 h-3.5 ${inWishlist ? 'fill-white' : ''}`} />
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
        {isOutOfStock && (
          <span className="absolute bottom-2 left-2 bg-rose-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
            Out of Stock
          </span>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-2.5 sm:p-3 flex flex-col flex-grow justify-between space-y-2">
        <div className="space-y-1">
          <Link
            to={productUrl}
            className="font-medium text-[11px] sm:text-xs text-slate-800 line-clamp-2 hover:text-slate-600 transition leading-snug"
          >
            {product.sku ? `${product.sku} - ` : ''}{product.name}
          </Link>
        </div>

        {/* Price & Actions */}
        <div className="space-y-2.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[13px] sm:text-sm font-bold text-black">
              ৳{Number(product.price).toLocaleString()}
            </span>
            {comparePrice && Number(comparePrice) > Number(product.price) && (
              <span className="text-[10px] font-medium text-slate-400 line-through">
                ৳{Number(comparePrice).toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={loadingAction || isOutOfStock}
              onClick={handleAddToCart}
              className={`flex-1 py-1.5 px-1 border text-[11px] font-bold rounded transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                addedSuccess
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'border-slate-300 hover:border-slate-400 bg-white text-slate-800'
              }`}
            >
              {addedSuccess ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Added</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" />
                  <span>Add</span>
                </>
              )}
            </button>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={handleBuyNow}
              className="flex-1 py-1.5 px-1 bg-black hover:bg-slate-900 text-white text-[11px] font-bold rounded transition flex items-center justify-center text-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
