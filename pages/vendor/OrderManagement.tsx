import React, { useState } from 'react';

interface OrderManagementProps {
  onNavigate: (path: string) => void;
}

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  product: string;
  quantity: number;
  totalPrice: number;
  deliveryDate: string;
  deliveryTime: string;
  address: string;
  status: 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  orderDate: string;
}

const OrderManagement: React.FC<OrderManagementProps> = ({ onNavigate }) => {
  const [orders] = useState<Order[]>([
    {
      id: 'ORD-001',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0901234567',
      product: 'Mâm Cúng Đầy Tháng 5 Món',
      quantity: 1,
      totalPrice: 1200000,
      deliveryDate: '2025-01-15',
      deliveryTime: '07:00-09:00',
      address: '123 Nguyễn Huệ, Q1, TP.HCM',
      status: 'confirmed',
      paymentMethod: 'Momo',
      orderDate: '2025-01-13',
    },
    {
      id: 'ORD-002',
      customerName: 'Trần Thị B',
      customerPhone: '0912345678',
      product: 'Mâm Cúng Tân Gia 8 Món',
      quantity: 2,
      totalPrice: 3600000,
      deliveryDate: '2025-01-16',
      deliveryTime: '13:00-15:00',
      address: '456 Lê Lợi, Q3, TP.HCM',
      status: 'pending',
      paymentMethod: 'VietQR',
      orderDate: '2025-01-13',
    },
    {
      id: 'ORD-003',
      customerName: 'Phạm Minh C',
      customerPhone: '0923456789',
      product: 'Mâm Cúng Khai Trương Premium',
      quantity: 1,
      totalPrice: 2500000,
      deliveryDate: '2025-01-14',
      deliveryTime: '15:00-17:00',
      address: '789 Trần Hưng Đạo, Q5, TP.HCM',
      status: 'preparing',
      paymentMethod: 'Visa',
      orderDate: '2025-01-12',
    },
    {
      id: 'ORD-004',
      customerName: 'Hoàng Văn D',
      customerPhone: '0934567890',
      product: 'Mâm Cúng Đầy Tháng 5 Món',
      quantity: 1,
      totalPrice: 1200000,
      deliveryDate: '2025-01-13',
      deliveryTime: '09:00-11:00',
      address: '321 Ngô Đức Kế, Q1, TP.HCM',
      status: 'shipped',
      paymentMethod: 'Momo',
      orderDate: '2025-01-11',
    },
  ]);

  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-700',
      confirmed: 'bg-blue-100 text-blue-700',
      preparing: 'bg-purple-100 text-purple-700',
      shipped: 'bg-orange-100 text-orange-700',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      pending: '⏳ Chờ Duyệt',
      confirmed: '✓ Đã Duyệt',
      preparing: '📦 Đang Chuẩn Bị',
      shipped: '🚚 Đang Giao',
      delivered: '✅ Đã Giao',
      cancelled: '❌ Hủy',
    };
    return labels[status] || status;
  };

  const filteredOrders = filterStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-playfair font-bold text-primary mb-2">Quản Lý Đơn Hàng</h1>
          <p className="text-gray-600">Quản lý và theo dõi tất cả đơn hàng</p>
        </div>

        {/* Filter & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Tất Cả', value: 'all', color: 'border-slate-300' },
            { label: 'Chờ Duyệt', value: 'pending', color: 'border-yellow-400', count: orders.filter(o => o.status === 'pending').length },
            { label: 'Chuẩn Bị', value: 'preparing', color: 'border-purple-400', count: orders.filter(o => o.status === 'preparing').length },
            { label: 'Đang Giao', value: 'shipped', color: 'border-orange-400', count: orders.filter(o => o.status === 'shipped').length },
            { label: 'Đã Giao', value: 'delivered', color: 'border-green-600', count: orders.filter(o => o.status === 'delivered').length },
          ].map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-4 py-3 rounded-lg font-bold transition-all border-2 ${
                filterStatus === btn.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : `border-2 ${btn.color} text-gray-700 hover:bg-slate-50`
              }`}
            >
              <div className="text-sm">{btn.label}</div>
              {btn.count !== undefined && <div className="text-xs mt-1 opacity-75">{btn.count}</div>}
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-primary hover:shadow-xl transition-all cursor-pointer"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                {/* Order ID & Status */}
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">MÃ ĐƠN HÀNG</p>
                  <p className="text-lg font-black text-primary">{order.id}</p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Customer Info */}
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">KHÁCH HÀNG</p>
                  <p className="font-bold text-gray-800">{order.customerName}</p>
                  <p className="text-sm text-gray-600">{order.customerPhone}</p>
                </div>

                {/* Product & Quantity */}
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">SẢN PHẨM</p>
                  <p className="font-bold text-gray-800">{order.product}</p>
                  <p className="text-sm text-gray-600">Số lượng: {order.quantity}</p>
                </div>

                {/* Price & Payment */}
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">TỔNG TIỀN</p>
                  <p className="text-2xl font-black text-primary">{order.totalPrice.toLocaleString('vi-VN')} ₫</p>
                  <p className="text-xs text-gray-600 mt-1">{order.paymentMethod}</p>
                </div>
              </div>

              {/* Details Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gold/20">
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">NGÀY GIAO</p>
                  <p className="font-semibold text-gray-800">{order.deliveryDate} ({order.deliveryTime})</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">ĐỊA CHỈ GIAO</p>
                  <p className="font-semibold text-gray-800">{order.address}</p>
                </div>
                <div className="flex gap-2 items-end">
                  <button className="flex-1 px-4 py-2 border-2 border-slate-400 text-slate-600 rounded-lg font-bold text-sm transition-all hover:bg-slate-50">
                    📝 Chi Tiết
                  </button>
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button className="flex-1 px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm transition-all hover:bg-primary/5">
                      ✓ Cập Nhật
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-primary">
            <p className="text-gray-600 text-sm font-semibold mb-2">Tổng Đơn Hàng</p>
            <p className="text-3xl font-black text-primary">{orders.length}</p>
            <p className="text-xs text-gray-500 mt-2">Tháng này</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Đã Giao</p>
            <p className="text-3xl font-black text-green-600">{orders.filter(o => o.status === 'delivered').length}</p>
            <p className="text-xs text-gray-500 mt-2">Hoàn tất</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Chờ Xử Lý</p>
            <p className="text-3xl font-black text-yellow-600">{orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length}</p>
            <p className="text-xs text-gray-500 mt-2">Cần xử lý</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Tổng Doanh Thu</p>
            <p className="text-3xl font-black text-blue-600">{(orders.reduce((sum, o) => sum + o.totalPrice, 0) / 1000000).toFixed(1)}M ₫</p>
            <p className="text-xs text-gray-500 mt-2">Từ tất cả đơn</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderManagement;
