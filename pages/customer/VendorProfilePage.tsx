import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { vendorService, VendorProfile } from '../../services/vendorService';
import { packageService } from '../../services/packageService';
import { Product } from '../../types';
import toast from '../../services/toast';

// Simple, minimal ProductCard inline for synchronization (B&W)
const MinimalProductCard: React.FC<{
  id: string | number;
  name: string;
  price: number;
  image: string;
  rating: number;
  onNavigate: (path: string) => void;
}> = ({ id, name, price, image, rating, onNavigate }) => (
  <div
    className="bg-white rounded-none overflow-hidden border border-slate-100 hover:border-slate-300 transition-all cursor-pointer group"
    onClick={() => onNavigate(`/product/${id}`)}
  >
    <div className="relative aspect-square overflow-hidden bg-slate-50">
      <img src={image} alt={name} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all duration-500" />
    </div>
    <div className="p-4 space-y-2">
      <h4 className="text-sm font-bold text-slate-800 line-clamp-2 min-h-[40px] leading-snug">{name}</h4>
      <div className="flex items-center justify-between items-baseline pt-2">
        <p className="text-slate-900 font-bold text-sm tracking-tight">{price.toLocaleString('vi-VN')}đ</p>
        <span className="text-[10px] font-bold text-slate-400">★ {rating}</span>
      </div>
    </div>
  </div>
);

interface VendorProfilePageProps {
  onNavigate: (path: string) => void;
}

