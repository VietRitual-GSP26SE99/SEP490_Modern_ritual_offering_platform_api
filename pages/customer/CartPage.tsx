import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartService, CartApi } from '../../services/cartService';
import { checkoutService, CheckoutSummary } from '../../services/checkoutService';
import { getCurrentUser } from '../../services/auth';
import toast from '../../services/toast';

const MAX_CART_ITEM_QUANTITY = 50;

const CartPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartApi | null>(null);
  const [checkoutSummary, setCheckoutSummary] = useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<number | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  // Check authentication
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      console.log(' User not authenticated, redirecting to login');
      navigate('/auth?redirect=/cart');
      return;
    }
    setIsCheckingAuth(false);
  }, [navigate]);

  // Fetch cart from API
  useEffect(() => {
    if (isCheckingAuth) return;
    
    const fetchCart = async () => {
      try {
        console.log('🛒 Fetching cart...');
        const cartData = await cartService.getCart();
        setCart(cartData);
        console.log('✅ Cart loaded:', cartData);

        // Fetch checkout summary for accurate pricing
        if (cartData && cartData.cartItems && cartData.cartItems.length > 0) {
          console.log('💰 Fetching checkout summary...');
          const cartItemIds = cartData.cartItems.map(item => item.cartItemId);
          const summary = await checkoutService.getSummary(cartItemIds);
          if (summary) {
            setCheckoutSummary(summary);
            console.log('✅ Checkout summary loaded:', summary);
          }
        } else {
          setCheckoutSummary(null);
        }

      } catch (error) {
        console.error('❌ Failed to fetch cart:', error);
        toast.error('Không thể tải giỏ hàng');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, [isCheckingAuth]);

  // Helper function to refresh checkout summary
  const refreshCheckoutSummary = async (cartData: CartApi | null) => {
    if (cartData && cartData.cartItems && cartData.cartItems.length > 0) {
      try {
        const cartItemIds = cartData.cartItems.map(item => item.cartItemId);
        const summary = await checkoutService.getSummary(cartItemIds);
        if (summary) {
          setCheckoutSummary(summary);
        }
      } catch (error) {
        console.error('❌ Failed to refresh checkout summary:', error);
      }
    } else {
      setCheckoutSummary(null);
    }
  };

  const updateQuantity = async (cartItemId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(cartItemId);
      return;
    }

    if (newQuantity > MAX_CART_ITEM_QUANTITY) {
      toast.info(`Số lượng tối đa cho mỗi sản phẩm là ${MAX_CART_ITEM_QUANTITY}.`);
      return;
    }

    setUpdating(cartItemId);
    try {
      console.log('📝 Updating quantity:', { cartItemId, newQuantity });
      // API endpoint expects 'itemId' parameter even though response has 'cartItemId'
      const success = await cartService.updateCartItem({ cartItemId: cartItemId, quantity: newQuantity });
      
      if (success) {
        // Re-fetch cart from server to ensure sync
        console.log('🔄 Re-fetching cart after update...');
        const updatedCart = await cartService.getCart();
        setCart(updatedCart);
        
        // Refresh checkout summary with new prices
        await refreshCheckoutSummary(updatedCart);
        
        toast.success('Đã cập nhật số lượng');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error('Không thể cập nhật số lượng');
      }
    } catch (error) {
      console.error(' Failed to update quantity:', error);
      toast.error('Đã xảy ra lỗi');
    } finally {
      setUpdating(null);
    }
  };

  const removeItem = async (cartItemId: number) => {
    const result = await toast.confirm({
      title: 'Xóa sản phẩm?',
      text: 'Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?',
      icon: 'warning',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    setUpdating(cartItemId);
    try {
      console.log('🗑️ Removing item:', cartItemId);
      const success = await cartService.removeCartItem(cartItemId);
      
      if (success) {
        // Re-fetch cart from server to ensure sync
        console.log('🔄 Re-fetching cart after delete...');
        const updatedCart = await cartService.getCart();
        setCart(updatedCart);
        
        // Refresh checkout summary with new prices
        await refreshCheckoutSummary(updatedCart);
        
        toast.success('Đã xóa sản phẩm');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error('Không thể xóa sản phẩm');
      }
    } catch (error: any) {
      // If 404, item might already be deleted, re-fetch cart
      if (error.message && error.message.includes('404')) {
        console.log('⚠️ Item not found (404), re-fetching cart...');
        const updatedCart = await cartService.getCart();
        setCart(updatedCart);
        
        // Refresh checkout summary with new prices
        await refreshCheckoutSummary(updatedCart);
        
        toast.info('Sản phẩm đã được xóa');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        console.error(' Failed to remove item:', error);
        toast.error('Đã xảy ra lỗi');
      }
    } finally {
      setUpdating(null);
    }
  };

  const clearAllCart = async () => {
    const result = await toast.confirm({
      title: 'Xóa toàn bộ giỏ hàng?',
      text: 'Bạn có chắc chắn muốn xóa tất cả sản phẩm khỏi giỏ hàng?',
      icon: 'warning',
      confirmButtonText: 'Xóa tất cả',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    setUpdating(-1); // Use -1 to indicate clearing all
    try {
      console.log(' Clearing cart...');
      const success = await cartService.clearCart();
      
      if (success) {
        // Re-fetch cart from server to ensure sync
        console.log('🔄 Re-fetching cart after clear...');
        const updatedCart = await cartService.getCart();
        setCart(updatedCart);
        
        // Refresh checkout summary (will clear it since cart is empty)
        await refreshCheckoutSummary(updatedCart);
        
        toast.success('Đã xóa toàn bộ giỏ hàng');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error('Không thể xóa giỏ hàng');
      }
    } catch (error) {
      console.error(' Failed to clear cart:', error);
      toast.error('Đã xảy ra lỗi');
    } finally {
      setUpdating(null);
    }
  };

  if (isCheckingAuth || loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-slate-600">Đang tải giỏ hàng...</p>
        </div>
      </div>
    );
  }

  const cartItems = cart?.cartItems || [];
  
  // Use checkout summary if available, otherwise calculate locally
  const subtotal = checkoutSummary?.subTotal || cart?.subtotal || 0;
  const shipping = checkoutSummary?.shippingFee !== undefined ? checkoutSummary.shippingFee : (subtotal > 0 ? 50000 : 0);
  const discount = checkoutSummary?.totalDiscount || 0;
  const total = checkoutSummary?.totalAmount || (subtotal + shipping - discount);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-display font-black text-primary">Giỏ Hàng</h1>
        {cartItems.length > 0 && (
          <button
            onClick={clearAllCart}
            disabled={updating !== null}
            className="text-red-500 font-bold text-sm hover:text-red-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
             Xóa tất cả
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-6">
          {cartItems.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gold/10 text-center">
              <p className="text-slate-500 text-lg mb-6">Giỏ hàng của bạn trống</p>
              <button 
                onClick={() => onNavigate('/shop')}
                className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-bold hover:bg-primary/5 transition-all"
              >
                Tiếp tục mua sắm
              </button>
            </div>
          ) : (
            cartItems.map(item => {
              const isUpdating = updating === item.cartItemId;
              return (
                <div key={item.cartItemId} className="bg-white p-6 rounded-2xl border border-gold/10 shadow-sm hover:shadow-lg transition-all">
                  <div className="flex gap-6">
                    <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                      {item.imageUrl ? (
                        <img 
                          src={item.imageUrl} 
                          alt={item.packageName} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement!.innerHTML = '<div class="text-slate-400 text-xs text-center p-2">No Image</div>';
                          }}
                        />
                      ) : (
                        <div className="text-slate-400 text-xs text-center p-2">No Image</div>
                      )}
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-primary mb-1">{item.packageName}</h3>
                        <p className="text-sm text-slate-500 mb-2">{item.variantName}</p>
                        <p className="text-2xl font-black text-gold">{item.price.toLocaleString()}đ</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-2">
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                            disabled={isUpdating}
                            className="w-8 h-8 rounded bg-white text-primary font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={MAX_CART_ITEM_QUANTITY}
                            value={isUpdating ? '' : item.quantity}
                            onChange={(e) => {
                              const newValue = parseInt(e.target.value);
                              if (!isNaN(newValue) && newValue > 0 && newValue <= MAX_CART_ITEM_QUANTITY) {
                                updateQuantity(item.cartItemId, newValue);
                              } else if (!isNaN(newValue) && newValue > MAX_CART_ITEM_QUANTITY) {
                                toast.info(`Số lượng tối đa cho mỗi sản phẩm là ${MAX_CART_ITEM_QUANTITY}.`);
                              }
                            }}
                            disabled={isUpdating}
                            className="w-12 text-center font-bold text-primary bg-transparent border-none focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder={isUpdating ? '...' : ''}
                          />
                          <button 
                            onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                            disabled={isUpdating || item.quantity >= MAX_CART_ITEM_QUANTITY}
                            className="w-8 h-8 rounded bg-white text-primary font-bold hover:bg-primary hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            +
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => onNavigate(`/checkout?cartItemId=${item.cartItemId}`)}
                            disabled={isUpdating}
                            className="text-primary font-bold text-sm hover:text-primary/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Thanh toán
                          </button>
                          <span className="text-slate-300">|</span>
                          <button 
                            onClick={() => removeItem(item.cartItemId)}
                            disabled={isUpdating}
                            className="text-red-500 font-bold text-sm hover:text-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isUpdating ? 'Đang xử lý...' : 'Xóa'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Order Summary */}
        {cartItems.length > 0 && (
          <div className="bg-white p-8 rounded-3xl border border-gold/10 shadow-sm h-fit sticky top-32">
            <h2 className="text-xl font-bold text-primary mb-6">Tóm tắt đơn hàng</h2>
            
            <div className="space-y-3 pb-6 border-b border-gold/10">
              <div className="flex justify-between text-slate-600">
                <span>Tạm tính</span>
                <span className="font-semibold">{subtotal.toLocaleString()}đ</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Phí vận chuyển</span>
                <span className="font-semibold">{shipping.toLocaleString()}đ</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Giảm giá</span>
                  <span className="font-semibold text-green-600">-{discount.toLocaleString()}đ</span>
                </div>
              )}
            </div>

            <div className="my-6 pt-6 flex justify-between text-2xl font-black text-primary">
              <span>Tổng cộng</span>
              <span className="text-gold">{total.toLocaleString()}đ</span>
            </div>

            <button 
              onClick={() => {
                // Thanh toán item đầu tiên
                if (cartItems.length > 0) {
                  onNavigate(`/checkout?cartItemId=${cartItems[0].cartItemId}`);
                }
              }}
              disabled={updating !== null || cartItems.length === 0}
              className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thanh toán
            </button>
            
            <button 
              onClick={() => onNavigate('/shop')}
              className="w-full border-2 border-primary text-primary py-3 rounded-lg font-bold hover:bg-primary/5 transition-all"
            >
              Tiếp tục mua sắm
            </button>

            <div className="mt-6 p-4 bg-gold/10 rounded-lg text-sm text-slate-600 space-y-2">
              <p className="font-bold text-primary">Thông tin đơn hàng</p>
              <p>✓ Giao hàng trong 24 giờ</p>
              <p>✓ Miễn phí đổi trả trong 7 ngày</p>
              <p>✓ Hỗ trợ 24/7</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
