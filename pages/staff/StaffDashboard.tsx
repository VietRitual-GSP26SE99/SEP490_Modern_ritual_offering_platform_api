import React, { useState } from 'react';
import { logoutAndRedirect } from '../../services/auth';

interface StaffDashboardProps {
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

interface Order {
  id: string;
  customer: string;
  items: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  date: string;
  priority: 'high' | 'normal' | 'low';
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'support'>('overview');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Mock data
  const orders: Order[] = [
    {
      id: 'ORD-001',
      customer: 'Nguyễn Văn A',
      items: 'Mâm cúng Rằm tháng 8 (Premium)',
      status: 'pending',
      total: 1500000,
      date: '2025-02-05 10:30',
      priority: 'high'
    },
    {
      id: 'ORD-002',
      customer: 'Trần Thị B',
      items: 'Mâm cúng Tất Niên (Special)',
      status: 'processing',
      total: 2000000,
      date: '2025-02-05 09:15',
      priority: 'high'
    },
    {
      id: 'ORD-003',
      customer: 'Lê Văn C',
      items: 'Mâm cúng Gia Tiên (Standard)',
      status: 'completed',
      total: 800000,
      date: '2025-02-04 14:20',
      priority: 'normal'
    },
    {
      id: 'ORD-004',
      customer: 'Phạm Thị D',
      items: 'Mâm cúng Khai Trương (Premium)',
      status: 'processing',
      total: 1800000,
      date: '2025-02-05 08:45',
      priority: 'normal'
    },
  ];

