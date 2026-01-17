import React, { useState } from 'react';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'users' | 'orders' | 'disputes' | 'content'>('overview');

  const adminStats = [
    { label: 'Tổng doanh thu', value: '1.2B₫', icon: 'trending_up', color: 'text-green-600' },
    { label: 'Nhà cung cấp hoạt động', value: '156', icon: 'store', color: 'text-blue-600' },
    { label: 'Khách hàng hoạt động', value: '8,234', icon: 'people', color: 'text-purple-600' },
    { label: 'Đơn hàng ngày', value: '234', icon: 'shopping_cart_checkout', color: 'text-orange-600' }
  ];

  const recentOrders = [
    { id: '#MRT-8829', customer: 'Nguyễn Văn A', vendor: 'Mâm Cúng Hạnh Phúc', amount: 2500000, status: 'Đang giao', time: '10 phút trước' },
    { id: '#MRT-8828', customer: 'Trần Thị B', vendor: 'Lễ Vật An Khang', amount: 4950000, status: 'Hoàn tất', time: '1 giờ trước' },
    { id: '#MRT-8827', customer: 'Lê Văn C', vendor: 'Mâm Cúng Tâm Linh', amount: 1850000, status: 'Chờ xác nhận', time: '2 giờ trước' }
  ];

  const pendingVendors = [
    { id: 1, name: 'Lễ Vật Phương Đông', city: 'TP. HCM', submitted: '3 ngày trước', docs: 'Đầy đủ' },
    { id: 2, name: 'Mâm Cúng Đất Việt', city: 'Hà Nội', submitted: '5 ngày trước', docs: 'Đầy đủ' },
    { id: 3, name: 'Cúng Lễ An Phúc', city: 'Đà Nẵng', submitted: '1 tuần trước', docs: 'Thiếu CCCD' }
  ];

  const disputes = [
    { id: '#DIS-001', complaint: 'Sản phẩm không đúng với mô tả', customer: 'Trần Hương', vendor: 'Mâm Cúng A', status: 'Chờ xử lý', date: '2024-01-12' },
    { id: '#DIS-002', complaint: 'Giao hàng quá trễ', customer: 'Lê Minh', vendor: 'Lễ Vật B', status: 'Đang xử lý', date: '2024-01-11' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-ritual-bg via-white to-gold/5 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-black text-primary mb-2">🛡️ Bảng Điều Khiển Quản Trị Viên</h1>
          <p className="text-slate-500">Quản lý nền tảng, nhà cung cấp, khách hàng và đơn hàng</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {adminStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 hover:shadow-lg transition-all">
              <div className="flex items-start justify-between mb-4">
                <span className={`material-symbols-outlined text-3xl ${stat.color}`}>{stat.icon}</span>
                {idx === 0 && <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">+8.5%</span>}
              </div>
              <p className="text-sm text-slate-500 mb-1 uppercase font-bold tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-2 border border-gold/10 shadow-sm overflow-x-auto sticky top-24 z-40">
          {['overview', 'vendors', 'users', 'orders', 'disputes', 'content'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 md:flex-none md:px-6 py-3 rounded-lg font-bold text-sm uppercase transition-all tracking-wider whitespace-nowrap ${
                activeTab === tab
                  ? 'border-2 border-primary text-primary bg-primary/5'
                  : 'text-slate-500 hover:text-primary'
              }`}
            >
              {tab === 'overview' && '📊 Tổng quan'}
              {tab === 'vendors' && '🏪 Nhà cung cấp'}
              {tab === 'users' && '👥 Người dùng'}
              {tab === 'orders' && '📦 Đơn hàng'}
              {tab === 'disputes' && '⚠️ Tranh chấp'}
              {tab === 'content' && '📰 Nội dung'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Orders */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined">receipt_long</span>
                Đơn hàng gần đây
              </h2>
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-ritual-bg rounded-xl border border-gold/10 hover:border-primary transition-all">
                    <div className="flex-1">
                      <p className="text-xs font-bold uppercase text-gold tracking-widest mb-1">{order.id}</p>
                      <p className="font-bold text-primary">{order.customer} → {order.vendor}</p>
                      <p className="text-xs text-slate-500 mt-1">{order.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary tracking-tight mb-2">{order.amount.toLocaleString()}₫</p>
                      <span className={`inline-block text-xs font-bold px-3 py-1 rounded-lg ${
                        order.status === 'Hoàn tất' ? 'bg-green-100 text-green-700' : 
                        order.status === 'Đang giao' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8 text-center hover:shadow-lg transition-all">
                <span className="material-symbols-outlined text-5xl text-gold mb-4 block">verified_user</span>
                <h3 className="font-bold text-primary mb-2">Xác minh nhà cung cấp</h3>
                <p className="text-xs text-slate-500 mb-4">{pendingVendors.length} chờ xử lý</p>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                >
                  Xem ngay
                </button>
              </div>

              <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8 text-center hover:shadow-lg transition-all">
                <span className="material-symbols-outlined text-5xl text-gold mb-4 block">warning</span>
                <h3 className="font-bold text-primary mb-2">Tranh chấp</h3>
                <p className="text-xs text-slate-500 mb-4">{disputes.length} cần xử lý</p>
                <button
                  onClick={() => setActiveTab('disputes')}
                  className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                >
                  Xem ngay
                </button>
              </div>

              <div className="bg-primary/10 p-8 rounded-[2rem] border border-primary/20 text-center">
                <span className="material-symbols-outlined text-5xl text-primary mb-4 block">settings</span>
                <h3 className="font-bold text-primary mb-2">Cài đặt hệ thống</h3>
                <p className="text-xs text-slate-600 mb-4">Quản lý cấu hình toàn cục</p>
                <button className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all">
                  Truy cập
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gold/10">
              <h2 className="text-2xl font-bold text-primary">Quản Lý Nhà Cung Cấp</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-ritual-bg border-b border-gold/10">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Tên cửa hàng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Địa chỉ</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Ngày đăng ký</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Tài liệu</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingVendors.map((vendor) => (
                    <tr key={vendor.id} className="border-b border-gold/10 hover:bg-ritual-bg transition-all">
                      <td className="px-6 py-4 font-bold text-primary">{vendor.name}</td>
                      <td className="px-6 py-4 text-slate-600">{vendor.city}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{vendor.submitted}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          vendor.docs === 'Đầy đủ' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {vendor.docs}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg font-bold text-xs hover:bg-green-50 transition-all">
                            Phê duyệt
                          </button>
                          <button className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-bold text-xs hover:bg-red-50 transition-all">
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-primary mb-8">Xử Lý Tranh Chấp</h2>
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="p-6 bg-ritual-bg rounded-xl border border-gold/10 hover:border-primary transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-gold tracking-widest mb-1">{dispute.id}</p>
                      <h3 className="text-lg font-bold text-primary mb-2">{dispute.complaint}</h3>
                      <div className="flex gap-4 text-sm text-slate-600">
                        <span>👤 {dispute.customer}</span>
                        <span>🏪 {dispute.vendor}</span>
                        <span>📅 {dispute.date}</span>
                      </div>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                      dispute.status === 'Chờ xử lý' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {dispute.status}
                    </span>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-gold/10">
                    <button className="flex-1 px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all">
                      Xem chi tiết
                    </button>
                    <button className="px-4 py-2 border-2 border-orange-600 text-orange-600 rounded-lg font-bold text-sm hover:bg-orange-50 transition-all">
                      Hoàn tiền
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'content' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
              <h3 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined">image</span>
                Biểu ngữ & Nội dung
              </h3>
              <div className="space-y-4">
                <button className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold uppercase hover:bg-primary/5 transition-all">
                  + Tạo biểu ngữ mới
                </button>
                <button className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold uppercase hover:bg-primary/5 transition-all">
                  + Thêm sản phẩm nổi bật
                </button>
                <button className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold uppercase hover:bg-primary/5 transition-all">
                  + Quản lý danh mục
                </button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
              <h3 className="text-2xl font-bold text-primary mb-8 flex items-center gap-2">
                <span className="material-symbols-outlined">tune</span>
                Cài đặt tài chính
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Hoa hồng sàn (%)</label>
                  <input type="number" defaultValue="10" className="w-full px-4 py-2 rounded-lg border border-gold/10 bg-ritual-bg" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase text-slate-400 block mb-2">Phí giao dịch (%)</label>
                  <input type="number" defaultValue="2.5" className="w-full px-4 py-2 rounded-lg border border-gold/10 bg-ritual-bg" />
                </div>
                <button className="w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold uppercase hover:bg-primary/5 transition-all">
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
