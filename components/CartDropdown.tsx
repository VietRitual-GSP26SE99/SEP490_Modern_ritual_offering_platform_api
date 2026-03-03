import React, { useState, useEffect } from 'react';
import { cartService, CartApi } from '../services/cartService';

interface CartDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCart: () => void;
  onNavigateToShop: () => void;
}

const CartDropdown: React.FC<CartDropdownProps> = ({ isOpen, onClose, onNavigateToCart, onNavigateToShop }) => {
  const [cart, setCart] = useState<CartApi | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      if (isOpen) {
        fetchCart();
      }
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [isOpen]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const cartData = await cartService.getCart();
      setCart(cartData);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const cartItems = cart?.cartItems || [];
  const displayItems = cartItems.slice(0, 5); // Show max 5 items
  const remainingCount = cartItems.length - displayItems.length;

  return (
    <div 
      className="absolute top-full right-0 mt-0 w-[400px] bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slideDown"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-bold text-slate-700">Sản Phẩm Mới Thêm</h3>
      </div>

      {/* Content */}
      {loading ? (
        <div className="px-4 py-12 text-center text-slate-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-2 text-sm">Đang tải...</p>
        </div>
      ) : cartItems.length === 0 ? (
        <div className="px-4 py-12 text-center">
          <p className="text-slate-500 text-sm mb-4">Chưa có sản phẩm nào</p>
          <button 
            onClick={() => {
              onNavigateToShop();
              onClose();
            }}
            className="text-primary text-sm font-bold hover:text-primary/80 transition-colors"
          >
            Mua sắm ngay →
          </button>
        </div>
      ) : (
        <>
          {/* Cart Items */}
          <div className="max-h-[400px] overflow-y-auto">
            {displayItems.map((item) => (
              <div 
                key={item.cartItemId}
                className="px-4 py-3 border-b border-gray-50 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => {
                  onNavigateToCart();
                  onClose();
                }}
              >
                <div className="flex gap-3">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.packageName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const parent = e.currentTarget.parentElement;
                          if (parent) {
                            parent.innerHTML = '<div class="w-full h-full flex items-center justify-center text-slate-300 text-xs">No Image</div>';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-slate-800 line-clamp-1 mb-1">
                      {item.packageName}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                      {item.variantName || 'Gói tiêu chuẩn'}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        x{item.quantity}
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {item.price.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {remainingCount > 0 && (
              <div className="px-4 py-2 text-center text-xs text-slate-500 border-b border-gray-50">
                {remainingCount} sản phẩm khác trong giỏ hàng
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-slate-50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-slate-600">Tổng tiền:</span>
              <span className="text-lg font-black text-primary">
                {(cart?.subtotal || 0).toLocaleString()}đ
              </span>
            </div>
            <button 
              onClick={() => {
                onNavigateToCart();
                onClose();
              }}
              className="w-full bg-primary text-white py-2.5 rounded-lg font-bold text-sm hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
            >
              Xem Giỏ Hàng ({cartItems.length})
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartDropdown;
