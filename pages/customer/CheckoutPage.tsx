
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { checkoutService, CheckoutSummary } from '../../services/checkoutService';
import { getCurrentUser } from '../../services/auth';
import toast from '../../services/toast';

const CheckoutPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTimeSlot, setDeliveryTimeSlot] = useState('07:00:00');
  const [paymentMethod, setPaymentMethod] = useState('Vnpay');
  const [decorationNotes, setDecorationNotes] = useState<{ [key: number]: string }>({});

  const timeSlots = [
    { value: '07:00:00', label: '7:00 - 9:00 (Tý-Sửu)' },
    { value: '09:00:00', label: '9:00 - 11:00 (Dần-Mão)' },
    { value: '13:00:00', label: '13:00 - 15:00 (Tỵ-Ngọ)' },
    { value: '15:00:00', label: '15:00 - 17:00 (Mùi-Thân)' },
    { value: '17:00:00', label: '17:00 - 19:00 (Dậu-Tuất)' }
  ];

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      console.log(' User not authenticated, redirecting to login');
      navigate('/auth?redirect=/checkout');
      return;
    }
    setIsCheckingAuth(false);
  }, [navigate]);

  useEffect(() => {
    if (isCheckingAuth) return;

    const fetchSummary = async () => {
      const cartItemId = searchParams.get('cartItemId');
      
      if (!cartItemId) {
        toast.error('Không tìm thấy sản phẩm để thanh toán');
        navigate('/cart');
        return;
      }

      try {
        setLoading(true);
        const summaryData = await checkoutService.getSummary([
          parseInt(cartItemId)
        ]);
        
        if (summaryData) {
          setSummary(summaryData);
        } else {
          toast.error('Không thể tải thông tin thanh toán');
          navigate('/cart');
        }
      } catch (error) {
        console.error('❌ Failed to fetch checkout summary:', error);
        toast.error('Đã xảy ra lỗi');
        navigate('/cart');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [isCheckingAuth, searchParams, navigate]);

  const handleCheckout = async () => {
    if (!deliveryDate) {
      toast.error('Vui lòng chọn ngày giao hàng');
      return;
    }

    if (!summary) {
      toast.error('Không tìm thấy thông tin đơn hàng');
      return;
    }

    console.log(' Form state:', { deliveryDate, deliveryTimeSlot, paymentMethod });
    console.log(' Summary items:', summary.items);

    setProcessing(true);
    try {
      const checkoutRequest = {
        deliveryDate,
        deliveryTime: deliveryTimeSlot, 
        paymentMethod,
        items: summary.items.map(item => ({
          cartItemId: item.cartItemId,
          decorationNote: decorationNotes[item.cartItemId] || ''
        }))
      };
      
      console.log(' Checkout request data:', JSON.stringify(checkoutRequest, null, 2));
      
      const result = await checkoutService.processCheckout(checkoutRequest);

      console.log(' Checkout result:', result);

      if (result) {
        console.log(' Payment URL:', result.paymentUrl);
        console.log(' Order ID:', result.orderId);
        
        try {
          const returnUrl = await checkoutService.getPaymentReturnUrl();
          console.log(' Payment return URL:', returnUrl);
        } catch (returnUrlError) {
          console.warn(' Could not fetch payment return URL:', returnUrlError);
        }

        if (result.paymentUrl) {
          // Hiện toast trước khi redirect đến trang thanh toán
          toast.success('Đơn hàng đã được tạo! Đang chuyển đến trang thanh toán...');
          console.log(' Redirecting to payment URL...');
          
          // Delay nhỏ để user nhìn thấy toast
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          if (paymentMethod === 'Vnpay') {
            try {
              const vnpayResult = await checkoutService.initiateVnpayPayment();
              console.log(' VNPay initiation result:', vnpayResult);
              
              if (vnpayResult?.paymentUrl) {
                window.location.href = vnpayResult.paymentUrl;
                return;
              }
            } catch (vnpayError) {
              console.warn(' VNPay initiation failed, using checkout payment URL:', vnpayError);
            }
          }
          
          window.location.href = result.paymentUrl;
        } else {
          console.log(' No payment URL, processing transaction...');
          
          if (result.orderId) {
            try {
              const transactionResult = await checkoutService.processTransaction(result.orderId.toString());
              console.log(' Transaction result:', transactionResult);
            } catch (transactionError) {
              console.warn(' Transaction processing failed:', transactionError);
            }
          }
          
          // Toast thành công khi hoàn tất không cần thanh toán
          toast.success('Đặt hàng thành công!');
          navigate(`/tracking?orderId=${result.orderId}`);
        }
      } else {
        toast.error('Không thể xử lý đơn hàng. Vui lòng kiểm tra thông tin giao hàng và thử lại.');
      }
    } catch (error: any) {
      console.error(' Checkout failed:', error);
      
      if (error.message?.includes('500')) {
        toast.error('Lỗi hệ thống. Vui lòng đảm bảo đã cập nhật đầy đủ thông tin tài khoản (Địa chỉ, SĐT) và thử lại sau.');
      } else {
        toast.error('Đã xảy ra lỗi khi thanh toán. Vui lòng thử lại.');
      }
    } finally {
      setProcessing(false);
    }
  };

  if (isCheckingAuth || loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-slate-500">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex flex-col lg:flex-row gap-12">
      <div className="flex-1 space-y-8">
        <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-8">
                Thông tin giao hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Họ và tên</label>
                    <input type="text" defaultValue={getCurrentUser()?.name || ''} className="w-full bg-ritual-bg border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Số điện thoại</label>
                    <input type="tel" placeholder="Nhập số điện thoại" className="w-full bg-ritual-bg border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Địa chỉ nhận hàng</label>
                    <input 
                      type="text" 
                      defaultValue={summary.deliveryAddress || ''} 
                      placeholder="Số nhà, tên đường..." 
                      className="w-full bg-ritual-bg border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary" 
                    />
                </div>
            </div>
        </section>

        <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gold/10 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined p-2 bg-primary/10 rounded-xl">schedule</span>
                Chọn thời gian giao hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Ngày giao hàng</label>
                    <input 
                      type="date" 
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full bg-ritual-bg border border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary" 
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Giờ giao hàng (Hoàng đạo)</label>
                    <select 
                      value={deliveryTimeSlot}
                      onChange={(e) => setDeliveryTimeSlot(e.target.value)}
                      className="w-full bg-ritual-bg border border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary"
                    >
                        {timeSlots.map(slot => (
                          <option key={slot.value} value={slot.value}>{slot.label}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm text-slate-600">
                <div className="flex gap-2 mb-2">
                    <span className="font-bold text-primary">Mẹo:</span>
                </div>
                <p>Vui lòng chọn khung giờ hoàng đạo để đảm bảo ý nghĩa tâm linh của buổi lễ. Hãy để chúng tôi tư vấn giờ tốt nhất cho sự kiện của bạn.</p>
            </div>
        </section>

        <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined p-2 bg-primary/10 rounded-xl">edit_note</span>
                Ghi chú trang trí
            </h2>
            <div className="space-y-6">
                {summary.items.map((item) => (
                  <div key={item.cartItemId} className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">
                      {item.packageName} - {item.variantName}
                    </label>
                    <textarea
                      value={decorationNotes[item.cartItemId] || ''}
                      onChange={(e) => setDecorationNotes(prev => ({
                        ...prev,
                        [item.cartItemId]: e.target.value
                      }))}
                      placeholder="VD: Thêm hoa tươi, nến, trái cây..."
                      className="w-full bg-ritual-bg border border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary resize-none"
                      rows={3}
                    />
                  </div>
                ))}
            </div>
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 text-sm text-blue-700">
                <p className="font-bold mb-1">Lưu ý:</p>
                <p>Ghi chú của bạn sẽ được chuyển tới người bán để chuẩn bị theo yêu cầu của bạn.</p>
            </div>
        </section>

        <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-8">
                Phương thức thanh toán
            </h2>
            <div className="space-y-4">
                {[
                    { id: 'Vnpay', label: 'VNPay', desc: 'Chuyển khoản, Thẻ, QR - An toàn & Nhanh chóng' },
                    { id: 'wallet', label: 'Ví điện tử', desc: 'Momo, ZaloPay - Tiện lợi & Đơn giản' }
                ].map((m, i) => (
                    <label key={m.id} className={`flex items-center p-6 border-2 rounded-3xl cursor-pointer transition-all ${paymentMethod === m.id ? 'border-primary bg-gray-50' : 'border-gray-200 hover:border-primary'}`}>
                        <input 
                          type="radio" 
                          name="pay" 
                          checked={paymentMethod === m.id}
                          onChange={() => setPaymentMethod(m.id)}
                          className="text-primary focus:ring-primary size-5" 
                        />
                        <div className="ml-4">
                            <p className="font-bold text-slate-900">{m.label}</p>
                            <p className="text-xs text-slate-400">{m.desc}</p>
                        </div>
                    </label>
                ))}
            </div>
        </section>
      </div>

      <aside className="w-full lg:w-[400px] shrink-0">
        <div className="sticky top-28 bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-2xl">
            <h3 className="text-xl font-bold mb-8 border-b border-gray-200 pb-4">Đơn hàng của bạn</h3>
            <div className="space-y-6 mb-8">
                {summary.items.map((item) => (
                  <div key={item.cartItemId} className="flex gap-4">
                    <div className="size-16 rounded-2xl bg-slate-100 shrink-0 overflow-hidden flex items-center justify-center">
                      <div className="text-slate-300 text-xs text-center">
                        No Image
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold leading-tight">{item.packageName}</p>
                      <p className="text-[10px] text-slate-400 uppercase mt-1">
                        SL: {item.quantity.toString().padStart(2, '0')} • {item.variantName}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                         {item.vendorName}
                      </p>
                      <p className="text-sm font-bold text-primary mt-1">
                        {item.lineTotal.toLocaleString()}đ
                      </p>
                    </div>
                  </div>
                ))}
            </div>
            
            <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Tạm tính ({summary.totalItems} sản phẩm)</span>
                    <span className="font-bold">{summary.subTotal.toLocaleString()}đ</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Phí vận chuyển</span>
                    <span className={`font-bold ${summary.shippingFee === 0 ? 'text-green-600' : ''}`}>
                      {summary.shippingFee === 0 ? 'Miễn phí' : `${summary.shippingFee.toLocaleString()}đ`}
                    </span>
                </div>
                {summary.deliveryAddress && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-xs text-slate-400 mb-1">Địa chỉ giao hàng:</p>
                    <p className="text-xs text-slate-600">{summary.deliveryAddress}</p>
                  </div>
                )}
                <div className="pt-4 flex justify-between items-end">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Tổng cộng</p>
                        <p className="text-[10px] text-slate-300 italic">(Đã bao gồm VAT)</p>
                    </div>
                    <p className="text-3xl font-black text-primary tracking-tight">
                      {summary.totalAmount.toLocaleString()}đ
                    </p>
                </div>
            </div>

            <button 
                onClick={handleCheckout}
                disabled={processing || !deliveryDate}
                className="w-full mt-10 bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                    Đang xử lý...
                  </span>
                ) : 'Thanh toán ngay'}
            </button>
        </div>
      </aside>
    </div>
  );
};

export default CheckoutPage;
