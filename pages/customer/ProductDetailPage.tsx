
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
  const [currentMainImage, setCurrentMainImage] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  // Find product by ID
  const product = MOCK_PRODUCTS.find(p => p.id === id);

  // Product thumbnail images from gallery or fallback to random images
  const thumbnailImages = product?.gallery || [
    'https://picsum.photos/400/400?random=1',
    'https://picsum.photos/400/400?random=2',
    'https://picsum.photos/400/400?random=3',
    'https://picsum.photos/400/400?random=4',
  ];

  // All product images (main + thumbnails)
  const productImages = [
    product?.image || '',
    ...thumbnailImages
  ].filter(img => img);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageModal(true);
  };

  const handleThumbnailClick = (index: number) => {
    setCurrentMainImage(index);
  };

  // Mock reviews data
  const mockReviews = [
    {
      id: 1,
      userName: 'Nguyễn Thị Lan',
      avatar: 'https://i.pravatar.cc/150?img=1',
      rating: 5,
      comment: 'Mâm cúng rất đẹp và chu đáo, lễ vật tươi ngon. Shop tư vấn nhiệt tình, giao hàng đúng giờ. Rất hài lòng!',
      date: '15/01/2026',
      helpful: 12
    },
    {
      id: 2,
      userName: 'Trần Văn Minh',
      avatar: 'https://i.pravatar.cc/150?img=12',
      rating: 5,
      comment: 'Chất lượng tuyệt vời, trình bày đẹp mắt. Gia đình rất ấn tượng. Sẽ ủng hộ shop lâu dài!',
      date: '12/01/2026',
      helpful: 8
    },
    {
      id: 3,
      userName: 'Lê Thị Hương',
      avatar: 'https://i.pravatar.cc/150?img=5',
      rating: 4,
      comment: 'Mâm cúng đẹp, tuy nhiên giá hơi cao so với mặt bằng chung. Nhưng chất lượng xứng đáng!',
      date: '08/01/2026',
      helpful: 5
    }
  ];

  const ratingDistribution = [
    { stars: 5, count: 98, percentage: 77 },
    { stars: 4, count: 20, percentage: 16 },
    { stars: 3, count: 7, percentage: 5 },
    { stars: 2, count: 2, percentage: 2 },
    { stars: 1, count: 1, percentage: 1 }
  ];

  const handleSubmitReview = () => {
    if (userRating > 0 && reviewText.trim()) {
      alert('Cảm ơn bạn đã đánh giá!');
      setUserRating(0);
      setReviewText('');
    } else {
      alert('Vui lòng chọn số sao và viết đánh giá');
    }
  };

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
              onClick={() => handleImageClick(currentMainImage)}
            >
                <img className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" src={productImages[currentMainImage]} alt={product.name} />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                </div>
            </div>
            <div className="grid grid-cols-5 gap-4">
                {thumbnailImages.map((imgUrl, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square rounded-2xl overflow-hidden border-2 cursor-pointer transition-all hover:shadow-lg ${
                        currentMainImage === i + 1 ? 'border-gold' : 'border-transparent hover:border-gold'
                      }`}
                      onClick={() => handleThumbnailClick(i + 1)}
                    >
                         <img className="w-full h-full object-cover hover:scale-110 transition-transform" src={imgUrl} alt={`Ảnh ${i + 1}`} />
                    </div>
                ))}
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
                  <span style={{ color: '#FFD700' }}>★</span>
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
                     Thêm vào giỏ
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

      {/* Reviews Section */}
      <div className="mt-16 space-y-8">
        <h2 className="text-3xl font-black text-primary">Đánh giá sản phẩm</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rating Summary */}
          <div className="bg-white rounded-3xl p-8 border border-gold/10 shadow-sm">
            <div className="text-center mb-6">
              <div className="text-5xl font-black text-primary mb-2">{product.rating}</div>
              <div className="flex justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star} className="text-2xl" style={{ color: '#FFD700' }}>★</span>
                ))}
              </div>
              <p className="text-sm text-slate-500">{product.reviews} đánh giá</p>
            </div>

            <div className="space-y-2">
              {ratingDistribution.map((item) => (
                <div key={item.stars} className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600 w-8">{item.stars}★</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all" 
                      style={{ width: `${item.percentage}%`, backgroundColor: '#FFD700' }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 w-8">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-6">
            {mockReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-3xl p-6 border border-gold/10 shadow-sm">
                <div className="flex items-start gap-4">
                  <img src={review.avatar} alt={review.userName} className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-slate-900">{review.userName}</h4>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span key={star} className="text-sm" style={{ color: star <= review.rating ? '#FFD700' : '#cbd5e1' }}>★</span>
                            ))}
                          </div>
                          <span className="text-xs text-slate-400">• {review.date}</span>
                        </div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">Đã mua hàng</span>
                    </div>
                    <p className="text-sm text-slate-600 mb-3">{review.comment}</p>
                    <button className="text-xs text-slate-500 hover:text-primary font-semibold flex items-center gap-1">
                      <span>👍</span> Hữu ích ({review.helpful})
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review */}
        <div className="bg-white rounded-3xl p-8 border border-gold/10 shadow-sm">
          <h3 className="text-xl font-bold text-primary mb-6">Viết đánh giá của bạn</h3>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-3">Đánh giá của bạn</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="text-4xl transition-all hover:scale-110"
                  >
                    <span style={{ color: star <= (hoverRating || userRating) ? '#FFD700' : '#cbd5e1' }}>★</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-700 block mb-3">Nội dung đánh giá</label>
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này..."
                className="w-full h-32 px-4 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none text-sm"
              />
            </div>
            <button
              onClick={handleSubmitReview}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
            >
              Gửi đánh giá
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
