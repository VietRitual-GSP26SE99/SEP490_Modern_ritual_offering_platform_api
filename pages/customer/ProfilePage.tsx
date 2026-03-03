import React, { useState, useEffect } from 'react';
import { getProfile, UserProfile, getCurrentUser, updateProfile, UpdateProfileRequest } from '../../services/auth';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'reviews'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Form state for editing
  const [editForm, setEditForm] = useState({
    fullName: '',
    gender: '',
    phoneNumber: '',
    dateOfBirth: '',
    addressText: '',
    latitude: 0,
    longitude: 0
  });

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Loading profile...');
        
        const profileData = await getProfile();
        setProfile(profileData);
        
        // Populate edit form with current profile data
        setEditForm({
          fullName: profileData.fullName,
          gender: profileData.gender,
          phoneNumber: profileData.phoneNumber,
          dateOfBirth: profileData.dateOfBirth.split('T')[0], // Convert to YYYY-MM-DD
          addressText: profileData.addressText,
          latitude: profileData.latitude || 0,
          longitude: profileData.longitude || 0
        });
        
        console.log('✅ Profile loaded successfully:', profileData);
        console.log('📍 Coordinates:', {
          latitude: profileData.latitude,
          longitude: profileData.longitude
        });
      } catch (err) {
        console.error('❌ Failed to load profile:', err);
        setError('Không thể tải thông tin profile. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // For latitude and longitude, keep as string in form but validate numeric pattern
    if (name === 'latitude' || name === 'longitude') {
      // Allow numbers, dots, minus sign for coordinates
      const numericPattern = /^-?[0-9]*\.?[0-9]*$/;
      if (value === '' || numericPattern.test(value)) {
        setEditForm(prev => ({
          ...prev,
          [name]: value === '' ? 0 : value
        }));
      }
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setError(null);
      console.log('💾 Submitting profile update...');
      console.log('📝 Edit form data:', editForm);
      
      const updateData: UpdateProfileRequest = {
        ...editForm,
        // Convert coordinate strings to numbers before sending to API
        latitude: typeof editForm.latitude === 'string' ? parseFloat(editForm.latitude) || 0 : editForm.latitude,
        longitude: typeof editForm.longitude === 'string' ? parseFloat(editForm.longitude) || 0 : editForm.longitude,
        avatarFile: avatarFile
      };
      
      console.log('📤 Update data being sent:', updateData);
      
      const updatedProfile = await updateProfile(updateData);
      
      console.log('✅ Profile updated, reloading from server...');
      
      // Fetch fresh profile data from server to ensure we have the latest
      const refreshedProfile = await getProfile();
      
      // Update local state with refreshed data
      setProfile(refreshedProfile);
      
      // Update edit form with new data
      setEditForm({
        fullName: refreshedProfile.fullName,
        gender: refreshedProfile.gender,
        phoneNumber: refreshedProfile.phoneNumber,
        dateOfBirth: refreshedProfile.dateOfBirth.split('T')[0],
        addressText: refreshedProfile.addressText,
        latitude: refreshedProfile.latitude || 0,
        longitude: refreshedProfile.longitude || 0
      });
      
      // Reset editing state
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      alert('✅ Cập nhật profile thành công!');
      console.log('✅ Profile refreshed:', refreshedProfile);
    } catch (err) {
      console.error('❌ Failed to update profile:', err);
      setError('Không thể cập nhật profile. Vui lòng thử lại.');
      alert('❌ Cập nhật thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setUpdating(false);
    }
  };

  const mockOrders = [
    {
      id: '#MRT-8829-2024',
      product: 'Mâm Cúng Đầy Tháng Đặc Biệt',
      date: '2024-01-12',
      total: 2500000,
      status: 'Đang giao',
      image: 'https://picsum.photos/100/100?random=1'
    },
    {
      id: '#MRT-8828-2024',
      product: 'Gói Đại Phát - Khai Trương',
      date: '2024-01-10',
      total: 4950000,
      status: 'Hoàn tất',
      image: 'https://picsum.photos/100/100?random=2'
    },
    {
      id: '#MRT-8827-2024',
      product: 'Gói Bình An - Tân Gia',
      date: '2024-01-05',
      total: 1850000,
      status: 'Hoàn tát',
      image: 'https://picsum.photos/100/100?random=3'
    }
  ];

  const mockReviews = [
    {
      id: 1,
      product: 'Mâm Cúng Đầy Tháng Đặc Biệt',
      rating: 5,
      date: '2024-01-12',
      comment: 'Rất hài lòng với dịch vụ. Mâm cúng được chuẩn bị tỉ mỉ, đúng giờ giao. Đội ngũ chuyên nghiệp và tư vấn kỹ lưỡng.'
    }
  ];

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="flex gap-6">
            <div className="w-24 h-24 rounded-full bg-cover border-4 border-gold shadow-lg" 
                 style={{ backgroundImage: profile?.avatarUrl ? `url("${profile.avatarUrl}")` : 'url("https://picsum.photos/200/200?random=profile")' }} />
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-black text-primary font-display mb-2">
                {loading ? 'Đang tải...' : profile?.fullName || 'Chưa có tên'}
              </h1>
              <p className="text-slate-500">{loading ? '...' : getCurrentUser()?.email || profile?.userId}</p>
          <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 bg-gray-100 text-primary text-xs font-bold uppercase rounded-lg">
                  {profile?.isVendor ? 'Vendor' : 'Customer'}
                </span>
                {profile?.isVendor && profile?.ratingAvg > 0 && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase rounded-lg">
                    ⭐ {profile.ratingAvg.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              if (!isEditing && profile) {
                // When entering edit mode, reset form to current profile data
                setEditForm({
                  fullName: profile.fullName,
                  gender: profile.gender,
                  phoneNumber: profile.phoneNumber,
                  dateOfBirth: profile.dateOfBirth.split('T')[0],
                  addressText: profile.addressText,
                  latitude: profile.latitude || 0,
                  longitude: profile.longitude || 0
                });
              } else {
                // When exiting edit mode, also reset
                if (profile) {
                  setEditForm({
                    fullName: profile.fullName,
                    gender: profile.gender,
                    phoneNumber: profile.phoneNumber,
                    dateOfBirth: profile.dateOfBirth.split('T')[0],
                    addressText: profile.addressText,
                    latitude: profile.latitude || 0,
                    longitude: profile.longitude || 0
                  });
                }
                setAvatarFile(null);
                setAvatarPreview(null);
              }
              setIsEditing(!isEditing);
            }}
            disabled={loading}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-slate-500 font-semibold">Đang tải thông tin...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-red-800 mb-1">Có lỗi xảy ra</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Main Content - Only show when not loading */}
        {!loading && !error && (
          <>
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-2 border border-gray-200 shadow-sm sticky top-24 z-40">
          {['info', 'orders', 'reviews'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase transition-all tracking-wider ${
                activeTab === tab
                  ? 'bg-primary text-white shadow-md'
                  : 'text-slate-500 hover:text-primary'
              }`}
            >
              {tab === 'info' && 'Thông tin cá nhân'}
              {tab === 'orders' && `Đơn hàng (${mockOrders.length})`}
              {tab === 'reviews' && `Đánh giá (${mockReviews.length})`}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-lg p-8 md:p-12">
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h3 className="text-2xl font-bold text-primary mb-6">Chỉnh Sửa Thông Tin</h3>
                
                {/* Avatar Upload */}
                <div className="flex flex-col items-center mb-8">
                  <div className="relative mb-4">
                    <div 
                      className="w-32 h-32 rounded-full bg-cover border-4 border-primary shadow-lg"
                      style={{ 
                        backgroundImage: avatarPreview 
                          ? `url("${avatarPreview}")` 
                          : profile?.avatarUrl 
                            ? `url("${profile.avatarUrl}")` 
                            : 'url("https://picsum.photos/200/200?random=profile")' 
                      }}
                    />
                    <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-all">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </label>
                  </div>
                  <p className="text-xs text-slate-500">Click vào icon để thay đổi ảnh đại diện</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                      Họ và tên <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="fullName"
                      value={editForm.fullName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                      Số điện thoại <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={editForm.phoneNumber}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>

                  {/* Gender */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                      Giới tính <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="gender"
                      value={editForm.gender}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  {/* Date of Birth */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                      Ngày sinh <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={editForm.dateOfBirth}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                    Địa chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="addressText"
                    value={editForm.addressText}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                      Vĩ độ (Latitude)
                    </label>
                    <input
                      type="text"
                      name="latitude"
                      value={editForm.latitude}
                      onChange={handleInputChange}
                      placeholder="VD: 10.7886"
                      pattern="[0-9]*\.?[0-9]*"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                      Kinh độ (Longitude)
                    </label>
                    <input
                      type="text"
                      name="longitude"
                      value={editForm.longitude}
                      onChange={handleInputChange}
                      placeholder="VD: 106.6891"
                      pattern="[0-9]*\.?[0-9]*"
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={updating}
                    className="flex-1 bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Reset form to current profile data
                      if (profile) {
                        setEditForm({
                          fullName: profile.fullName,
                          gender: profile.gender,
                          phoneNumber: profile.phoneNumber,
                          dateOfBirth: profile.dateOfBirth.split('T')[0],
                          addressText: profile.addressText,
                          latitude: profile.latitude || 0,
                          longitude: profile.longitude || 0
                        });
                      }
                      setIsEditing(false);
                      setAvatarFile(null);
                      setAvatarPreview(null);
                    }}
                    disabled={updating}
                    className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-gray-200">
                     Thông Tin Cơ Bản
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Profile ID</span>
                      <p className="text-sm font-mono text-primary mt-1">{profile?.profileId}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">User ID</span>
                      <p className="text-sm font-mono text-primary mt-1">{profile?.userId}</p>
                    </div> */}
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Họ và tên</span>
                      <p className="text-lg font-bold text-primary mt-1">{profile?.fullName}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Email</span>
                      <p className="text-lg font-bold text-primary mt-1">{getCurrentUser()?.email}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Số điện thoại</span>
                      <p className="text-lg font-bold text-primary mt-1">{profile?.phoneNumber}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Giới tính</span>
                      <p className="text-lg font-bold text-primary mt-1">{profile?.gender}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Ngày sinh</span>
                      <p className="text-lg font-bold text-primary mt-1">
                        {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                    {profile?.isVendor && profile?.ratingAvg > 0 && (
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-xs font-bold uppercase text-slate-400">Đánh giá trung bình</span>
                        <p className="text-lg font-bold text-primary mt-1">
                          ⭐ {profile?.ratingAvg.toFixed(1)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Information */}
                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-gray-200">
                     Địa Chỉ
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Địa chỉ đầy đủ</span>
                      <p className="text-lg font-bold text-primary mt-1">{profile?.addressText}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Vĩ độ (Latitude)</span>
                      <p className="text-sm font-mono text-primary mt-1">{profile?.latitude}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Kinh độ (Longitude)</span>
                      <p className="text-sm font-mono text-primary mt-1">{profile?.longitude}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Tọa độ</span>
                      <p className="text-sm font-mono text-primary mt-1">
                        {profile?.latitude}, {profile?.longitude}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vendor Information - Only show if user is a vendor */}
                {profile?.isVendor && (
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-gray-200">
                      🏪 Thông Tin Vendor
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-xs font-bold uppercase text-slate-400">Tên Shop</span>
                        <p className="text-lg font-bold text-primary mt-1">{profile?.shopName || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-xs font-bold uppercase text-slate-400">Số GPKD</span>
                        <p className="text-lg font-bold text-primary mt-1">{profile?.businessLicenseNo || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-xs font-bold uppercase text-slate-400">Trạng thái xác minh</span>
                        <p className="text-lg font-bold text-primary mt-1">{profile?.verificationStatus || 'N/A'}</p>
                      </div>
                      <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-xs font-bold uppercase text-slate-400">Đánh giá Shop</span>
                        <p className="text-lg font-bold text-primary mt-1">⭐ {profile?.ratingAvg.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* System Information */}
                <div>
                  <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-gray-200">
                    Thông Tin Hệ Thống
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Ngày tạo</span>
                      <p className="text-lg font-bold text-primary mt-1">
                        {profile?.createdAt ? new Date(profile.createdAt).toLocaleString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Cập nhật lần cuối</span>
                      <p className="text-lg font-bold text-primary mt-1">
                        {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                      </p>
                    </div>
                    {profile?.avatarUrl && (
                      <div className="md:col-span-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                        <span className="text-xs font-bold uppercase text-slate-400">Avatar URL</span>
                        <p className="text-sm font-mono text-primary mt-1 break-all">{profile.avatarUrl}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6">
            {mockOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col md:flex-row md:items-center gap-6">
                <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-cover border-2 border-gray-200" style={{ backgroundImage: `url("${order.image}")` }} />
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">{order.id}</p>
                      <h3 className="text-lg font-bold text-primary mb-1">{order.product}</h3>
                      <p className="text-sm text-slate-500">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-primary tracking-tight mb-2">{order.total.toLocaleString()}đ</p>
                      <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${
                        order.status === 'Hoàn tát' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('/tracking')}
                  className="md:self-start bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-all"
                >
                  Xem chi tiết
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {mockReviews.map((review) => (
              <div key={review.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-primary mb-1">{review.product}</h3>
                    <p className="text-sm text-slate-500">{review.date}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <span key={i} className="text-primary text-lg">★</span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                  <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/70 transition-all">
                    👍 Hữu ích (2)
                  </button>
                  <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-all">
                    ✎ Chỉnh sửa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
