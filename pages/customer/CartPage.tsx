import React, { useState } from 'react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

const CartPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      name: 'Mâm Cúng Đầy Tháng - Gói Đặc Biệt',
      price: 2500000,
      quantity: 1,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmfCyEl04cwWpaZXOkMs7fYlLyWDwtMEnf5G_uRg4n59rYYy-eS9wUnZrHYzLXvLd-zB7Wywvxnqfs7atQBNPcPb0CX9zsIAFph9WRg5ftfGisqH7gXz-D7-nF4BPCRBH9xzV-AjamO-K9f2QSm6s-jXhCCf65fhW-ipfEanWxgipMRJdKxG-PPAOHocXYLGgXgSHkeNWg6ShHNmsrKGd0Y45BFWq9pVGAw52130misHEtU4NlZStzWGrrnAP4yAQCc31mez3LQfUs'
    },
    {
      id: '2',
      name: 'Mâm Cúng Tết Nguyên Đán',
      price: 1800000,
      quantity: 2,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmfCyEl04cwWpaZXOkMs7fYlLyWDwtMEnf5G_uRg4n59rYYy-eS9wUnZrHYzLXvLd-zB7Wywvxnqfs7atQBNPcPb0CX9zsIAFph9WRg5ftfGisqH7gXz-D7-nF4BPCRBH9xzV-AjamO-K9f2QSm6s-jXhCCf65fhW-ipfEanWxgipMRJdKxG-PPAOHocXYLGgXgSHkeNWg6ShHNmsrKGd0Y45BFWq9pVGAw52130misHEtU4NlZStzWGrrnAP4yAQCc31mez3LQfUs'
    }
  ]);

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setCartItems(cartItems.map(item => item.id === id ? { ...item, quantity } : item));
  };

  const removeItem = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = 50000;
  const tax = Math.round(subtotal * 0.1);
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
      <h1 className="text-4xl font-display font-black text-primary mb-12">Giỏ Hàng</h1>

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
            cartItems.map(item => (
              <div key={item.id} className="bg-white p-6 rounded-2xl border border-gold/10 shadow-sm hover:shadow-lg transition-all">
                <div className="flex gap-6">
                  <div className="w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-primary mb-2">{item.name}</h3>
                      <p className="text-2xl font-black text-gold">{item.price.toLocaleString()}đ</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-2">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded bg-white text-primary font-bold hover:bg-primary hover:text-white transition-all"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-bold text-primary">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded bg-white text-primary font-bold hover:bg-primary hover:text-white transition-all"
                        >
                          +
                        </button>
                      </div>
                      <button 
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 font-bold text-sm hover:text-red-700 transition-all"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
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
              <div className="flex justify-between text-slate-600">
                <span>Thuế (10%)</span>
                <span className="font-semibold">{tax.toLocaleString()}đ</span>
              </div>
            </div>

            <div className="my-6 pt-6 flex justify-between text-2xl font-black text-primary">
              <span>Tổng cộng</span>
              <span className="text-gold">{total.toLocaleString()}đ</span>
            </div>

            <button 
              onClick={() => onNavigate('/checkout')}
              className="w-full bg-primary text-white py-4 rounded-lg font-bold text-lg hover:bg-primary/90 transition-all mb-3"
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
              <p className="font-bold text-primary">ℹ️ Thông tin đơn hàng</p>
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
