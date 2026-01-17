import React, { useState } from 'react';

interface VendorDashboardProps {
  onNavigate: (path: string) => void;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settings'>('overview');

  const vendorStats = [
    { label: 'Tổng đơn hàng', value: '284' },
    { label: 'Đơn chờ xử lý', value: '12' },
    { label: 'Doanh thu tháng', value: '15.2M' },
    { label: 'Đánh giá trung bình', value: '4.8/5' }
  ];

  const pendingOrders = [
    { id: '#MRT-8829-2024', customer: 'Nguyễn Văn An', product: 'Mâm Cúng Đầy Tháng', amount: 2500000, time: '2 phút trước' },
    { id: '#MRT-8828-2024', customer: 'Trần Thị B', product: 'Gói Đại Phát - Khai Trương', amount: 4950000, time: '15 phút trước' },
    { id: '#MRT-8827-2024', customer: 'Lê Văn C', product: 'Gói Bình An - Tân Gia', amount: 1850000, time: '1 giờ trước' }
  ];

  const products = [
    { id: 1, name: 'Mâm Cúng Đầy Tháng Đặc Biệt', price: 2500000, stock: 15, orders: 127, rating: 4.9 },
    { id: 2, name: 'Gói Đại Phát - Khai Trương', price: 4950000, stock: 8, orders: 86, rating: 5.0 },
    { id: 3, name: 'Gói Bình An - Tân Gia', price: 1850000, stock: 25, orders: 92, rating: 4.8 }
  ];

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-black text-primary mb-2">Bảng Điều Khiển Nhà Cung Cấp</h1>
          <p className="text-slate-500">Quản lý sản phẩm, đơn hàng và doanh thu của bạn</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {vendorStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:shadow-lg transition-all">
              <p className="text-sm text-slate-500 mb-1 uppercase font-bold tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-primary">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white rounded-2xl p-2 border border-gray-200 shadow-sm overflow-x-auto">
          {['overview', 'products', 'orders', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (tab === 'overview') setActiveTab(tab as any);
                else if (tab === 'products') onNavigate('/vendor/products');
                else if (tab === 'orders') onNavigate('/vendor/orders');
                else if (tab === 'settings') onNavigate('/vendor/settings');
              }}
              className={`flex-1 md:flex-none md:px-6 py-3 rounded-lg font-bold text-sm uppercase transition-all tracking-wider whitespace-nowrap border-2 ${
                activeTab === tab
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-300 text-slate-500 hover:text-primary'
              }`}
            >
              {tab === 'overview' && 'Tổng quan'}
              {tab === 'products' && 'Sản phẩm'}
              {tab === 'orders' && 'Đơn hàng'}
              {tab === 'settings' && 'Cài đặt'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pending Orders */}
            <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-primary">
                  Đơn hàng chờ xử lý
                </h2>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-lg">{pendingOrders.length}</span>
              </div>
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary transition-all">
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">{order.id}</p>
                      <p className="font-bold text-primary">{order.product}</p>
                      <p className="text-xs text-slate-500 mt-1">{order.customer}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary tracking-tight mb-2">{order.amount.toLocaleString()}đ</p>
                      <p className="text-xs text-slate-400">{order.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 text-center hover:shadow-lg transition-all cursor-pointer">
                <h3 className="font-bold text-primary mb-2">Quản Lý Sản Phẩm</h3>
                <p className="text-xs text-slate-500 mb-4">Thêm, sửa, xóa sản phẩm</p>
                <button 
                  onClick={() => onNavigate('/vendor/products')}
                  className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                >
                  Quản Lý
                </button>
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 text-center hover:shadow-lg transition-all cursor-pointer">
                <h3 className="font-bold text-primary mb-2">Quản Lý Đơn Hàng</h3>
                <p className="text-xs text-slate-500 mb-4">Xem và xử lý đơn hàng</p>
                <button 
                  onClick={() => onNavigate('/vendor/orders')}
                  className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                >
                  Xem Đơn
                </button>
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 text-center hover:shadow-lg transition-all cursor-pointer">
                <h3 className="font-bold text-primary mb-2">Thống Kê & Báo Cáo</h3>
                <p className="text-xs text-slate-500 mb-4">Xem doanh số chi tiết</p>
                <button 
                  onClick={() => onNavigate('/vendor/analytics')}
                  className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                >
                  Báo Cáo
                </button>
              </div>
              <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 text-center hover:shadow-lg transition-all cursor-pointer">
                <h3 className="font-bold text-primary mb-2">Cài Đặt Cửa Hàng</h3>
                <p className="text-xs text-slate-500 mb-4">Quản lý thông tin cửa hàng</p>
                <button 
                  onClick={() => onNavigate('/vendor/settings')}
                  className="w-full border-2 border-primary text-primary py-2 rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                >
                  Cài Đặt
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gold/10 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-primary">Sản phẩm của bạn</h2>
              <button 
                onClick={() => onNavigate('/vendor/products')}
                className="bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-[#600018] transition-all"
              >
                Quản Lý Chi Tiết
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Tên sản phẩm</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Giá</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Tồn kho</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Đơn hàng</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Đánh giá</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-gray-200 hover:bg-gray-50 transition-all">
                      <td className="px-6 py-4 font-bold text-primary">{product.name}</td>
                      <td className="px-6 py-4 font-black text-primary">{product.price.toLocaleString()}đ</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                          product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-600">{product.orders}</td>
                      <td className="px-6 py-4 flex items-center gap-1 text-primary">
                        <span className="font-bold">★ {product.rating}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button className="text-primary hover:text-primary/70 transition-all text-sm font-bold">✎</button>
                          <button className="text-primary hover:text-red-600 transition-all text-sm font-bold">✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8">
            <h2 className="text-2xl font-bold text-primary mb-8">Tất cả đơn hàng</h2>
            <div className="space-y-4">
              {pendingOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary transition-all cursor-pointer group">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">{order.id}</p>
                    <p className="font-bold text-primary group-hover:text-primary transition-colors">{order.product}</p>
                    <p className="text-xs text-slate-500 mt-1">Khách: {order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary tracking-tight mb-2">{order.amount.toLocaleString()}đ</p>
                    <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-lg">Chờ xác nhận</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-[2rem] border border-gray-200 shadow-sm p-8 max-w-2xl">
            <h2 className="text-2xl font-bold text-primary mb-8">Cài đặt cửa hàng</h2>
            <form className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Tên cửa hàng</label>
                <input
                  type="text"
                  defaultValue="Mâm Cúng Hạnh Phúc"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Số điện thoại kinh doanh</label>
                <input
                  type="tel"
                  defaultValue="0901234567"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Địa chỉ</label>
                <input
                  type="text"
                  defaultValue="Quận 1, TP. HCM"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">Mô tả cửa hàng</label>
                <textarea
                  defaultValue="Chúng tôi cung cấp mâm cúng chất lượng cao với dịch vụ tư vấn chuyên nghiệp."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg hover:scale-105 transition-all"
              >
                Lưu thay đổi
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorDashboard;
