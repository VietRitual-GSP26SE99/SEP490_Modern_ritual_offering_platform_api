import React, { useState, useEffect } from 'react';
import { MOCK_PRODUCTS } from '../../constants';
import MOCK_DATA from '../../mockData';
import Carousel from '../../components/Carousel';
import { packageService } from '../../services/packageService';

const HomePage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [showAllServices, setShowAllServices] = useState(false);
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const { heroSlides, services, trustStats } = MOCK_DATA;

  const getProductDetailPath = (rawId: string): string => {
    const numericId = Number(String(rawId).trim());
    if (Number.isInteger(numericId) && numericId > 0) {
      return `/product/${numericId}`;
    }
    return `/product/${encodeURIComponent(String(rawId).trim())}`;
  };

  const pickRandomProducts = <T,>(items: T[], count: number): T[] => {
    if (items.length <= count) return items;
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  };

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const apiPackages = await packageService.getAllPackages();
        if (apiPackages.length > 0) {
          const mappedProducts = await packageService.mapToProductsWithVendors(apiPackages);
          setProducts(pickRandomProducts(mappedProducts, 3));
        } else {
          setProducts(pickRandomProducts(MOCK_PRODUCTS, 3));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(pickRandomProducts(MOCK_PRODUCTS, 3));
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);
  
  return (
    <div className="space-y-24 pb-24">
      {/* Hero Carousel Section */}
      <Carousel slides={heroSlides} onCtaClick={() => onNavigate('/shop')} />

      {/* Services Showcase */}
      <section className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="text-center mb-16">
            <h2 className="text-primary font-display text-4xl md:text-5xl font-black mb-4 italic">Dịch Vụ Cúng Lễ</h2>
            <div className="w-24 h-1 bg-gold mx-auto mb-6"></div>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg italic">Gìn giữ truyền thống - Kết nối tương lai</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.slice(0, showAllServices ? services.length : 4).map((svc, i) => (
                <div key={i} className="group cursor-pointer" onClick={() => onNavigate('/shop')}>
                    <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-lg border-2 border-transparent group-hover:border-gold transition-all duration-500">
                        <img alt={svc.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src={svc.img} />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/20 to-transparent flex flex-col justify-end p-8">
                            <h3 className="text-white text-2xl font-bold mb-2 leading-tight">{svc.title}</h3>
                            <div className="mt-4 flex items-center text-primary font-bold text-xs gap-2">
                                <span>Khám phá ngay</span>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        <div className="text-center mt-12">
          <button 
            onClick={() => setShowAllServices(!showAllServices)}
            className="border-2 border-primary text-primary px-12 py-3 rounded-lg font-bold text-lg hover:bg-primary/5 transition-all"
          >
            {showAllServices ? 'Thu Gọn' : 'Xem Thêm'} ({showAllServices ? '8' : '4'} loại cúng)
          </button>
        </div>
      </section>

      {/* Trust Stats */}
      <section className="bg-primary py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-10 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                {trustStats.map((item, i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-md p-10 rounded-[2rem] border border-white/10 text-center hover:bg-white/10 transition-colors">
                        <h3 className="text-white text-2xl font-bold mb-4">{item.title}</h3>
                        <p className="text-white/80 leading-relaxed text-sm">{item.desc}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Premium Products Highlights */}
      <section className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex items-end justify-between mb-16">
            <div>
                <h2 className="text-primary font-display text-4xl font-black italic">Mâm Cúng Cao Cấp</h2>
                <p className="text-gray-500 mt-2">Sản phẩm được hàng ngàn gia chủ tin dùng</p>
            </div>
            <button onClick={() => onNavigate('/shop')} className="text-primary font-bold flex items-center gap-2 hover:gap-4 transition-all uppercase text-xs tracking-widest">
                -- Tất cả sản phẩm --
            </button>
        </div>
        {loadingProducts ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-slate-600 font-semibold">Đang tải sản phẩm...</p>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all border border-gray-200 group cursor-pointer"
              onClick={() => onNavigate(getProductDetailPath(product.id))}
            >
                    <div className="relative h-72 overflow-hidden">
                        <img alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={product.image} />
                        {product.tag && (
                            <div className="absolute top-4 left-4 bg-primary text-white text-[10px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase">
                                {product.tag}
                            </div>
                        )}
                    </div>
                    <div className="p-8">
                        <h3 className="text-xl font-black mb-2 group-hover:text-primary transition-colors leading-tight">{product.name}</h3>
                        {product.vendorName && (
                            <p className="text-xs text-slate-600 mb-2 flex items-center gap-1">
                                <span className="text-slate-400">bởi</span>
                                <span className="font-semibold text-primary">{product.vendorName}</span>
                            </p>
                        )}
                        <p className="text-gray-500 text-sm mb-6 line-clamp-2">{product.description}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-primary text-2xl font-black tracking-tight">{product.price.toLocaleString()}đ</span>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              onNavigate(getProductDetailPath(product.id));
                            }}
                            className="bg-gray-100 hover:bg-primary text-primary hover:text-white p-3 rounded-2xl transition-all font-bold"
                          >
                                +
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
