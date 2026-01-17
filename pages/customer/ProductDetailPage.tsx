
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../../constants';
import ImageModal from '../../components/ImageModal';

const ProductDetailPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState('Special');
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Mock product images
  const productImages = [
    (MOCK_PRODUCTS.find(p => p.id === id))?.image || '',
    `https://picsum.photos/800/800?random=1`,
    `https://picsum.photos/800/800?random=2`,
    `https://picsum.photos/800/800?random=3`,
  ].filter(img => img);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  // Find product by ID
  const product = MOCK_PRODUCTS.find(p => p.id === id);

  // If product not found, show error
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 text-center">
        <h1 className="text-4xl font-black text-primary mb-6">Sản phẩm không tìm thấy</h1>
        <p className="text-slate-500 mb-8">Sản phẩm bạn tìm kiếm không tồn tại hoặc đã bị xóa</p>
        <button 
          onClick={() => onNavigate('/shop')}
          className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-bold hover:bg-primary/5 transition-all"
        >
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-10 py-12">
      <nav className="flex items-center gap-2 mb-10 text-[13px] font-medium text-slate-400">
        <button onClick={() => onNavigate('/')} className="hover:text-primary">Trang chủ</button>
        <span className="text-xs">›</span>
        <button onClick={() => onNavigate('/shop')} className="hover:text-primary">Danh mục</button>
        <span className="text-xs">›</span>
        <span className="text-slate-900 font-bold">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        <div className="lg:col-span-7 space-y-6">
            <div 
              className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl bg-white border border-gold/10 cursor-pointer hover:shadow-xl transition-all"
              onClick={() => handleImageClick(0)}
            >
                <img className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" src={product.image} alt={product.name} />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <span className="text-white text-3xl">🔍</span>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
                {[0,1,2,3].map(i => (
                    <div 
                      key={i} 
                      className="aspect-square rounded-2xl overflow-hidden border-2 border-transparent hover:border-gold cursor-pointer transition-all hover:shadow-lg"
                      onClick={() => handleImageClick(i)}
                    >
                         <img className="w-full h-full object-cover hover:scale-110 transition-transform" src={`https://picsum.photos/400/400?random=${i}`} alt={`Ảnh ${i + 1}`} />
                    </div>
                ))}
                <div className="aspect-square rounded-2xl bg-gold/10 flex flex-col items-center justify-center text-primary cursor-pointer border-2 border-dashed border-gold/30 hover:bg-gold/20 transition-all group">
                    <span className="text-2xl group-hover:scale-110 transition-transform">➕</span>
                    <span className="text-[10px] font-bold">15+ Ảnh</span>
                </div>
            </div>
        </div>

        <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
                <div className="flex gap-2">
                    {product.tag && (
                      <span className="px-2.5 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-md">{product.tag}</span>
                    )}
                    <span className="px-2.5 py-1 bg-gold/10 text-gold text-[10px] font-black uppercase tracking-widest rounded-md">Truyền thống</span>
                </div>
                <h1 className="text-4xl font-display font-black leading-tight text-primary">{product.name}</h1>
                <div className="flex items-baseline gap-4">
                    <p className="text-4xl font-black text-primary tracking-tight">{product.price.toLocaleString()}đ</p>
                    {product.originalPrice && (
                      <p className="text-lg text-slate-400 line-through">{product.originalPrice.toLocaleString()}đ</p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gold">★</span>
                  <span className="text-sm font-bold text-slate-600">{product.rating} ({product.reviews} đánh giá)</span>
                </div>
            </div>

            <div className="p-6 bg-white rounded-3xl border border-gold/10 shadow-sm space-y-6">
                <div>
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-4">Cấp độ gói lễ (Tier)</label>
                    <div className="grid grid-cols-3 gap-3">
                        {['Standard', 'Special', 'Premium'].map((t) => (
                            <button 
                              key={t}
                              onClick={() => setSelectedTier(t)}
                              className={`p-4 rounded-2xl border-2 text-center transition-all ${selectedTier === t ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-gold'}`}
                            >
                                <p className="text-xs font-bold leading-none mb-1">{t === 'Standard' ? 'Tiêu chuẩn' : t === 'Special' ? 'Đặc biệt' : 'Thượng hạng'}</p>
                                <p className="text-[10px] text-slate-400 italic">{product.price.toLocaleString()}đ</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="pt-6 border-t border-gold/10">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-4">Lễ vật bao gồm</label>
                    <div className="grid grid-cols-2 gap-y-3">
                        {['1 Gà luộc ta', '12 Đĩa xôi gấc', '12 Chén chè đậu', 'Bộ hài & đồ thế', 'Bình hoa cát tường', 'Mâm ngũ quả'].map(item => (
                            <div key={item} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <span className="text-gold">✓</span>
                                {item}
                            </div>
                        ))}
                    </div>
                </div>

                <button 
                  onClick={() => onNavigate('/cart')}
                  className="w-full border-3 border-primary text-primary py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all mb-3"
                >
                    🛒 Thêm vào giỏ
                </button>
                <button 
                  onClick={() => onNavigate('/checkout')}
                  className="w-full bg-primary text-white py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-primary/90 transition-all"
                >
                    Mua ngay
                </button>
            </div>
        </div>
      </div>

      {/* Image Modal */}
      <ImageModal 
        isOpen={showImageModal}
        imageSrc={productImages[selectedImageIndex] || ''}
        altText={product.name}
        images={productImages}
        currentIndex={selectedImageIndex}
        onClose={() => setShowImageModal(false)}
      />
    </div>
  );
};

export default ProductDetailPage;
