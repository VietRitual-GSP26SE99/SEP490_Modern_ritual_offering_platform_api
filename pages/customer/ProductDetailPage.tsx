
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MOCK_PRODUCTS } from '../../constants';
import ImageModal from '../../components/ImageModal';
import { packageService } from '../../services/packageService';
import { vendorService, VendorProfile } from '../../services/vendorService';
import { Product } from '../../types';
import toast from '../../services/toast';
import { cartService } from '../../services/cartService';
import { getCurrentUser } from '../../services/auth';

const ProductDetailPage: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState('Special');
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentMainImage, setCurrentMainImage] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  // Fetch product from API
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        console.log(' Fetching product detail for ID:', id);
        const apiPackage = await packageService.getPackageById(id);
        console.log(' Received package:', apiPackage);
        
        if (apiPackage) {
          // Fetch vendor info
          const vendorInfo = await vendorService.getVendorCached(apiPackage.vendorProfileId);
          const vendorMap = new Map();
          if (vendorInfo) {
            vendorMap.set(apiPackage.vendorProfileId, vendorInfo);
            setVendor(vendorInfo);
          }
          
          const mappedProduct = packageService.mapToProduct(apiPackage, vendorMap);
          console.log(' Mapped product:', mappedProduct);
          console.log(' Variants:', mappedProduct.variants);
          if (mappedProduct.variants && mappedProduct.variants[0]) {
            console.log(' First variant items:', mappedProduct.variants[0].items);
          }
          setProduct(mappedProduct);
        } else {
          console.warn(' No package from API, using mock data');
          const mockProduct = MOCK_PRODUCTS.find(p => p.id === id);
          setProduct(mockProduct || null);
        }
      } catch (error) {
        console.error(' Error fetching product:', error);
        const mockProduct = MOCK_PRODUCTS.find(p => p.id === id);
        setProduct(mockProduct || null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Find product by ID
  // const product = MOCK_PRODUCTS.find(p => p.id === id);

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
      toast.success('Cảm ơn bạn đã đánh giá!');
      setUserRating(0);
      setReviewText('');
    } else {
      toast.warning('Vui lòng chọn số sao và viết đánh giá');
    }
  };

  const handleAddToCart = async () => {
    // Check authentication
    const user = getCurrentUser();
    if (!user) {
      toast.warning('Vui lòng đăng nhập để thêm vào giỏ hàng');
      navigate(`/auth?redirect=/product/${id}`);
      return;
    }

    // Get selected variant
    const selectedVariant = product?.variants?.[selectedVariantIndex];
    if (!selectedVariant || !selectedVariant.variantId) {
      toast.error('Vui lòng chọn gói lễ');
      return;
    }

    setAddingToCart(true);
    try {
      console.log('🛒 Adding to cart:', {
        variantId: selectedVariant.variantId,
        quantity
      });

      const success = await cartService.addToCart({
        variantId: selectedVariant.variantId,
        quantity
      });

      if (success) {
        toast.success('Đã thêm vào giỏ hàng!');
        // Trigger cart update event
        window.dispatchEvent(new Event('cartUpdated'));
      } else {
        toast.error('Không thể thêm vào giỏ hàng. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      toast.error('Đã xảy ra lỗi. Vui lòng thử lại.');
    } finally {
      setAddingToCart(false);
    }
  };

  // If product not found, show error
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-semibold text-lg">Đang tải sản phẩm...</p>
        </div>
      </div>
    );
  }

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
                {product.vendorName && (
                    <p className="text-sm text-slate-600 flex items-center gap-2">
                        <span className="text-slate-400">Được đăng bởi</span>
                        <span className="font-bold text-primary">{product.vendorName}</span>
                    </p>
                )}
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
                        {product.variants && product.variants.length > 0 ? (
                          product.variants.map((variant, index) => (
                            <button 
                              key={variant.variantId}
                              onClick={() => setSelectedVariantIndex(index)}
                              className={`p-4 rounded-2xl border-2 text-center transition-all ${selectedVariantIndex === index ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-gold'}`}
                            >
                                <p className="text-xs font-bold leading-none mb-1">{variant.tier}</p>
                                <p className="text-[10px] text-slate-400 italic">{variant.price.toLocaleString()}đ</p>
                            </button>
                          ))
                        ) : (
                          ['Standard', 'Special', 'Premium'].map((t) => (
                            <button 
                              key={t}
                              onClick={() => setSelectedTier(t)}
                              className={`p-4 rounded-2xl border-2 text-center transition-all ${selectedTier === t ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-gold'}`}
                            >
                                <p className="text-xs font-bold leading-none mb-1">{t === 'Standard' ? 'Tiêu chuẩn' : t === 'Special' ? 'Đặc biệt' : 'Thượng hạng'}</p>
                                <p className="text-[10px] text-slate-400 italic">{product.price.toLocaleString()}đ</p>
                            </button>
                          ))
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t border-gold/10">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-4">Lễ vật bao gồm</label>
                    <div className="grid grid-cols-2 gap-y-3">
                        {product.variants && product.variants[selectedVariantIndex]?.items && product.variants[selectedVariantIndex].items.length > 0 ? (
                          product.variants[selectedVariantIndex].items.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-600">
                                <span className="text-gold">✓</span>
                                {item}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 text-xs text-slate-400 italic">
                            Đang cập nhật danh sách lễ vật...
                          </div>
                        )}
                    </div>
                </div>

                {/* Quantity Selector */}
                <div className="pt-6 border-t border-gold/10">
                    <label className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-4">Số lượng</label>
                    <div className="flex items-center gap-3">
                        <button 
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-12 h-12 rounded-xl border-2 border-slate-200 text-primary font-bold hover:bg-primary hover:text-white hover:border-primary transition-all"
                        >
                          −
                        </button>
                        <input 
                          type="number" 
                          min="1" 
                          value={quantity} 
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-20 h-12 text-center text-lg font-bold border-2 border-slate-200 rounded-xl focus:border-primary focus:outline-none"
                        />
                        <button 
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-12 h-12 rounded-xl border-2 border-slate-200 text-primary font-bold hover:bg-primary hover:text-white hover:border-primary transition-all"
                        >
                          +
                        </button>
                    </div>
                </div>

                <button 
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="w-full border-3 border-primary text-primary py-4 rounded-lg font-bold uppercase tracking-widest hover:bg-primary hover:text-white transition-all mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingToCart ? ' Đang thêm...' : ' Thêm vào giỏ'}
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

      {/* Vendor Info Box - Similar to Shopee */}
      {vendor && (
        <div className="mt-8">
          <div className="bg-white rounded-3xl p-8 border border-gold/10 shadow-sm">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Vendor Avatar & Name */}
              <div className="flex items-center gap-4 md:w-1/3 pb-6 md:pb-0 md:border-r border-gold/10">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-orange-400 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {vendor.shopName.charAt(0).toUpperCase()}
                  </div>
                  {(vendor.rating && vendor.rating >= 4.5) && (
                    <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white">
                      Yêu thích
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-900">{vendor.shopName}</h3>
                  <p className="text-xs text-green-600 mt-1">● Online 3 Phút Trước</p>
                  <div className="flex gap-2 mt-3">
                    <button className="px-4 py-1.5 border-2 border-primary text-primary text-xs font-bold rounded-lg hover:bg-primary hover:text-white transition">
                      💬 Chat Ngay
                    </button>
                    <button 
                      onClick={() => vendor.vendorProfileId && onNavigate(`/vendor/${vendor.vendorProfileId}`)}
                      className="px-4 py-1.5 border-2 border-slate-300 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 transition"
                    >
                      🏪 Xem Shop
                    </button>
                  </div>
                </div>
              </div>

              {/* Vendor Stats */}
              <div className="md:w-2/3 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 md:pl-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Đánh Giá</span>
                  </div>
                  <p className="text-primary font-bold">{vendor.rating ? `${vendor.rating}/5` : '4.8/5'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Tỉ Lệ Phản Hồi</span>
                  </div>
                  <p className="text-primary font-bold">{vendor.responseRate ? `${vendor.responseRate}%` : '96%'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Tham Gia</span>
                  </div>
                  <p className="font-bold text-slate-700">{vendor.joinedDate || '5 năm trước'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Sản Phẩm</span>
                  </div>
                  <p className="font-bold text-slate-700">{vendor.productCount || '127'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Thời Gian Phản Hồi</span>
                  </div>
                  <p className="font-bold text-slate-700">{vendor.responseTime || 'trong vài giờ'}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 text-xs">Người Theo Dõi</span>
                  </div>
                  <p className="font-bold text-slate-700">{vendor.followerCount ? `${(vendor.followerCount / 1000).toFixed(1)}k` : '2.1k'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-16 space-y-8">
        <h2 className="text-3xl font-black text-primary">Đánh giá sản phẩm</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                      <span></span> Hữu ích ({review.helpful})
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
