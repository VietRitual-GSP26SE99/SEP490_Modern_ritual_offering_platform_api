import React, { useState } from 'react';

interface VendorShopProps {
  onNavigate: (path: string) => void;
}

const VendorShop: React.FC<VendorShopProps> = ({ onNavigate }) => {
  const [shopInfo] = useState({
    shopName: 'Mâm Cúng Hạnh Phúc',
    owner: 'Nguyễn Văn A',
    address: '123 Đường Lý Thường Kiệt, Q.10, TP.HCM',
    phone: '0912 345 678',
    email: 'shop@mamcunghanhphuc.com',
    description: 'Cung cấp mâm cúng trọn gói chất lượng cao với các dịch vụ tư vấn miễn phí. Cam kết sử dụng nguyên liệu tươi sạch, tuân theo nghi lễ truyền thống.',
    logo: '🏪',
    rating: 4.8,
    reviews: 256,
    followers: 1234,
    since: '2022',
    businessLicense: 'ĐKKD: 0123456789',
    verified: true,
  });

  const stats = [
    { label: 'Sản phẩm', value: 24, icon: 'shopping_bag' },
    { label: 'Đơn hàng', value: 284, icon: 'shopping_cart' },
    { label: 'Đánh giá', value: '4.8/5', icon: 'star' },
    { label: 'Người theo dõi', value: '1.2K', icon: 'people' },
  ];

  const products = [
    { id: 1, name: 'Mâm cúng Tết Truyền Thống', price: 1200000, image: '', sold: 45 },
    { id: 2, name: 'Mâm cúng Khai Trương', price: 2500000, image: '', sold: 32 },
    { id: 3, name: 'Mâm cúng Tân Gia', price: 1850000, image: '', sold: 28 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ritual-bg via-white to-gold/5">
      {/* Cover Image */}
      <div className="h-48 bg-gradient-to-r from-primary/20 to-gold/20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-center pb-8">
          <div className="text-7xl animate-bounce">{shopInfo.logo}</div>
        </div>
      </div>

      {/* Shop Header */}
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="relative -mt-16 mb-12">
          <div className="bg-white rounded-3xl border-2 border-gold/20 shadow-lg p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-playfair font-bold text-primary">
                    {shopInfo.shopName}
                  </h1>
                  {shopInfo.verified && (
                    <span className="text-gold text-xl">✓</span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">Chủ cửa hàng: <span className="font-bold text-primary">{shopInfo.owner}</span></p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-gold text-lg">★</span>
                    <span className="font-bold text-primary">{shopInfo.rating}</span>
                    <span className="text-sm text-gray-500">({shopInfo.reviews} đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <span className="text-sm">👥</span>
                    <span className="text-sm font-semibold">{shopInfo.followers} người theo dõi</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Hoạt động từ năm {shopInfo.since}</p>
              </div>
              <div className="flex gap-3 flex-col md:flex-row">
                <button
                  onClick={() => onNavigate('/vendor/products')}
                  className="px-6 py-3 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary/5 transition-all whitespace-nowrap"
                >
                  Xem Sản Phẩm
                </button>
                <button className="px-6 py-3 border-2 border-gold text-gold rounded-lg font-bold hover:bg-gold/5 transition-all whitespace-nowrap">
                  ❤ Theo dõi
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {stats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 text-center hover:shadow-lg transition-all">
              <p className="text-xs font-bold uppercase text-gold tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Shop Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Description */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-8 mb-8">
              <h2 className="text-2xl font-bold text-primary mb-4">
                ℹ️ Thông Tin Cửa Hàng
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">{shopInfo.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gold/10">
                <div>
                  <p className="text-xs font-bold uppercase text-gold tracking-widest mb-2">📍 Địa Chỉ</p>
                  <p className="text-gray-700 font-semibold">{shopInfo.address}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gold tracking-widest mb-2">📞 Liên Hệ</p>
                  <div className="space-y-2">
                    <p className="text-gray-700 font-semibold">☎️ {shopInfo.phone}</p>
                    <p className="text-gray-700 font-semibold">✉️ {shopInfo.email}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                <p className="text-sm text-green-700">
                  <strong>✓ Đã Xác Minh:</strong> {shopInfo.businessLicense}
                </p>
              </div>
            </div>

            {/* Products Preview */}
            <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">
                  🛍️ Sản Phẩm Nổi Bật
                </h2>
                <button
                  onClick={() => onNavigate('/vendor/products')}
                  className="text-sm font-bold text-primary border-b-2 border-primary pb-1 hover:text-gold transition-colors"
                >
                  Xem tất cả →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="border border-gold/10 rounded-xl overflow-hidden hover:shadow-lg transition-all">
                    <div className="bg-gradient-to-br from-primary/10 to-gold/10 h-32 flex items-center justify-center text-5xl">
                      {product.image}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-primary mb-2 line-clamp-2">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-black text-gold">{(product.price / 1000000).toFixed(1)}M₫</p>
                        <p className="text-xs text-gray-500">Bán: {product.sold}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 text-center hover:shadow-lg transition-all">
              <div className="text-4xl text-gold mb-3 block">📊</div>
              <h3 className="font-bold text-primary mb-2">Quản Lý Cửa Hàng</h3>
              <p className="text-xs text-gray-600 mb-4">Chỉnh sửa thông tin và cài đặt</p>
              <button
                onClick={() => onNavigate('/vendor/settings')}
                className="w-full px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
              >
                Cài Đặt
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 text-center hover:shadow-lg transition-all">
              <div className="text-4xl text-gold mb-3 block">➕</div>
              <h3 className="font-bold text-primary mb-2">Sản Phẩm Mới</h3>
              <p className="text-xs text-gray-600 mb-4">Thêm mâm cúng mới</p>
              <button
                onClick={() => onNavigate('/vendor/products')}
                className="w-full px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
              >
                Thêm
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 text-center hover:shadow-lg transition-all">
              <div className="text-4xl text-gold mb-3 block">📈</div>
              <h3 className="font-bold text-primary mb-2">Thống Kê</h3>
              <p className="text-xs text-gray-600 mb-4">Xem doanh số bán hàng</p>
              <button
                onClick={() => onNavigate('/vendor/analytics')}
                className="w-full px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
              >
                Xem
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 text-center hover:shadow-lg transition-all">
              <div className="text-4xl text-gold mb-3 block">🛒</div>
              <h3 className="font-bold text-primary mb-2">Đơn Hàng</h3>
              <p className="text-xs text-gray-600 mb-4">Quản lý đơn hàng mới</p>
              <button
                onClick={() => onNavigate('/vendor/orders')}
                className="w-full px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
              >
                Xem
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-primary mb-6">
            ⭐ Đánh Giá Gần Đây
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Trần Hương', rating: 5, comment: 'Mâm cúng rất đẹp, đúng như mô tả, giao hàng nhanh!' },
              { name: 'Lê Minh', rating: 5, comment: 'Chất lượng tuyệt vời, sẽ mua lại lần tới' },
              { name: 'Ngô Thúy', rating: 4, comment: 'Rất hài lòng với sản phẩm và dịch vụ' },
            ].map((review, idx) => (
              <div key={idx} className="p-4 bg-ritual-bg rounded-lg border border-gold/10">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-primary">{review.name}</p>
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <span key={i} className="text-gold text-sm">★</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{review.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorShop;
