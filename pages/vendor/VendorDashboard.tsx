import React, { useEffect, useState } from 'react';
import { orderService, VendorOrder } from '../../services/orderService';

interface VendorDashboardProps {
  onNavigate: (path: string) => void;
}

const VendorDashboard: React.FC<VendorDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders' | 'shippings' | 'settings'>('overview');
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
    <div className="space-y-12">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {vendorStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-gold/10 shadow-sm p-6 hover:shadow-lg transition-all">
            <p className="text-sm text-slate-500 mb-1 uppercase font-bold tracking-widest">{stat.label}</p>
            <p className="text-2xl font-black text-primary">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Orders */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined">pending_actions</span>
              Đơn hàng chờ xử lý
            </h2>
            <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-lg">{paidPendingOrders.length}</span>
          </div>
          <div className="space-y-4">
            {isLoadingPaidPendingOrders && (
              <div className="p-8 text-center text-slate-500">Đang tải đơn hàng...</div>
            )}

            {!isLoadingPaidPendingOrders && paidPendingOrdersError && (
              <div className="p-8 text-center">
                <p className="text-sm text-red-600 font-semibold mb-3">{paidPendingOrdersError}</p>
                <button
                  onClick={loadPaidPendingOrders}
                  className="px-6 py-2 border-2 border-primary text-primary rounded-lg text-xs font-bold uppercase hover:bg-primary/5 transition-all"
                >
                  Thử lại
                </button>
              </div>
            )}

            {!isLoadingPaidPendingOrders && !paidPendingOrdersError && paidPendingOrders.length === 0 && (
              <div className="p-8 text-center text-slate-500 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                Chưa có đơn hàng đã thanh toán đang chờ xử lý.
              </div>
            )}

            {!isLoadingPaidPendingOrders && !paidPendingOrdersError && paidPendingOrders.map((order) => (
              <div
                key={order.orderId}
                onClick={() => onNavigate('/vendor/orders')}
                className="flex items-center justify-between p-5 bg-ritual-bg/30 rounded-2xl border border-gold/10 hover:border-primary transition-all cursor-pointer group"
              >
                <div>
                  <p className="text-[10px] font-bold uppercase text-gold tracking-[0.2em] mb-1">#{order.orderId}</p>
                  <p className="font-bold text-primary group-hover:text-gold transition-colors">{getOrderTitle(order)}</p>
                  <p className="text-xs text-slate-500 mt-1">Khách: {getDisplayCustomerName(order)}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-primary tracking-tight mb-2">{Number(order.totalAmount || 0).toLocaleString('vi-VN')}₫</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatRelativeTime(order.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Products Summary */}
        <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm p-8">
          <h3 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined">inventory</span>
            Sản phẩm nổi bật
          </h3>
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="p-4 bg-gray-50/50 rounded-xl border border-gray-100">
                <p className="font-bold text-sm text-primary mb-1">{product.name}</p>
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-gold">{product.price.toLocaleString()}₫</span>
                  <span className="text-slate-400">{product.orders} đơn</span>
                </div>
              </div>
            ))}
            <button
              onClick={() => onNavigate('/vendor/products')}
              className="w-full mt-4 py-3 border-2 border-primary text-primary rounded-xl font-bold text-xs uppercase hover:bg-primary/5 transition-all"
            >
              Tất cả sản phẩm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
