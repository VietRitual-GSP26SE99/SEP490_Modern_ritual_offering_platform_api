import React, { useState, useEffect } from 'react';
import { getProfile, UserProfile, updateProfile, UpdateProfileRequest } from '../../services/auth';
import { geocodingService } from '../../services/geocodingService';

interface VendorShopProps {
  onNavigate: (path: string) => void;
}

const VendorShop: React.FC<VendorShopProps> = ({ onNavigate }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [formData, setFormData] = useState<UpdateProfileRequest & { shopDescription?: string; taxCode?: string }>({
    fullName: '',
    gender: 'Nam',
    phoneNumber: '',
    dateOfBirth: '',
    addressText: '',
    latitude: 0,
    longitude: 0,
    avatarFile: null,
    shopDescription: '',
    taxCode: ''
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [coordinateLoading, setCoordinateLoading] = useState(false);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const profileData = await getProfile();
        setProfile(profileData);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Update form data when profile is loaded
  useEffect(() => {
    if (profile) {
      try {
        // Safe date formatting
        let formattedDate = '';
        if (profile.dateOfBirth) {
          const dateStr = profile.dateOfBirth.toString();
          if (dateStr.includes('T')) {
            formattedDate = dateStr.split('T')[0];
          } else if (dateStr.length >= 10) {
            formattedDate = dateStr.substring(0, 10);
          } else {
            formattedDate = dateStr;
          }
        }

        setFormData({
          fullName: profile.fullName || '',
          gender: profile.gender || 'Nam',
          phoneNumber: profile.phoneNumber || '',
          dateOfBirth: formattedDate,
          addressText: profile.addressText || '',
          latitude: profile.latitude || 0,
          longitude: profile.longitude || 0,
          avatarFile: null,
          shopDescription: 'Chuyên cung cấp mâm cúng trọn gói chất lượng cao với các dịch vụ tư vấn miễn phí.',
          taxCode: profile.businessLicenseNo || ''
        });
      } catch (error) {
        console.error('Error updating form data:', error);
        // Set default values if there's an error
        setFormData({
          fullName: profile?.fullName || '',
          gender: profile?.gender || 'Nam',
          phoneNumber: profile?.phoneNumber || '',
          dateOfBirth: '',
          addressText: profile?.addressText || '',
          latitude: profile?.latitude || 0,
          longitude: profile?.longitude || 0,
          avatarFile: null,
          shopDescription: 'Chuyên cung cấp mâm cúng trọn gói chất lượng cao.',
          taxCode: profile?.businessLicenseNo || ''
        });
      }
    }
  }, [profile]);

  // Handle form input changes
  const handleInputChange = (field: string, value: string | number | File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle address coordinate fetching
  const handleGetCoordinates = async () => {
    if (!formData.addressText.trim()) {
      alert('Vui lòng nhập địa chỉ trước!');
      return;
    }

    try {
      setCoordinateLoading(true);
      const result = await geocodingService.geocodeAddress(formData.addressText);
      
      if (result) {
        setFormData(prev => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude
        }));
        alert(`✅ Đã lấy tọa độ thành công!\nVĩ độ: ${result.latitude}\nKinh độ: ${result.longitude}`);
      } else {
        alert('❌ Không thể lấy tọa độ cho địa chỉ này. Vui lòng thử địa chỉ khác.');
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      alert('❌ Lỗi khi lấy tọa độ. Vui lòng thử lại.');
    } finally {
      setCoordinateLoading(false);
    }
  };

  // Handle profile update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdateLoading(true);
      
      // Only send fields that exist in API
      const apiData: UpdateProfileRequest = {
        fullName: formData.fullName,
        gender: formData.gender,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        addressText: formData.addressText,
        latitude: formData.latitude,
        longitude: formData.longitude,
        avatarFile: formData.avatarFile
      };
      
      const updatedProfile = await updateProfile(apiData);
      
      // Update profile state safely
      setProfile(updatedProfile);
      setShowUpdateModal(false);
      
      // Show success message then reload
      alert('✅ Cập nhật thông tin thành công!');
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('❌ Cập nhật thất bại: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleInputChange('avatarFile', file);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ritual-bg via-white to-gold/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-primary">Đang tải thông tin cửa hàng...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ritual-bg via-white to-gold/5 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-primary mb-4">Không thể tải thông tin</h2>
          <p className="text-gray-600 mb-6">{error || 'Không tìm thấy thông tin cửa hàng'}</p>
          <div className="flex gap-4">
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                // Retry fetching profile
                getProfile()
                  .then(setProfile)
                  .catch(err => setError(err.message))
                  .finally(() => setLoading(false));
              }}
              className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-all"
            >
              Tải lại
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary/5 transition-all"
            >
              Refresh Trang
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Sản phẩm', value: 24, icon: 'shopping_bag' },
    { label: 'Đơn hàng', value: 284, icon: 'shopping_cart' },
    { label: 'Đánh giá', value: `${profile?.ratingAvg || 0}/5`, icon: 'star' },
    { label: 'Người theo dõi', value: '1.2K', icon: 'people' },
  ];

  const products = [
    { id: 1, name: 'Mâm cúng Tết Truyền Thống', price: 1200000, image: '', sold: 45 },
    { id: 2, name: 'Mâm cúng Khai Trương', price: 2500000, image: '', sold: 32 },
    { id: 3, name: 'Mâm cúng Tân Gia', price: 1850000, image: '', sold: 28 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ritual-bg via-white to-gold/5">
      {/* Shop Header */}
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="relative mt-8 mb-12">
          <div className="bg-white rounded-3xl border-2 border-gold/20 shadow-lg p-8 md:p-12">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.shopName || 'Shop avatar'}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-gold/30 shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).nextElementSibling?.removeAttribute('style');
                    }}
                  />
                ) : null}
                <div
                  className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-gold/20 border-4 border-gold/30 shadow-md flex items-center justify-center text-5xl"
                  style={{ display: profile?.avatarUrl ? 'none' : 'flex' }}
                >
                  🏪
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-playfair font-bold text-primary">
                    {profile.shopName || 'Chưa có tên cửa hàng'}
                  </h1>
                  {profile.verificationStatus === 'Verified' && (
                    <span className="text-gold text-xl">✓</span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">Chủ cửa hàng: <span className="font-bold text-primary">{profile?.fullName || 'Chưa có tên'}</span></p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <span className="text-gold text-lg">★</span>
                    <span className="font-bold text-primary">{profile?.ratingAvg || 0}</span>
                    <span className="text-sm text-gray-500">(256 đánh giá)</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <span className="text-sm">👥</span>
                    <span className="text-sm font-semibold">1234 người theo dõi</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">Hoạt động từ năm {profile?.createdAt ? new Date(profile.createdAt).getFullYear() : 2022}</p>
              </div>
              <div className="flex gap-3 flex-col md:flex-row">
                <button
                  onClick={() => onNavigate('/vendor/products')}
                  className="px-6 py-3 border-2 border-primary text-primary rounded-lg font-bold hover:bg-primary/5 transition-all whitespace-nowrap"
                >
                  Xem Sản Phẩm
                </button>
                <button className="px-6 py-3 border-2 border-gold text-gold rounded-lg font-bold hover:bg-gold/5 transition-all whitespace-nowrap">
                   Theo dõi
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
                Thông Tin Cửa Hàng
              </h2>
              <p className="text-gray-700 leading-relaxed mb-6">
                Cung cấp mâm cúng trọn gói chất lượng cao với các dịch vụ tư vấn miễn phí. 
                Cam kết sử dụng nguyên liệu tươi sạch, tuân theo nghi lễ truyền thống.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gold/10">
                <div>
                  <p className="text-xs font-bold uppercase text-gold tracking-widest mb-2">📍 Địa Chỉ</p>
                  <p className="text-gray-700 font-semibold">{profile?.addressText || 'Chưa có địa chỉ'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-gold tracking-widest mb-2">📞 Liên Hệ</p>
                  <div className="space-y-2">
                    <p className="text-gray-700 font-semibold">{profile?.phoneNumber || 'Chưa có số điện thoại'}</p>
                    <p className="text-gray-700 font-semibold">{profile?.userId || 'user'}@vietritual.com</p>
                  </div>
                </div>
              </div>

              {profile?.businessLicenseNo && (
                <div className="mt-6 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
                  <p className="text-sm text-green-700">
                    <strong>✓ Đã Xác Minh:</strong> ĐKKD: {profile.businessLicenseNo}
                  </p>
                </div>
              )}
            </div>

            {/* Products Preview */}
            <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-primary">
                   Sản Phẩm Nổi Bật
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
              <div className="text-4xl text-gold mb-3 block"></div>
              <h3 className="font-bold text-primary mb-2">Quản Lý Cửa Hàng</h3>
              <p className="text-xs text-gray-600 mb-4">Chỉnh sửa thông tin và cài đặt</p>
              <button
                onClick={() => setShowUpdateModal(true)}
                className="w-full px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
              >
                Cập Nhật
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 text-center hover:shadow-lg transition-all">
              <div className="text-4xl text-gold mb-3 block"></div>
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
              <div className="text-4xl text-gold mb-3 block"></div>
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
              <div className="text-4xl text-gold mb-3 block"></div>
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

      {/* Update Profile Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Cài Đặt Cửa Hàng</h2>
                  <p className="text-gray-600 text-sm mt-1">Quản lý thông tin cửa hàng và thanh toán</p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* Tabs */}
              <div className="flex mt-6 border-b border-gray-200">
                <button className="px-4 py-2 text-sm font-medium text-red-500 border-b-2 border-red-500 flex items-center gap-2">
                   Thông Tin Cửa Hàng
                </button>
                {/* <button className="px-4 py-2 text-sm font-medium text-gray-500 flex items-center gap-2">
                  🏦 Thông Tin Ngân Hàng
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-500 flex items-center gap-2">
                  💳 Hoa Hồng & Phí
                </button>
                <button className="px-4 py-2 text-sm font-medium text-gray-500 flex items-center gap-2">
                  📊 Thống Báo
                </button> */}
              </div>
            </div>
            
            <form onSubmit={handleUpdateProfile} className="p-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Thông Tin Cửa Hàng</h3>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-red-500 border border-red-500 rounded-lg hover:bg-red-50 flex items-center gap-2"
                  >
                    Chỉnh Sửa
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tên Cửa Hàng */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên Cửa Hàng</label>
                    <input
                      type="text"
                      value={profile?.shopName || 'Modern Ritual Shop'}
                      className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg text-gray-500"
                      readOnly
                    />
                  </div>

                  {/* Tên Chủ Cửa Hàng */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tên Chủ Cửa Hàng</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => handleInputChange('fullName', e.target.value)}
                      className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Số Điện Thoại */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Số Điện Thoại</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={`${profile?.userId || 'shop'}@modernritual.vn`}
                      className="w-full px-3 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500"
                      readOnly
                    />
                  </div>
                </div>

                {/* Địa Chỉ Cửa Hàng */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Địa Chỉ Cửa Hàng</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.addressText}
                      onChange={(e) => handleInputChange('addressText', e.target.value)}
                      className="flex-1 px-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleGetCoordinates}
                      disabled={coordinateLoading || !formData.addressText.trim()}
                      className="px-4 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors whitespace-nowrap"
                    >
                      {coordinateLoading ? 'Đang lấy tọa độ...' : 'Lấy Tọa Độ'}
                    </button>
                  </div>
                </div>

                {/* Mô Tả Cửa Hàng */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mô Tả Cửa Hàng</label>
                  <textarea
                    value={formData.shopDescription}
                    onChange={(e) => handleInputChange('shopDescription', e.target.value)}
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Mô tả về cửa hàng của bạn..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Giấy Phép Kinh Doanh */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Giấy Phép Kinh Doanh</label>
                    <select
                      value={profile?.verificationStatus === 'Verified' ? 'Có' : 'Không'}
                      className="w-full px-3 py-3 bg-green-50 border border-green-300 rounded-lg text-green-700 font-medium"
                      disabled
                    >
                      <option value="Có">Có</option>
                      <option value="Không">Không</option>
                    </select>
                  </div>

                  {/* Mã Số Thuế */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mã Số Thuế</label>
                    <input
                      type="text"
                      value={formData.taxCode}
                      onChange={(e) => handleInputChange('taxCode', e.target.value)}
                      className="w-full px-3 py-3 bg-green-50 border border-green-300 rounded-lg text-green-700 font-medium"
                      placeholder="Nhập mã số thuế..."
                    />
                  </div>
                </div>

                {/* Coordinates Display */}
                {(formData.latitude !== 0 || formData.longitude !== 0) && (
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Vĩ Độ</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.latitude}
                        onChange={(e) => handleInputChange('latitude', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kinh Độ</label>
                      <input
                        type="number"
                        step="any"
                        value={formData.longitude}
                        onChange={(e) => handleInputChange('longitude', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-300 rounded-lg text-sm"
                        readOnly
                      />
                    </div>
                  </div>
                )}

                {/* Avatar Upload */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh Đại Diện Cửa Hàng</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {formData.avatarFile && (
                    <p className="text-sm text-green-600 mt-2">✅ Đã chọn: {formData.avatarFile.name}</p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end mt-8">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-8 py-3 bg-blue-500 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
                  >
                    {updateLoading ? ' Đang cập nhật...' : ' Lưu Thay Đổi'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorShop;
