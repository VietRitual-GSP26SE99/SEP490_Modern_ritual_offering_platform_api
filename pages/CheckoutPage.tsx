
import React from 'react';
import { AppRoute } from '../types';

const CheckoutPage: React.FC<{ onNavigate: (route: AppRoute) => void }> = ({ onNavigate }) => {
  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex flex-col lg:flex-row gap-12">
      <div className="flex-1 space-y-8">
        <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gold/10 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined p-2 bg-primary/10 rounded-xl">person</span>
                Thông tin giao hàng
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Họ và tên</label>
                    <input type="text" defaultValue="Nguyễn Văn An" className="w-full bg-ritual-bg border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Số điện thoại</label>
                    <input type="tel" defaultValue="0901234567" className="w-full bg-ritual-bg border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Địa chỉ nhận hàng</label>
                    <input type="text" placeholder="Số nhà, tên đường..." className="w-full bg-ritual-bg border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary" />
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
                    <input type="date" className="w-full bg-ritual-bg border border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary" />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400">Giờ giao hàng (Hoàng đạo)</label>
                    <select className="w-full bg-ritual-bg border border-gold/10 rounded-2xl p-4 focus:ring-primary focus:border-primary">
                        <option>7:00 - 9:00 (Tý-Sửu)</option>
                        <option>9:00 - 11:00 (Dần-Mão)</option>
                        <option>13:00 - 15:00 (Tỵ-Ngọ)</option>
                        <option>15:00 - 17:00 (Mùi-Thân)</option>
                        <option>17:00 - 19:00 (Dậu-Tuất)</option>
                    </select>
                </div>
            </div>
            <div className="p-4 bg-gold/5 rounded-xl border border-gold/20 text-sm text-slate-600">
                <div className="flex gap-2 mb-2">
                    <span className="material-symbols-outlined text-gold">lightbulb</span>
                    <span className="font-bold text-primary">Mẹo:</span>
                </div>
                <p>Vui lòng chọn khung giờ hoàng đạo để đảm bảo ý nghĩa tâm linh của buổi lễ. Hãy để chúng tôi tư vấn giờ tốt nhất cho sự kiện của bạn.</p>
            </div>
        </section>

        <section className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-gold/10 shadow-sm">
            <h2 className="text-2xl font-bold text-primary mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined p-2 bg-primary/10 rounded-xl">payments</span>
                Phương thức thanh toán
            </h2>
            <div className="space-y-4">
                {[
                    { id: 'momo', label: 'Ví điện tử Momo', desc: 'Nhanh chóng & Tiện lợi' },
                    { id: 'bank', label: 'Chuyển khoản VietQR', desc: 'Mọi ứng dụng ngân hàng' },
                    { id: 'card', label: 'Thẻ Visa/Mastercard', desc: 'Hỗ trợ thẻ quốc tế' }
                ].map((m, i) => (
                    <label key={m.id} className={`flex items-center p-6 border-2 rounded-3xl cursor-pointer transition-all ${i === 1 ? 'border-primary bg-primary/5' : 'border-slate-50 hover:border-gold'}`}>
                        <input type="radio" name="pay" defaultChecked={i === 1} className="text-primary focus:ring-primary size-5" />
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
        <div className="sticky top-28 bg-white p-8 rounded-[2.5rem] border border-gold/10 shadow-2xl">
            <h3 className="text-xl font-bold mb-8 border-b border-gold/10 pb-4">Đơn hàng của bạn</h3>
            <div className="space-y-6 mb-8">
                <div className="flex gap-4">
                    <div className="size-16 rounded-2xl bg-cover shrink-0" style={{ backgroundImage: 'url("https://picsum.photos/200/200?random=10")' }} />
                    <div className="flex-1">
                        <p className="text-sm font-bold leading-tight">Mâm Cúng Đầy Tháng Đặc Biệt</p>
                        <p className="text-[10px] text-slate-400 uppercase mt-1">SL: 01 • Tier: Special</p>
                        <p className="text-sm font-bold text-primary mt-1">2.500.000đ</p>
                    </div>
                </div>
            </div>
            
            <div className="space-y-3 pt-6 border-t border-gold/10">
                <div className="flex justify-between text-sm text-slate-500">
                    <span>Tạm tính</span>
                    <span className="font-bold">2.500.000đ</span>
                </div>
                <div className="flex justify-between text-sm text-green-600 font-bold">
                    <span>Phí vận chuyển</span>
                    <span>Miễn phí</span>
                </div>
                <div className="pt-4 flex justify-between items-end">
                    <div>
                        <p className="text-xs font-bold uppercase text-slate-400">Tổng cộng</p>
                        <p className="text-[10px] text-slate-300 italic">(Đã bao gồm VAT)</p>
                    </div>
                    <p className="text-3xl font-black text-primary tracking-tight">2.500.000đ</p>
                </div>
            </div>

            <button 
                onClick={() => onNavigate(AppRoute.Tracking)}
                className="w-full mt-10 bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-3"
            >
                Thanh toán ngay
                <span className="material-symbols-outlined">lock</span>
            </button>
        </div>
      </aside>
    </div>
  );
};

export default CheckoutPage;
