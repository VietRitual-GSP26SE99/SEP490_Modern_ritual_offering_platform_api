import React, { useState } from 'react';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'reviews'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: 'Nguyễn Văn An',
    email: 'nguyenan@email.com',
    phone: '0901234567',
    address: 'Quận 1, TP. HCM',
    gender: 'Nam',
    birthDate: '1990-01-15'
  });

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
            <div className="w-24 h-24 rounded-full bg-cover border-4 border-gold shadow-lg" style={{ backgroundImage: 'url("https://picsum.photos/200/200?random=profile")' }} />
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-black text-primary font-display mb-2">{profileData.fullName}</h1>
              <p className="text-slate-500">{profileData.email}</p>
          <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 bg-gray-100 text-primary text-xs font-bold uppercase rounded-lg">VIP Member</span>
                <span className="px-3 py-1 bg-gray-100 text-primary text-xs font-bold uppercase rounded-lg">3 Đơn hàng</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-lg"
          >
            {isEditing ? 'Hủy' : 'Chỉnh sửa'}
          </button>
        </div>

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
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Họ và tên</label>
                    <input
                      type="text"
                      value={profileData.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Email</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Số điện thoại</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Giới tính</label>
                    <select
                      value={profileData.gender}
                      onChange={(e) => setProfileData({ ...profileData, gender: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    >
                      <option>Nam</option>
                      <option>Nữ</option>
                      <option>Khác</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Ngày sinh</label>
                    <input
                      type="date"
                      value={profileData.birthDate}
                      onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Địa chỉ</label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
                >
                  Lưu thay đổi
                </button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { label: 'Họ và tên', value: profileData.fullName },
                    { label: 'Email', value: profileData.email },
                    { label: 'Số điện thoại', value: profileData.phone },
                    { label: 'Giới tính', value: profileData.gender },
                    { label: 'Ngày sinh', value: profileData.birthDate },
                    { label: 'Địa chỉ', value: profileData.address }
                  ].map((item) => (
                    <div key={item.label} className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">{item.label}</span>
                      <p className="text-lg font-bold text-primary">{item.value}</p>
                    </div>
                  ))}
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
      </div>
    </div>
  );
};

export default ProfilePage;
