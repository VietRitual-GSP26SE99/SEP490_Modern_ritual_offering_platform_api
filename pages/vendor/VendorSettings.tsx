import React, { useState } from 'react';

interface VendorSettingsProps {
  onNavigate: (path: string) => void;
}

const VendorSettings: React.FC<VendorSettingsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('shop');
  const [shopInfo, setShopInfo] = useState({
    shopName: 'Modern Ritual Shop',
    ownerName: 'Nguyễn Văn Chủ',
    phone: '0901234567',
    email: 'shop@modernritual.vn',
    address: '123 Nguyễn Huệ, Q1, TP.HCM',
    description: 'Chuyên cung cấp mâm cúng trọn gói chất lượng cao',
    businessLicense: 'Có',
    tax: '1234567890',
  });

  const [bankInfo, setBankInfo] = useState({
    bankName: 'Ngân Hàng Vietcombank',
    accountName: 'NGUYEN VAN CHU',
    accountNumber: '1234567890',
    branch: 'Chi nhánh Quận 1',
  });

  const [isEditing, setIsEditing] = useState(false);

  const handleSave = () => {
    console.log('Saved:', shopInfo, bankInfo);
    alert('Cập nhật thông tin thành công!');
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-playfair font-bold text-primary mb-2">Cài Đặt Cửa Hàng</h1>
          <p className="text-gray-600">Quản lý thông tin cửa hàng và thanh toán</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b-2 border-gold/20 flex-wrap">
          {[
            { id: 'shop', label: '🏪 Thông Tin Cửa Hàng' },
            { id: 'bank', label: '🏦 Thông Tin Ngân Hàng' },
            { id: 'commission', label: '💰 Hoa Hồng & Phí' },
            { id: 'notifications', label: '🔔 Thông Báo' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-bold transition-all border-b-4 ${
                activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-gray-600 border-transparent hover:text-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Shop Info Tab */}
        {activeTab === 'shop' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Thông Tin Cửa Hàng</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2 rounded-lg font-bold transition-all border-2 ${
                  isEditing
                    ? 'border-red-600 text-red-600 hover:bg-red-50'
                    : 'border-slate-400 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isEditing ? '❌ Hủy' : '✏️ Chỉnh Sửa'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên Cửa Hàng</label>
                <input
                  type="text"
                  value={shopInfo.shopName}
                  onChange={(e) => setShopInfo({ ...shopInfo, shopName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên Chủ Cửa Hàng</label>
                <input
                  type="text"
                  value={shopInfo.ownerName}
                  onChange={(e) => setShopInfo({ ...shopInfo, ownerName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số Điện Thoại</label>
                <input
                  type="tel"
                  value={shopInfo.phone}
                  onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={shopInfo.email}
                  onChange={(e) => setShopInfo({ ...shopInfo, email: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Địa Chỉ Cửa Hàng</label>
                <input
                  type="text"
                  value={shopInfo.address}
                  onChange={(e) => setShopInfo({ ...shopInfo, address: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Mô Tả Cửa Hàng</label>
                <textarea
                  value={shopInfo.description}
                  onChange={(e) => setShopInfo({ ...shopInfo, description: e.target.value })}
                  disabled={!isEditing}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Giấy Phép Kinh Doanh</label>
                <input
                  type="text"
                  value={shopInfo.businessLicense}
                  disabled
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-lg bg-green-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Mã Số Thuế</label>
                <input
                  type="text"
                  value={shopInfo.tax}
                  disabled
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-lg bg-green-50 cursor-not-allowed"
                />
              </div>
            </div>

            {isEditing && (
              <button
                onClick={handleSave}
                className="mt-6 w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5"
              >
                💾 Lưu Thay Đổi
              </button>
            )}
          </div>
        )}

        {/* Bank Info Tab */}
        {activeTab === 'bank' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Thông Tin Ngân Hàng</h2>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2 rounded-lg font-bold transition-all border-2 ${
                  isEditing
                    ? 'border-red-600 text-red-600 hover:bg-red-50'
                    : 'border-slate-400 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isEditing ? '❌ Hủy' : '✏️ Chỉnh Sửa'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên Ngân Hàng</label>
                <input
                  type="text"
                  value={bankInfo.bankName}
                  onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tên Chủ Tài Khoản</label>
                <input
                  type="text"
                  value={bankInfo.accountName}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Số Tài Khoản</label>
                <input
                  type="text"
                  value={bankInfo.accountNumber}
                  onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Chi Nhánh</label>
                <input
                  type="text"
                  value={bankInfo.branch}
                  onChange={(e) => setBankInfo({ ...bankInfo, branch: e.target.value })}
                  disabled={!isEditing}
                  className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Lưu ý:</strong> Thông tin ngân hàng được mã hóa an toàn. Hãy chắc chắn nhập đúng để tránh lỗi thanh toán.
              </p>
            </div>

            {isEditing && (
              <button
                onClick={handleSave}
                className="mt-6 w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5"
              >
                💾 Lưu Thay Đổi
              </button>
            )}
          </div>
        )}

        {/* Commission Tab */}
        {activeTab === 'commission' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
            <h2 className="text-2xl font-bold text-primary mb-6">Hoa Hồng & Phí</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-gradient-to-br from-primary/10 to-gold/10 rounded-xl border-2 border-primary/20">
                <p className="text-sm font-bold text-gray-700 mb-2">HTKH NỀN TẢNG</p>
                <p className="text-3xl font-black text-primary">5%</p>
                <p className="text-xs text-gray-600 mt-2">Được trừ từ mỗi đơn hàng</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl border-2 border-blue-300">
                <p className="text-sm font-bold text-gray-700 mb-2">PHÍ GIAO DỊCH</p>
                <p className="text-3xl font-black text-blue-600">2.9% + 2k</p>
                <p className="text-xs text-gray-600 mt-2">Phí thanh toán qua cổng</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-100 to-green-50 rounded-xl border-2 border-green-300">
                <p className="text-sm font-bold text-gray-700 mb-2">DOANH THU THỰC</p>
                <p className="text-3xl font-black text-green-600">92.1%</p>
                <p className="text-xs text-gray-600 mt-2">Nhận được từ mỗi đơn hàng</p>
              </div>
              <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl border-2 border-orange-300">
                <p className="text-sm font-bold text-gray-700 mb-2">ĐÃ THU THÁNG NÀY</p>
                <p className="text-3xl font-black text-orange-600">14.0M ₫</p>
                <p className="text-xs text-gray-600 mt-2">Sau khi trừ phí</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <h3 className="text-lg font-bold text-blue-900 mb-4">Bảng Tính Chi Tiết</h3>
              <div className="space-y-3 text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Tổng doanh thu từ đơn hàng:</span>
                  <span className="font-bold">15,200,000 ₫</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Hoa hồng nền tảng (5%):</span>
                  <span className="font-bold">760,000 ₫</span>
                </div>
                <div className="flex justify-between text-red-600">
                  <span>- Phí giao dịch (2.9% + 2k):</span>
                  <span className="font-bold">452,000 ₫</span>
                </div>
                <div className="border-t-2 border-blue-300 pt-3 flex justify-between">
                  <span>= Doanh thu thực nhận:</span>
                  <span className="font-bold text-green-600">13,988,000 ₫</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
            <h2 className="text-2xl font-bold text-primary mb-6">Cài Đặt Thông Báo</h2>
            <div className="space-y-4">
              {[
                { label: 'Thông báo đơn hàng mới', enabled: true },
                { label: 'Thông báo đánh giá từ khách', enabled: true },
                { label: 'Thông báo vấn đề/tranh chấp', enabled: true },
                { label: 'Thông báo rút tiền thành công', enabled: true },
                { label: 'Thông báo tin khuyến mãi', enabled: false },
              ].map((notif, idx) => (
                <label key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    defaultChecked={notif.enabled}
                    className="w-5 h-5 text-primary rounded"
                  />
                  <span className="font-semibold text-gray-700">{notif.label}</span>
                </label>
              ))}
            </div>

            <button className="mt-6 w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5">
              💾 Lưu Cài Đặt Thông Báo
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorSettings;
