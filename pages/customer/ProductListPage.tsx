import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS } from '../../constants';
import { AppRoute, Occasion } from '../../types';
import { useSearchParams } from 'react-router-dom';

const ProductListPage: React.FC<{ onNavigate: (route: AppRoute | string) => void }> = ({ onNavigate }) => {
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<Occasion | 'All'>('All');
  const [priceRanges, setPriceRanges] = useState({
    p1: false, // Dưới 1 triệu
    p2: false, // 1-3 triệu
    p3: false, // 3-5 triệu
    p4: false, // Trên 5 triệu
  });
  const [ratingFilters, setRatingFilters] = useState({
    r5: false, // 5 sao
    r4: false, // 4 sao
    r3: false, // 3 sao
  });
  const [sortBy, setSortBy] = useState('popular'); // popular, price-asc, price-desc

  // Handle URL params for category filter
  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setActiveFilter(category as Occasion);
    } else {
      setActiveFilter('All');
    }
  }, [searchParams]);

  const filterByPrice = (price: number) => {
    if (!Object.values(priceRanges).some(v => v)) return true; // Nếu không chọn gì thì hiện tất cả
    if (priceRanges.p1 && price < 1000000) return true;
    if (priceRanges.p2 && price >= 1000000 && price < 3000000) return true;
    if (priceRanges.p3 && price >= 3000000 && price < 5000000) return true;
    if (priceRanges.p4 && price >= 5000000) return true;
    return false;
  };

  const filterByRating = (rating: number) => {
    if (!Object.values(ratingFilters).some(v => v)) return true; // Nếu không chọn gì thì hiện tất cả
    if (ratingFilters.r5 && rating >= 5) return true;
    if (ratingFilters.r4 && rating >= 4 && rating < 5) return true;
    if (ratingFilters.r3 && rating >= 3 && rating < 4) return true;
    return false;
  };

  const filteredProducts = MOCK_PRODUCTS.filter(p => {
    const categoryMatch = activeFilter === 'All' || p.category === activeFilter;
    const priceMatch = filterByPrice(p.price);
    const ratingMatch = filterByRating(p.rating);
    return categoryMatch && priceMatch && ratingMatch;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    // popular: sort by rating desc, then reviews desc
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.reviews - a.reviews;
  });

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex flex-col lg:flex-row gap-12">
      {/* Sidebar Filters */}
      <aside className="w-full lg:w-72 shrink-0 space-y-10">
        <div className="bg-white p-8 rounded-3xl border border-gold/10 shadow-sm space-y-8">
            <div>
                <h3 className="text-lg font-bold text-primary mb-6">
                     Bộ lọc
                </h3>
                <div className="space-y-2">
                    {[
                      { value: 'All', label: 'Tất cả dịp lễ' },
                      { value: 'Full Moon', label: 'Cúng Rằm' },
                      { value: 'Grand Opening', label: 'Khai Trương' },
                      { value: 'House Warming', label: 'Tân Gia' },
                      { value: 'Ancestral', label: 'Cúng Giỗ' },
                      { value: 'Year End', label: 'Cúng Tết' }
                    ].map((cat) => (
                        <button
                          key={cat.value}
                          onClick={() => {
                            setActiveFilter(cat.value as any);
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            activeFilter === cat.value ? 'border-2 border-primary bg-primary/5 text-primary' : 'text-slate-600 hover:bg-gold/10'
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
                        <input 
                          type="checkbox" 
                          className="rounded text-primary focus:ring-primary" 
                          id="p1"
                          checked={priceRanges.p1}
                          onChange={() => setPriceRanges({...priceRanges, p1: !priceRanges.p1})}
                        />
                        <label htmlFor="p1" className="text-sm text-slate-600">Dưới 1.000.000đ</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="rounded text-primary focus:ring-primary" 
                          id="p2"
                          checked={priceRanges.p2}
                          onChange={() => setPriceRanges({...priceRanges, p2: !priceRanges.p2})}
                        />
                        <label htmlFor="p2" className="text-sm text-slate-600">1.000.000đ - 3.000.000đ</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="rounded text-primary focus:ring-primary" 
                          id="p3"
                          checked={priceRanges.p3}
                          onChange={() => setPriceRanges({...priceRanges, p3: !priceRanges.p3})}
                        />
                        <label htmlFor="p3" className="text-sm text-slate-600">3.000.000đ - 5.000.000đ</label>
                    </div>
                    <div className="flex items-center gap-3">
                        <input 
                          type="checkbox" 
                          className="rounded text-primary focus:ring-primary" 
                          id="p4"
                          checked={priceRanges.p4}
                          onChange={() => setPriceRanges({...priceRanges, p4: !priceRanges.p4})}
                        />
                        <label htmlFor="p4" className="text-sm text-slate-600">Trên 5.000.000đ</label>
                    </div>
                </div>
            </div>

            <div className="pt-8 border-t border-gold/10">
                <h4 className="text-sm font-bold text-slate-900 mb-4">Đánh giá</h4>
                <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-gold"
                          checked={ratingFilters.r5}
                          onChange={() => setRatingFilters({...ratingFilters, r5: !ratingFilters.r5})}
                        />
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <span key={i} className="text-xs" style={{ color: '#FFD700' }}>★</span>
                            ))}
                        </div>
                        <span className="text-xs text-slate-500">(5 sao)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-gold"
                          checked={ratingFilters.r4}
                          onChange={() => setRatingFilters({...ratingFilters, r4: !ratingFilters.r4})}
                        />
                        <div className="flex">
                            {[...Array(4)].map((_, i) => (
                                <span key={i} className="text-xs" style={{ color: '#FFD700' }}>★</span>
                            ))}
                        </div>
                        <span className="text-xs text-slate-500">(4 sao)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="rounded text-gold"
                          checked={ratingFilters.r3}
                          onChange={() => setRatingFilters({...ratingFilters, r3: !ratingFilters.r3})}
                        />
                        <div className="flex">
                            {[...Array(3)].map((_, i) => (
                                <span key={i} className="text-xs" style={{ color: '#FFD700' }}>★</span>
                            ))}
                        </div>
                        <span className="text-xs text-slate-500">(3 sao)</span>
                    </label>
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

            <button className="w-full border-2 border-primary text-primary py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-primary/5 transition-all">
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
                <select 
                  className="bg-ritual-bg border-none rounded-xl text-sm font-bold focus:ring-primary pr-10"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                    <option value="popular">Phổ biến nhất</option>
                    <option value="price-asc">Giá tăng dần</option>
                    <option value="price-desc">Giá giảm dần</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredProducts.map((p) => (
                <div 
                    key={p.id} 
                    onClick={() => onNavigate(`/product/${p.id}`)}
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
                            <span className="text-sm" style={{ color: '#FFD700' }}>★</span>
                            <span className="text-xs font-bold">{p.rating}</span>
                            <span className="text-[10px] text-slate-400 ml-1">({p.reviews} đánh giá)</span>
                        </div>
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors leading-tight">{p.name}</h3>
                        <p className="text-slate-500 text-xs line-clamp-2 mb-6">{p.description}</p>
                        <div className="pt-4 border-t border-gold/10 flex items-center justify-between">
                            <p className="text-xl font-black text-primary tracking-tight">{p.price.toLocaleString()}đ</p>
                            <button className="bg-primary text-white p-2.5 rounded-xl hover:scale-105 transition-transform">
                                +
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
