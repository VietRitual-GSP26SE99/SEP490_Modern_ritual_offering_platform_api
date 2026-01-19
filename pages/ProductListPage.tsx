
import React, { useState } from 'react';
import { MOCK_PRODUCTS } from '../constants';
import { AppRoute, Occasion } from '../types';

const ProductListPage: React.FC<{ onNavigate: (route: AppRoute) => void }> = ({ onNavigate }) => {
  const [activeFilter, setActiveFilter] = useState<Occasion | 'All'>('All');

  const filteredProducts = activeFilter === 'All' 
    ? MOCK_PRODUCTS 
    : MOCK_PRODUCTS.filter(p => p.category === activeFilter);

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex flex-col lg:flex-row gap-12">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-72 shrink-0 space-y-10">
        <div className="bg-white p-8 rounded-3xl border border-gold/10 shadow-sm space-y-8">
            <div>
                <h3 className="text-lg font-bold text-primary mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined">filter_list</span>
                    Bộ lọc
                </h3>
                <div className="space-y-2">
                    {[
                      { value: 'All', label: 'Tất cả dịp lễ' },
                      { value: 'Cúng Rằm', label: 'Cúng Rằm' },
                      { value: 'Tân Gia', label: 'Tân Gia' },
                      { value: 'Khai Trương', label: 'Khai Trương' },
                      { value: 'Cúng Giỗ', label: 'Cúng Giỗ' },
                      { value: 'Cúng Tết', label: 'Cúng Tết' }
                    ].map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => setActiveFilter(cat.value as any)}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            activeFilter === cat.value ? 'bg-primary text-white shadow-lg' : 'text-slate-600 hover:bg-gold/10'
                          }`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="pt-8 border-t border-gold/10">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Khoảng giá</h4>
                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary" id="p1" />
                        <label htmlFor="p1" className="text-sm text-slate-600">Dưới 1.000.000đ</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary" id="p2" />
                        <label htmlFor="p2" className="text-sm text-slate-600">1.000.000đ - 3.000.000đ</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary" id="p3" />
                        <label htmlFor="p3" className="text-sm text-slate-600">3.000.000đ - 5.000.000đ</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input type="checkbox" className="rounded text-primary focus:ring-primary" id="p4" />
                        <label htmlFor="p4" className="text-sm text-slate-600">Trên 5.000.000đ</label>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-gold/10">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Đánh giá</h4>
                <div className="space-y-2">
                    {[5, 4, 3].map((stars) => (
                        <label key={stars} className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" className="rounded text-gold" />
                            <div className="flex">
                                {[...Array(stars)].map((_, i) => (
                                    <span key={i} className="material-symbols-outlined text-xs text-gold">star</span>
                                ))}
                            </div>
                            <span className="text-xs text-slate-500">({stars} sao)</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="pt-8 border-t border-gold/10">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Tình trạng</h4>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" defaultChecked className="rounded text-primary" />
                        <span className="text-sm text-slate-600">Còn hàng</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded text-primary" />
                        <span className="text-sm text-slate-600">Sắp có hàng</span>
                    </label>
                </div>
            </div>

            <button className="w-full bg-primary text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-105 transition-all">
                Xóa bộ lọc
            </button>
        </div>
      </aside>

      {/* Product Grid */}
      <section className="flex-1 space-y-8">
        <div className="flex items-center justify-between mb-8 bg-white p-6 rounded-2xl border border-gold/10">
            <h2 className="text-xl font-bold text-slate-900">Danh sách mâm cúng ({filteredProducts.length})</h2>
            <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sắp xếp:</span>
                <select className="bg-ritual-bg border-none rounded-xl text-sm font-bold focus:ring-primary pr-10">
                    <option>Phổ biến nhất</option>
                    <option>Giá tăng dần</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts.map((p) => (
                <div 
                    key={p.id} 
                    onClick={() => onNavigate(AppRoute.Detail)}
                    className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gold/10 group cursor-pointer"
                >
                    <div className="relative aspect-square overflow-hidden">
                        <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={p.image} alt={p.name} />
                        <div className="absolute top-4 left-4 flex flex-col gap-2">
                            {p.tag && (
                                <span className="bg-primary/90 backdrop-blur-sm text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                                    {p.tag}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="flex items-center gap-1 mb-2 text-gold">
                            <span className="material-symbols-outlined text-sm">star</span>
                            <span className="text-xs font-bold">{p.rating}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({p.reviews} đánh giá)</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors leading-tight">{p.name}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2 mb-6">{p.description}</p>
                        <div className="pt-4 border-t border-gold/10 flex items-center justify-between">
                            <p className="text-xl font-black text-primary tracking-tight">{p.price.toLocaleString()}đ</p>
                            <button className="bg-primary text-white p-2.5 rounded-xl hover:scale-105 transition-transform">
                                <span className="material-symbols-outlined">add_shopping_cart</span>
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
};

export default ProductListPage;
