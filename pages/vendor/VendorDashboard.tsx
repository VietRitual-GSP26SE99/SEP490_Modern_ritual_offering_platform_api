import React, { useEffect, useState } from 'react';
import { orderService, VendorOrder } from '../../services/orderService';

interface VendorDashboardProps {
  onNavigate: (path: string) => void;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'settings'>('overview');
  const [allVendorOrders, setAllVendorOrders] = useState<VendorOrder[]>([]);
  const [paidPendingOrders, setPaidPendingOrders] = useState<VendorOrder[]>([]);
  const [isLoadingPaidPendingOrders, setIsLoadingPaidPendingOrders] = useState(false);
  const [paidPendingOrdersError, setPaidPendingOrdersError] = useState<string | null>(null);

  const normalizeStatus = (status: string): string => String(status || '').trim().toLowerCase();

  const formatRelativeTime = (value: string): string => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return 'Vừa xong';
    }

    const diffMs = Date.now() - parsed.getTime();
    if (diffMs < 60_000) return 'Vừa xong';
    if (diffMs < 3_600_000) return `${Math.floor(diffMs / 60_000)} phút trước`;
    if (diffMs < 86_400_000) return `${Math.floor(diffMs / 3_600_000)} giờ trước`;
    return `${Math.floor(diffMs / 86_400_000)} ngày trước`;
  };

  const getOrderTitle = (order: VendorOrder): string => {
    if (!order.items || order.items.length === 0) return 'Đơn hàng không có sản phẩm';
    if (order.items.length === 1) {
      return order.items[0].packageName || order.items[0].variantName || 'Sản phẩm';
    }

    const firstItemName = order.items[0].packageName || order.items[0].variantName || 'Sản phẩm';
    return `${firstItemName} (+${order.items.length - 1} sản phẩm)`;
  };

  const getDisplayCustomerName = (order: VendorOrder): string => {
    const name = String(order.customerName || '').trim();
    const normalizedName = name.toLowerCase();
    const isPlaceholderName = !name || normalizedName === 'khách hàng' || normalizedName === 'customer' || normalizedName === 'n/a';
    if (!isPlaceholderName) return name;

    const profileId = String(order.customerProfileId || '').trim();
    if (profileId) return `Mã KH: ${profileId.slice(0, 8).toUpperCase()}`;

    return 'Khách hàng';
  };

  const formatRevenue = (value: number): string => `${Math.max(0, value).toLocaleString('vi-VN')}đ`;

  const loadPaidPendingOrders = async () => {
    setIsLoadingPaidPendingOrders(true);
    setPaidPendingOrdersError(null);

    try {
      const orders = await orderService.getVendorOrders();
      setAllVendorOrders(orders);

      const filtered = orders
        .filter((order) => normalizeStatus(order.orderStatus) === 'paid')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const enriched = await Promise.all(
        filtered.map(async (order) => {
          const rawName = String(order.customerName || '').trim();
          const normalizedName = rawName.toLowerCase();
          const hasName = rawName.length > 0 && normalizedName !== 'khách hàng' && normalizedName !== 'customer' && normalizedName !== 'n/a';
          if (hasName) {
            return order;
          }

          try {
            const detail = await orderService.getOrderDetails(order.orderId);
            const detailedName = String(detail?.customer?.fullName || '').trim();
            if (!detailedName) {
              return order;
            }

            return {
              ...order,
              customerName: detailedName,
            };
          } catch {
            return order;
          }
        }),
      );

      setPaidPendingOrders(enriched);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải đơn hàng đã thanh toán.';
      setPaidPendingOrdersError(message);
      setAllVendorOrders([]);
      setPaidPendingOrders([]);
    } finally {
      setIsLoadingPaidPendingOrders(false);
    }
  };

  useEffect(() => {
    loadPaidPendingOrders();
  }, []);

  const monthlyRevenue = allVendorOrders
    .filter((order) => {
      const date = new Date(order.createdAt);
      if (Number.isNaN(date.getTime())) return false;

      const now = new Date();
      if (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear()) {
        return false;
      }

      const status = normalizeStatus(order.orderStatus);
      return status !== 'cancelled' && status !== 'paymentfailed';
    })
    .reduce((sum, order) => sum + Number(order.vendorNetAmount || order.totalAmount || 0), 0);

  const vendorStats = [
    { label: 'Tổng đơn hàng', value: String(allVendorOrders.length) },
    { label: 'Đơn chờ xử lý', value: String(paidPendingOrders.length) },
    { label: 'Doanh thu tháng', value: formatRevenue(monthlyRevenue) },
    { label: 'Đánh giá trung bình', value: '4.8/5' }
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
              className={`flex-1 md:flex-none md:px-6 py-3 rounded-lg font-bold text-sm uppercase transition-all tracking-wider whitespace-nowrap border-2 ${activeTab === tab
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
                  Đơn hàng đã thanh toán chờ xử lý
                </h2>
                <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-lg">{paidPendingOrders.length}</span>
              </div>
              <div className="space-y-4">
                {isLoadingPaidPendingOrders && (
                  <div className="p-4 text-sm text-slate-500 bg-gray-50 rounded-xl border border-gray-200">Đang tải đơn hàng...</div>
                )}

                {!isLoadingPaidPendingOrders && paidPendingOrdersError && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-100">
                    <p className="text-sm text-red-600 font-semibold mb-3">{paidPendingOrdersError}</p>
                    <button
                      onClick={loadPaidPendingOrders}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-xs font-bold uppercase hover:bg-red-100 transition-all"
                    >
                      Thử lại
                    </button>
                  </div>
                )}

                {!isLoadingPaidPendingOrders && !paidPendingOrdersError && paidPendingOrders.length === 0 && (
                  <div className="p-4 text-sm text-slate-500 bg-gray-50 rounded-xl border border-gray-200">
                    Chưa có đơn hàng đã thanh toán đang chờ xử lý.
                  </div>
                )}

                {!isLoadingPaidPendingOrders && !paidPendingOrdersError && paidPendingOrders.map((order) => (
                  <div
                    key={order.orderId}
                    onClick={() => onNavigate('/vendor/orders')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary transition-all cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">#{order.orderId}</p>
                      <p className="font-bold text-primary">{getOrderTitle(order)}</p>
                      <p className="text-xs text-slate-500 mt-1">Khách: {getDisplayCustomerName(order)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-primary tracking-tight mb-2">{Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
                      <p className="text-xs text-slate-400">{formatRelativeTime(order.createdAt)}</p>
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
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold ${product.stock > 10 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
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
              {paidPendingOrders.map((order) => (
                <div key={order.orderId} className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-200 hover:border-primary transition-all cursor-pointer group">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">#{order.orderId}</p>
                    <p className="font-bold text-primary group-hover:text-primary transition-colors">{getOrderTitle(order)}</p>
                    <p className="text-xs text-slate-500 mt-1">Khách: {getDisplayCustomerName(order)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-primary tracking-tight mb-2">{Number(order.totalAmount || 0).toLocaleString('vi-VN')}đ</p>
                    <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1 rounded-lg">Đã thanh toán</span>
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
