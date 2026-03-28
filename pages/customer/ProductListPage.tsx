import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS } from '../../constants';
import { AppRoute, Occasion, Product, CeremonyCategory } from '../../types';
import { useSearchParams } from 'react-router-dom';
import { packageService } from '../../services/packageService';
import { cartService } from '../../services/cartService';
import { getCurrentUser } from '../../services/auth';
import toast from '../../services/toast';

const ProductListPage: React.FC<{ onNavigate: (route: AppRoute | string) => void }> = ({ onNavigate }) => {
  const [searchParams] = useSearchParams();
  const [activeFilter, setActiveFilter] = useState<Occasion | 'All'>('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
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
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CeremonyCategory[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const pageSize = 12;

  const getProductDetailPath = (rawId: string): string => {
    const numericId = Number(String(rawId).trim());
    if (Number.isInteger(numericId) && numericId > 0) {
      return `/product/${numericId}`;
    }
    return `/product/${encodeURIComponent(String(rawId).trim())}`;
  };

  const handleNavigateToProductDetail = (rawId: string) => {
    onNavigate(getProductDetailPath(rawId));
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log(' Starting to fetch data...');
        
        // Fetch categories first
        const apiCategories = await packageService.getCeremonyCategories();
        console.log(' Received categories:', apiCategories);
        setCategories(apiCategories);

        const apiPackages = await packageService.getAllPackages();
        console.log(' Received packages:', apiPackages);

        if (apiPackages.length > 0) {
          const mappedProducts = await packageService.mapToProductsWithVendors(apiPackages);
          
          // Update product categories based on dynamic names if possible
          // This ensures filtering works with the names from API
          const enhancedProducts = mappedProducts.map(p => {
            const apiPkg = apiPackages.find(pkg => String(pkg.packageId) === String(p.id) || String((pkg as any).id) === String(p.id));
            if (apiPkg && apiPkg.categoryId) {
              const categoryObj = apiCategories.find(c => c.categoryId === apiPkg.categoryId);
              if (categoryObj) {
                return { ...p, category: categoryObj.name };
              }
            }
            return p;
          });

          console.log(' Mapped products with dynamic categories:', enhancedProducts);
          setProducts(enhancedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const category = searchParams.get('category');
    if (category) {
      setActiveFilter(category as Occasion);
    } else {
      setActiveFilter('All');
    }
  }, [searchParams]);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [searchParams, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery, priceRanges, ratingFilters, sortBy]);

  const filterByPrice = (price: number) => {
    if (!Object.values(priceRanges).some(v => v)) return true;
    if (priceRanges.p1 && price < 1000000) return true;
    if (priceRanges.p2 && price >= 1000000 && price < 3000000) return true;
    if (priceRanges.p3 && price >= 3000000 && price < 5000000) return true;
    if (priceRanges.p4 && price >= 5000000) return true;
    return false;
  };

  const filterByRating = (rating: number) => {
    if (!Object.values(ratingFilters).some(v => v)) return true;
    if (ratingFilters.r5 && rating >= 5) return true;
    if (ratingFilters.r4 && rating >= 4 && rating < 5) return true;
    if (ratingFilters.r3 && rating >= 3 && rating < 4) return true;
    return false;
  };

  const filterBySearch = (product: Product) => {
    const keyword = searchQuery.trim().toLowerCase();
    if (!keyword) return true;

    const searchable = [
      product.name,
      product.description,
      product.vendorName,
      product.category,
      product.tag,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return searchable.includes(keyword);
  };

  const filteredProducts = products.filter(p => {
    const categoryMatch = activeFilter === 'All' || p.category === activeFilter;
    const priceMatch = filterByPrice(p.price);
    const ratingMatch = filterByRating(p.rating);
    const searchMatch = filterBySearch(p);
    return categoryMatch && priceMatch && ratingMatch && searchMatch;
  }).sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    // Popularity logic: totalSold > Rating > Reviews
    if ((b.totalSold || 0) !== (a.totalSold || 0)) return (b.totalSold || 0) - (a.totalSold || 0);
    if (b.rating !== a.rating) return b.rating - a.rating;
    return b.reviews - a.reviews;
  });

  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleQuickAddToCart = async (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();

    const user = getCurrentUser();
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      onNavigate('/auth');
      return;
    }

    if (!product.variants || product.variants.length === 0) {
      toast.warning('Sản phẩm này chưa có chi tiết gói lễ. Vui lòng xem chi tiết.');
      handleNavigateToProductDetail(product.id);
      return;
    }

    // Default to the first variant
    const variantId = product.variants[0].variantId;

    try {
      const success = await cartService.addToCart({
        variantId: variantId,
        quantity: 1
      });

      if (success) {
        toast.success('Đã thêm vào giỏ hàng!');
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error quick add to cart:', error);
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  };

  const handleResetFilters = () => {
    setActiveFilter('All');
    setPriceRanges({ p1: false, p2: false, p3: false, p4: false });
    setRatingFilters({ r5: false, r4: false, r3: false });
    setSearchQuery('');
    setSortBy('popular');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex flex-col lg:flex-row gap-12 relative">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden flex items-center justify-between mb-2">
        <button 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2 px-5 py-3 bg-white border border-primary/20 text-primary rounded-2xl text-sm font-bold shadow-sm hover:bg-primary/5 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-lg">filter_alt</span>
          Bộ lọc & Sắp xếp
        </button>
      </div>

      <aside className={`w-full lg:w-72 shrink-0 space-y-10 ${isFilterOpen ? 'block' : 'hidden lg:block'} lg:sticky lg:top-24 h-fit`}>
        <div className="bg-white p-8 rounded-3xl border border-gold/10 shadow-sm space-y-8">
          <div>
            <h3 className="text-lg font-bold text-primary mb-6">
              Bộ lọc
            </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveFilter('All')}
                  className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] ${activeFilter === 'All' 
                    ? 'border-2 border-primary bg-primary/5 text-primary shadow-md' 
                    : 'text-slate-600 hover:bg-gold/10 hover:pl-7'
                    }`}
                >
                  Tất cả dịp lễ
                </button>
                {categories.filter(c => c.isActive).slice(0, showAllCategories ? undefined : 6).map((cat) => (
                  <button
                    key={cat.categoryId}
                    onClick={() => {
                      setActiveFilter(cat.name);
                    }}
                    className={`w-full text-left px-5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 ease-out hover:scale-[1.02] active:scale-[0.98] ${activeFilter === cat.name 
                      ? 'border-2 border-primary bg-primary/5 text-primary shadow-md' 
                      : 'text-slate-600 hover:bg-gold/10 hover:pl-7'
                      }`}
                  >
                    {cat.name}
                  </button>
                ))}
                {categories.filter(c => c.isActive).length > 6 && (
                  <button
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:text-primary hover:bg-gold/10 transition-all duration-300"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {showAllCategories ? 'remove' : 'add'}
                    </span>
                    {showAllCategories ? 'Thu gọn' : 'Xem thêm'}
                  </button>
                )}
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
                  onChange={() => setPriceRanges({ ...priceRanges, p1: !priceRanges.p1 })}
                />
                <label htmlFor="p1" className="text-sm text-slate-600">Dưới 1.000.000đ</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary"
                  id="p2"
                  checked={priceRanges.p2}
                  onChange={() => setPriceRanges({ ...priceRanges, p2: !priceRanges.p2 })}
                />
                <label htmlFor="p2" className="text-sm text-slate-600">1.000.000đ - 3.000.000đ</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary"
                  id="p3"
                  checked={priceRanges.p3}
                  onChange={() => setPriceRanges({ ...priceRanges, p3: !priceRanges.p3 })}
                />
                <label htmlFor="p3" className="text-sm text-slate-600">3.000.000đ - 5.000.000đ</label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary"
                  id="p4"
                  checked={priceRanges.p4}
                  onChange={() => setPriceRanges({ ...priceRanges, p4: !priceRanges.p4 })}
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
                  onChange={() => setRatingFilters({ ...ratingFilters, r5: !ratingFilters.r5 })}
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
                  onChange={() => setRatingFilters({ ...ratingFilters, r4: !ratingFilters.r4 })}
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
                  onChange={() => setRatingFilters({ ...ratingFilters, r3: !ratingFilters.r3 })}
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

          <button
            onClick={handleResetFilters}
            className="w-full border-2 border-primary text-primary py-2.5 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-primary/5 transition-all"
          >
            Xóa bộ lọc
          </button>
        </div>
      </aside>

      <section className="flex-1 space-y-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-slate-600 font-semibold">Đang tải sản phẩm...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-gold/10">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
                <h2 className="text-xl font-bold text-slate-900 hidden sm:block">Danh sách ({filteredProducts.length})</h2>
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên sản phẩm, cửa hàng..."
                    className="w-full rounded-2xl border border-slate-200 bg-gray-50/50 py-3 pl-11 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sắp xếp:</span>
                  <select
                    className="bg-gray-50 border-none rounded-xl text-xs font-bold focus:ring-primary py-2 px-3 pr-8"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="popular">Phổ biến</option>
                    <option value="price-asc">Giá: Thấp-Cao</option>
                    <option value="price-desc">Giá: Cao-Thấp</option>
                  </select>
                </div>
                <span className="sm:hidden text-xs font-bold text-slate-400 tracking-tight">({filteredProducts.length}) sp</span>
              </div>
            </div>

            {filteredProducts.length === 0 && (
              <div className="bg-white border border-gold/10 rounded-2xl p-10 text-center text-slate-500">
                Không tìm thấy sản phẩm phù hợp với từ khóa hoặc bộ lọc hiện tại.
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-8">
              {paginatedProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gold/10 group flex flex-col h-full"
                >
                  <div
                    className="relative w-full pt-[85%] md:pt-[100%] overflow-hidden cursor-pointer shrink-0"
                    onClick={() => handleNavigateToProductDetail(p.id)}
                  >
                    <img className="absolute top-0 left-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src={p.image} alt={p.name} />
                  </div>
                  <div
                    className="p-3 md:p-6 cursor-pointer flex-1 flex flex-col"
                    onClick={() => handleNavigateToProductDetail(p.id)}
                  >
                    <div className="flex items-center justify-between mb-1 md:mb-2">
                      <div className="flex items-center gap-1 text-gold">
                        <span className="text-xs" style={{ color: '#FFD700' }}>★</span>
                        <span className="text-[10px] md:text-xs font-bold">{p.rating}</span>
                        <span className="text-[8px] md:text-[10px] text-slate-400 ml-0.5">({p.reviews})</span>
                      </div>
                      {p.totalSold !== undefined && p.totalSold > 0 && (
                        <span className="hidden md:inline-block text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Đã bán {p.totalSold}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2 group-hover:text-primary transition-colors leading-tight line-clamp-2">{p.name}</h3>
                    {p.vendorName && (
                      <p className="text-[10px] md:text-xs text-slate-600 mb-2 flex items-center gap-1">
                        <span className="text-slate-400 hidden md:inline">bởi</span>
                        <span className="font-semibold text-primary truncate max-w-[80px] md:max-w-none">{p.vendorName}</span>
                      </p>
                    )}
                    {/* <p className="text-slate-500 text-xs line-clamp-2 mb-6">{p.description}</p> */}
                    <div className="pt-2 md:pt-4 mt-auto border-t border-gold/10 flex items-center justify-between">
                      <p className="text-sm md:text-xl font-black text-primary tracking-tight">{p.price.toLocaleString()}đ</p>
                      <button
                        className="bg-primary text-white p-1.5 md:p-2.5 rounded-lg md:rounded-xl hover:scale-105 transition-transform z-10"
                        onClick={(e) => handleQuickAddToCart(p, e)}
                      >
                        <span className="material-symbols-outlined text-xs md:text-base">add_shopping_cart</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12 pb-10">
                <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border border-gold/20 transition-all ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary hover:text-white active:scale-95'}`}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button 
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${currentPage === i + 1 
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                      : 'hover:bg-primary/5 text-slate-600 active:scale-95'}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center border border-gold/20 transition-all ${currentPage === totalPages ? 'opacity-30 cursor-not-allowed' : 'hover:bg-primary hover:text-white active:scale-95'}`}
                >
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default ProductListPage;