const VendorProfilePage: React.FC<VendorProfilePageProps> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [vendorOverallReviews, setVendorOverallReviews] = useState<any[]>([]); // Use any for quick fix or import Review
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'products' | 'about'>('home');

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const profile = await vendorService.getVendorCached(id);
        if (profile) {
          setVendor(profile);
          
          // Concurrent fetch for products and reviews
          Promise.all([
             packageService.getPackagesByVendor(id),
             // Assuming reviewService is available (need to import it)
             import('../../services/reviewService').then(m => m.reviewService.getReviewsByVendorId(id))
          ]).then(([pkgs, reviews]) => {
             packageService.mapToProductsWithVendors(pkgs).then(setProducts);
             setVendorOverallReviews(reviews);
          }).catch(e => console.warn('⚠️ Error fetching vendor extra data:', e));
          
        } else {
          toast.error('Không tìm thấy thông tin cửa hàng');
        }
      } catch (error) {
        console.error('Error fetching vendor profile data:', error);
        toast.error('Lỗi khi tải dữ liệu cửa hàng');
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
        <h1 className="text-xl font-bold text-slate-800 mb-6 uppercase tracking-widest">Cửa hàng không tồn tại</h1>
        <button onClick={() => onNavigate('/')} className="px-6 py-2 bg-slate-900 text-white text-xs font-bold rounded-none uppercase tracking-widest">Quay lại</button>
      </div>
    );
  }

     const vendorRatingCount = vendorOverallReviews.length;
     const vendorAvgRating = vendorRatingCount > 0
       ? (vendorOverallReviews.reduce((acc: number, r: any) => acc + r.rating, 0) / vendorRatingCount).toFixed(1)
       : (vendor?.ratingAvg || '0.0');

     const joinTimeMonths = vendor.createdAt
       ? Math.floor((new Date().getTime() - new Date(vendor.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))
       : 0;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* High Contrast B&W Shop Header */}
      <div className="bg-slate-900 border-b border-black py-20 relative overflow-hidden">
        {/* Subtle decorative elements for 'Ritual' feel */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row gap-16 items-center lg:items-start text-center lg:text-left">
            {/* Identity */}
            <div className="flex flex-col lg:flex-row items-center gap-8 w-full lg:w-1/2">
               <div className="w-32 h-32 rounded-full bg-white flex items-center justify-center text-slate-900 text-4xl font-display font-black border-4 border-white/20 overflow-hidden shrink-0 shadow-2xl">
                  {vendor.avatarUrl ? (
                    <img src={vendor.avatarUrl} alt={vendor.shopName} className="w-full h-full object-cover" />
                  ) : (
                    vendor.shopName.charAt(0).toUpperCase()
                  )}
               </div>
               <div className="space-y-6">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-display font-black text-white tracking-tight italic">{vendor.shopName}</h1>
                    <div className="flex items-center justify-center lg:justify-start gap-2 mt-4">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <p className="text-[10px] font-black text-white/60 uppercase tracking-[0.3em]">Cửa hàng đang trực tuyến</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                    <button className="px-8 py-3 bg-white text-slate-900 text-[11px] font-black rounded-none uppercase tracking-[0.2em] hover:bg-slate-100 transition-all shadow-xl">Theo dõi</button>
                    <button className="px-8 py-3 bg-transparent border-2 border-white/30 text-white text-[11px] font-black rounded-none uppercase tracking-[0.2em] hover:bg-white/10 transition-all">Liên hệ</button>
                  </div>
               </div>
            </div>

            {/* B&W Stats Grid - High Contrast */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-y-10 gap-x-8 w-full">
               <div className="space-y-2 group">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">Sản phẩm</p>
                  <div className="flex items-baseline gap-2">
                    <div className="w-1 h-6 bg-white/20 group-hover:bg-white transition-colors"></div>
                    <p className="text-3xl font-display font-black text-white leading-none">{products.length}</p>
                  </div>
               </div>
               <div className="space-y-2 group">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">Đánh giá</p>
                  <div className="flex items-baseline gap-2">
                    <div className="w-1 h-6 bg-white/20 group-hover:bg-white transition-colors"></div>
                    <p className="text-3xl font-display font-black text-white leading-none whitespace-nowrap">
                       {vendorAvgRating} <span className="text-xs text-white/30">({vendorRatingCount})</span>
                    </p>
                  </div>
               </div>
               <div className="space-y-2 group">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">Tham gia</p>
                  <div className="flex items-baseline gap-2">
                    <div className="w-1 h-6 bg-white/20 group-hover:bg-white transition-colors"></div>
                    <p className="text-3xl font-display font-black text-white leading-none">{joinTimeMonths}</p>
                    <span className="text-[10px] font-bold text-white/40 uppercase">Tháng</span>
                  </div>
               </div>
               <div className="space-y-2 group">
                  <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">Hạng Shop</p>
                  <div className="flex items-baseline gap-2">
                    <div className="w-1 h-6 bg-white/20 group-hover:bg-white transition-colors"></div>
                    <p className="text-3xl font-display font-black text-white leading-none uppercase">{vendor.tierName || 'Bạc'}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-20">
        <div className="container mx-auto px-6">
          <div className="flex gap-10">
            {['home', 'products', 'about'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`py-5 text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                {tab === 'home' ? 'Trang chủ' : tab === 'products' ? 'Sản phẩm' : 'Thông tin'}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-slate-900"></div>}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-16">
        {activeTab === 'home' && (
          <div className="space-y-24">
            <div className="w-full aspect-[21/9] bg-slate-50 flex items-center justify-center border border-slate-100">
              <h2 className="text-4xl font-bold text-slate-200 tracking-[0.5em] uppercase">{vendor.shopName}</h2>
            </div>

            <div className="space-y-10">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest border-b border-slate-100 pb-4">Đề xuất</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {products.slice(0, 10).map((product) => (
                  <MinimalProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image}
                    rating={product.rating}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-10">
            <div className="flex justify-between items-baseline border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900 uppercase tracking-widest">Tất cả sản phẩm ({products.length})</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {products.map((product) => (
                <MinimalProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image}
                  rating={product.rating}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'about' && (
          <div className="max-w-3xl space-y-20">
            <section className="space-y-6">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-slate-400">Giới thiệu</h3>
              <p className="text-lg text-slate-700 leading-relaxed font-medium">
                {vendor.shopDescription || 'Cửa hàng chuyên cung cấp các dịch vụ tâm linh truyền thống.'}
              </p>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-16">
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Vị trí</h4>
                <p className="text-sm font-bold text-slate-800">{vendor.shopAddressText || 'Thừa Thiên Huế, Việt Nam'}</p>
              </div>
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chi tiết</h4>
                <div className="space-y-2 text-sm font-bold text-slate-800">
                  <p className="flex justify-between"><span>Loại hình:</span> <span>{vendor.businessType || 'Cá nhân'}</span></p>
                  <p className="flex justify-between"><span>Hạng:</span> <span className="uppercase">{vendor.tierName || 'Bạc'}</span></p>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorProfilePage;