  const stats = [
    { label: 'Đơn hàng chờ xử lý', value: '12', change: '+3', icon: '📋' },
    { label: 'Đơn hàng đang xử lý', value: '8', change: '+2', icon: '⚙️' },
    { label: 'Đơn hàng hoàn thành', value: '45', change: '+5', icon: '✅' },
    { label: 'Yêu cầu hỗ trợ', value: '3', change: '0', icon: '💬' },
  ];

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
    }
  };

  const getPriorityColor = (priority: Order['priority']) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'normal': return 'text-gray-600';
      case 'low': return 'text-blue-600';
    }
  };

  const handleUpdateStatus = (orderId: string, newStatus: Order['status']) => {
    console.log('Updating order', orderId, 'to', newStatus);
    // Implement status update logic
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-gray-900 to-gray-700 rounded-full flex items-center justify-center">
                <span className="text-xl text-white font-playfair font-bold">M</span>
              </div>
              <div>
                <h1 className="text-xl font-playfair font-bold text-gray-900">Modern Ritual</h1>
                <p className="text-xs text-gray-600">Bảng điều khiển nhân viên</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-gray-900">Nhân Viên Hỗ Trợ</p>
                <p className="text-xs text-gray-600">nhanvien@demo.com</p>
              </div>
              <button
                onClick={() => {
                  console.log('🚪 Logging out from Staff Dashboard...');
                  logoutAndRedirect();
                }}
                className="px-4 py-2 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition-all"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white p-2 rounded-xl border-2 border-gray-200 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📊 Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            📦 Đơn hàng
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
              activeTab === 'support'
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            💬 Hỗ trợ
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{stat.icon}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      stat.change.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
                  <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Recent Orders */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Đơn hàng gần đây</h2>
              <div className="space-y-3">
                {orders.slice(0, 3).map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-900 transition-all cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-gray-900">{order.id}</span>
                        <span className={`px-2 py-1 rounded text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.priority === 'high' && (
                          <span className="text-red-600 text-xs font-bold">⚠️ Ưu tiên cao</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{order.customer} - {order.items}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        {order.total.toLocaleString('vi-VN')}₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quản lý nâng cao</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button 
                  onClick={() => onNavigate('staff-posts')}
                  className="p-4 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all text-left"
                >
                  <div className="text-2xl mb-2">📝</div>
                  <h3 className="font-bold mb-1">Quản lý bài đăng</h3>
                  <p className="text-sm text-gray-300">Tạo và chỉnh sửa nội dung</p>
                </button>
                <button 
                  onClick={() => onNavigate('staff-customers')}
                  className="p-4 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">👥</div>
                  <h3 className="font-bold mb-1">Quản lý khách hàng</h3>
                  <p className="text-sm text-gray-600">Xem thông tin khách hàng</p>
                </button>
                <button 
                  onClick={() => onNavigate('staff-settings')}
                  className="p-4 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all text-left"
                >
                  <div className="text-2xl mb-2">⚙️</div>
                  <h3 className="font-bold mb-1">Cài đặt hệ thống</h3>
                  <p className="text-sm text-gray-600">Cấu hình nền tảng</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quản lý đơn hàng</h2>
              <div className="flex gap-2">
                <button className="px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-lg hover:border-gray-900 hover:text-gray-900 transition-all">
                  🔍 Tìm kiếm
                </button>
                <button className="px-4 py-2 border-2 border-gray-200 text-gray-600 rounded-lg hover:border-gray-900 hover:text-gray-900 transition-all">
                  🔄 Lọc
                </button>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-900">Mã đơn</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-900">Khách hàng</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-900">Sản phẩm</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-900">Trạng thái</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-900">Tổng tiền</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-900">Ngày</th>
                    <th className="text-left py-3 px-4 text-sm font-bold text-gray-900">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-900">{order.id}</span>
                        {order.priority === 'high' && (
                          <span className="ml-2 text-red-600">⚠️</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-700">{order.customer}</td>
                      <td className="py-4 px-4 text-gray-600 text-sm">{order.items}</td>
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-semibold text-gray-900">
                        {order.total.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">{order.date}</td>
                      <td className="py-4 px-4">
                        <select
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value as Order['status'])}
                          className="px-3 py-1 border-2 border-gray-200 rounded-lg text-sm font-semibold focus:border-gray-900 focus:outline-none"
                          defaultValue={order.status}
                        >
                          <option value="pending">Chờ xử lý</option>
                          <option value="processing">Đang xử lý</option>
                          <option value="completed">Hoàn thành</option>
                          <option value="cancelled">Hủy</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === 'support' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Yêu cầu hỗ trợ</h2>
              
              <div className="space-y-4">
                {[
                  {
                    id: 'SUP-001',
                    customer: 'Nguyễn Văn A',
                    subject: 'Hỏi về thay đổi địa chỉ giao hàng',
                    status: 'open',
                    time: '10:30'
                  },
                  {
                    id: 'SUP-002',
                    customer: 'Trần Thị B',
                    subject: 'Cần tư vấn về loại mâm cúng',
                    status: 'in-progress',
                    time: '09:15'
                  },
                  {
                    id: 'SUP-003',
                    customer: 'Lê Văn C',
                    subject: 'Phản hồi về chất lượng sản phẩm',
                    status: 'resolved',
                    time: '08:45'
                  }
                ].map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-gray-900 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900">{ticket.id}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          ticket.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                          ticket.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {ticket.status === 'open' ? 'Mới' : ticket.status === 'in-progress' ? 'Đang xử lý' : 'Đã giải quyết'}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{ticket.time}</span>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 mb-1">{ticket.subject}</p>
                    <p className="text-sm text-gray-600">Từ: {ticket.customer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Ghi chú nhanh</h2>
              <textarea
                className="w-full h-32 p-4 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:outline-none resize-none"
                placeholder="Nhập ghi chú về công việc hôm nay..."
              />
              <button className="mt-4 px-6 py-2 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                Lưu ghi chú
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-2xl w-full border-2 border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Chi tiết đơn hàng</h2>
                <p className="text-gray-600">{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-500 hover:text-gray-900 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Khách hàng</p>
                <p className="font-semibold text-gray-900">{selectedOrder.customer}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Sản phẩm</p>
                <p className="font-semibold text-gray-900">{selectedOrder.items}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600 mb-1">Tổng tiền</p>
                  <p className="font-bold text-gray-900 text-lg">
                    {selectedOrder.total.toLocaleString('vi-VN')}₫
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="flex-1 py-3 bg-gray-900 text-white rounded-lg font-semibold hover:bg-gray-800 transition-all">
                  Cập nhật trạng thái
                </button>
                <button className="flex-1 py-3 border-2 border-gray-900 text-gray-900 rounded-lg font-semibold hover:bg-gray-50 transition-all">
                  Liên hệ khách hàng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffDashboard;
