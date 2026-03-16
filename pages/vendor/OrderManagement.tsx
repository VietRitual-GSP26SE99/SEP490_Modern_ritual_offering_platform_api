import React, { useState, useEffect } from 'react';
import { orderService, VendorOrder, Order } from '../../services/orderService';
import { getProfile } from '../../services/auth';

interface OrderManagementProps {
  onNavigate: (path: string) => void;
}

const TABS = [
  { id: 'all',          label: 'Tất cả' },
  { id: 'Paid',         label: 'Đã thanh toán' },
  { id: 'Confirmed',    label: 'Đã xác nhận' },
  { id: 'Processing',   label: 'Đang xử lý' },
  { id: 'Delivering',   label: 'Đang giao' },
  { id: 'Delivered',    label: 'Đã giao' },
  { id: 'Completed',    label: 'Hoàn thành' },
  { id: 'Cancelled',    label: 'Đã hủy' },
  { id: 'Refunded',     label: 'Đã hoàn' },
  { id: 'PaymentFailed', label: 'Thanh toán lỗi' },
];

const formatVnd = (value: unknown): string => {
  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return '0đ';
  return `${amount.toLocaleString('vi-VN')}đ`;
};

const formatDateVi = (value: unknown): string => {
  if (!value) return 'N/A';
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('vi-VN');
};

const hasMeaningfulText = (value: unknown): boolean => {
  if (typeof value !== 'string') return false;
  const normalized = value.trim().toLowerCase();
  return normalized !== '' && normalized !== 'n/a' && normalized !== 'na' && normalized !== 'null' && normalized !== 'undefined';
};

const normalizeOrderStatus = (value: unknown): string => {
  const normalized = String(value || '').trim().toLowerCase();
  const statusMap: Record<string, string> = {
    paid: 'Paid',
    confirmed: 'Confirmed',
    processing: 'Processing',
    preparing: 'Processing',
    delivering: 'Delivering',
    shipping: 'Delivering',
    delivered: 'Delivered',
    completed: 'Completed',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
    paymentfailed: 'PaymentFailed',
    pending: 'Pending',
  };

  return statusMap[normalized] || String(value || '').trim();
};

const isCustomerPaid = (order: Order): boolean => {
  const paymentStatus = String(order.payment?.paymentStatus || '').trim().toLowerCase();
  if (['paid', 'success', 'completed'].some((keyword) => paymentStatus.includes(keyword))) {
    return true;
  }

  return ['Paid', 'Delivering', 'Completed', 'Delivered', 'Refunded']
    .includes(String(order.orderStatus || ''));
};

const parseOrderDate = (value: unknown): Date | null => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const toLocalYmd = (date: Date): string => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const OrderManagement: React.FC<OrderManagementProps> = ({ onNavigate }) => {
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [vendorShopName, setVendorShopName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusSuccessMsg, setStatusSuccessMsg] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  // Strict status transition flow
  const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
    Paid:          [{ value: 'Confirmed',  label: 'Xác nhận đơn' }, { value: 'Cancelled', label: 'Hủy đơn' }],
    Confirmed:     [{ value: 'Processing', label: 'Bắt đầu xử lý đơn' }, { value: 'Cancelled', label: 'Hủy đơn' }],
    Processing:    [{ value: 'Delivering', label: 'Bắt đầu giao hàng' }, { value: 'Cancelled', label: 'Hủy đơn' }],
    Delivering:    [{ value: 'Delivered',  label: 'Xác nhận đã giao' }],
    Delivered:     [],
    Completed:     [],
    Cancelled:     [{ value: 'Refunded',   label: 'Hoàn tiền' }],
    Refunded:      [],
    PaymentFailed: [{ value: 'Cancelled',  label: 'Hủy đơn' }],
    // Legacy statuses from old API
    Pending:       [{ value: 'Confirmed',  label: 'Xác nhận đơn' }, { value: 'Cancelled', label: 'Hủy đơn' }],
    Preparing:     [{ value: 'Processing', label: 'Chuyển sang đang xử lý' }, { value: 'Cancelled', label: 'Hủy đơn' }],
    Shipping:      [{ value: 'Delivered',  label: 'Xác nhận đã giao' }, { value: 'Cancelled', label: 'Hủy đơn' }],
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrderDetail || !newStatus) return;
    setStatusUpdating(true);
    setStatusUpdateError(null);
    setStatusSuccessMsg(null);
    try {
      if (newStatus === 'Cancelled') {
        await orderService.cancelOrder(selectedOrderDetail.orderId, statusReason);
      } else {
        await orderService.updateOrderStatus(selectedOrderDetail.orderId, newStatus, statusReason);
      }

      const [detail, list] = await Promise.all([
        orderService.getOrderDetails(selectedOrderDetail.orderId),
        orderService.getVendorOrders(),
      ]);
      setSelectedOrderDetail(detail);
      setOrders(list);
      setNewStatus('');
      setStatusReason('');
      if (newStatus === 'Delivered') {
        setStatusSuccessMsg('Đơn hàng đã giao thành công. Khách hàng sẽ xác nhận để hoàn thành đơn.');
      } else if (newStatus === 'Cancelled') {
        setStatusSuccessMsg('Đơn hàng đã được hủy thành công.');
      } else {
        setStatusSuccessMsg('Cập nhật trạng thái thành công!');
      }
    } catch (err: any) {
      setStatusUpdateError(err.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const openDetail = async (orderId: string) => {
    setSelectedOrderDetail(null);
    setDetailLoading(true);
    try {
      const detail = await orderService.getOrderDetails(orderId);
      setSelectedOrderDetail(detail);
    } catch {
      // silently fail — modal won't open
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const [data, profile] = await Promise.all([
          orderService.getVendorOrders(),
          getProfile().catch(() => null),
        ]);
        setOrders(data);
        setVendorShopName((profile?.shopName || '').trim());
      } catch (err) {
        setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
    Pending:       { badge: 'bg-yellow-100 text-yellow-700',   label: 'Chờ duyệt' },
    Confirmed:     { badge: 'bg-blue-100 text-blue-700',       label: 'Đã xác nhận' },
    Processing:    { badge: 'bg-violet-100 text-violet-700',   label: 'Đang xử lý' },
    Preparing:     { badge: 'bg-violet-100 text-violet-700',   label: 'Đang xử lý' },
    Paid:          { badge: 'bg-emerald-100 text-emerald-700', label: 'Đã thanh toán' },
    Delivering:    { badge: 'bg-orange-100 text-orange-700',   label: 'Đang giao' },
    Delivered:     { badge: 'bg-green-100 text-green-700',     label: 'Đã giao' },
    Completed:     { badge: 'bg-green-100 text-green-700',     label: 'Hoàn thành' },
    Cancelled:     { badge: 'bg-red-100 text-red-600',         label: 'Đã hủy' },
    Refunded:      { badge: 'bg-teal-100 text-teal-700',       label: 'Đã hoàn' },
    PaymentFailed: { badge: 'bg-rose-100 text-rose-700',       label: 'Thanh toán lỗi' },
    // Legacy
    Shipping:      { badge: 'bg-orange-100 text-orange-700',   label: 'Đang giao' },
  };

  const getStatusCfg = (status: string) => {
    const normalizedStatus = normalizeOrderStatus(status);
    return STATUS_CONFIG[normalizedStatus] ?? { badge: 'bg-gray-100 text-gray-600', label: normalizedStatus || 'N/A' };
  };

  const filteredOrders = orders
    .filter((order) => (filterStatus === 'all'
      ? true
      : normalizeOrderStatus(order.orderStatus) === filterStatus))
    .filter((order) => {
      const createdAt = parseOrderDate(order.createdAt);
      if (!createdAt) return !fromDate && !toDate;

      const createdYmd = toLocalYmd(createdAt);
      if (fromDate && createdYmd < fromDate) return false;
      if (toDate && createdYmd > toDate) return false;
      return true;
    })
    .sort((a, b) => {
      const bTime = parseOrderDate(b.createdAt)?.getTime() ?? Number.MIN_SAFE_INTEGER;
      const aTime = parseOrderDate(a.createdAt)?.getTime() ?? Number.MIN_SAFE_INTEGER;
      return bTime - aTime;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center bg-white rounded-3xl shadow-sm border border-gray-200 p-10 max-w-sm w-full">
          <p className="text-red-500 font-semibold text-base mb-6">⚠️ {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-primary font-display italic">Quản Lý Đơn Hàng</h1>
          <p className="text-slate-500 mt-2">Theo dõi và xử lý tất cả đơn hàng của gian hàng.</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng đơn', value: orders.length, color: 'text-primary' },
            { label: 'Đã giao', value: orders.filter(o => ['Delivered', 'Completed'].includes(normalizeOrderStatus(o.orderStatus))).length, color: 'text-green-600' },
            { label: 'Chờ xử lý', value: orders.filter(o => ['Paid', 'Confirmed', 'Processing', 'Delivering', 'Pending'].includes(normalizeOrderStatus(o.orderStatus))).length, color: 'text-amber-600' },
            { label: 'Doanh thu', value: `${(orders.reduce((s, o) => s + (Number(o.vendorNetAmount) || 0), 0) / 1000000).toFixed(1)}M ₫`, color: 'text-blue-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* <select
            value="createdAt"
            disabled
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-white"
          >
            <option value="createdAt">Ngày tạo</option>
          </select> */}
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
          <button
            onClick={() => { setFromDate(''); setToDate(''); }}
            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-gray-200 bg-white hover:bg-gray-50 transition"
          >
            Xóa lọc ngày
          </button>
        </div>

        <div className="flex flex-wrap gap-1 pb-4 mb-8 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`whitespace-nowrap px-5 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${
                filterStatus === tab.id
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders list */}
        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm text-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có đơn hàng nào</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Không có đơn hàng nào ở trạng thái này.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const cfg = getStatusCfg(order.orderStatus);
              return (
                <div key={order.orderId} className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">

                  {/* Card header */}
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-gray-100 bg-gray-50/50">
                    <div className="flex flex-col md:flex-row gap-4 md:items-center">
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Cửa hàng</span>
                        <span className="text-gray-900 font-semibold">{vendorShopName || order.vendorName || 'N/A'}</span>
                      </div>
                      <div className="hidden md:block w-px h-8 bg-gray-300"></div>
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Mã đơn hàng</span>
                        <span className="font-mono text-gray-900 font-bold text-base">#{order.orderId.slice(0, 8).toUpperCase()}</span>
                      </div>
                      <div className="hidden md:block w-px h-8 bg-gray-300"></div>
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Ngày đặt</span>
                        <span className="text-gray-900 font-medium">{formatDateVi(order.createdAt)}</span>
                      </div>
                      <div className="hidden md:block w-px h-8 bg-gray-300"></div>
                      <div>
                        <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Giao hàng</span>
                        <span className="text-gray-900 font-medium">{formatDateVi(order.deliveryDate)} lúc {order.deliveryTime?.slice(0, 5) || 'N/A'}</span>
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex-shrink-0 ${cfg.badge}`}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Card body */}
                  <div className="p-6 md:p-8">
                    {/* Customer + vendor row */}
                    {/* <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dashed border-gray-200">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Khách hàng</p>
                        <h4 className="font-bold text-gray-900 text-base">{order.customerName}</h4>
                        {hasMeaningfulText(order.customerPhone) && (
                          <p className="text-sm text-slate-500 mt-0.5">{order.customerPhone}</p>
                        )}
                      </div>
                      {hasMeaningfulText(order.paymentMethod) && (
                        <div className="ml-auto text-right">
                          <p className="text-xs text-slate-400 font-medium">Thanh toán</p>
                          <p className="font-semibold text-gray-700">{order.paymentMethod}</p>
                        </div>
                      )}
                    </div> */}

                    {/* Items */}
                    <div className="space-y-4">
                      {(order.items || []).map((item) => (
                        <div key={item.itemId} className="flex gap-4 items-center">
                          <div
                            className="size-16 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 bg-cover bg-center"
                            style={{ backgroundImage: 'url("https://picsum.photos/100?random=2")' }}
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-bold text-gray-800 text-base">{item.packageName}</h5>
                            <p className="text-sm text-slate-500 mt-0.5">Gói: {item.variantName}</p>
                            <p className="text-sm font-medium mt-0.5">x{item.quantity}</p>
                            {item.decorationNote && (
                              <p className="text-xs text-amber-600 mt-0.5 italic">{item.decorationNote}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-primary text-base">{formatVnd(item.lineTotal)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery address */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-1">Địa chỉ giao</p>
                      <p className="text-sm text-gray-700">{order.deliveryAddress}</p>
                    </div>
                  </div>

                  {/* Card footer */}
                  <div className="p-6 md:p-8 pt-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm text-gray-500">Tổng tiền:</span>
                        <span className="text-2xl font-black text-primary">{formatVnd(order.totalAmount)}</span>
                      </div>
                      <p className="text-sm text-green-600 font-semibold mt-0.5">
                        Thực nhận: {formatVnd(order.vendorNetAmount)}
                        <span className="text-gray-400 font-normal ml-1">(sau {((Number(order.commissionRate) || 0) * 100).toFixed(0)}% phí)</span>
                      </p>
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto">
                      <button
                        onClick={() => openDetail(order.orderId)}
                        disabled={detailLoading}
                        className="flex-1 sm:flex-none bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-60"
                      >
                        {detailLoading ? 'Đang tải...' : 'Xem chi tiết'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Loading overlay while fetching detail */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary mb-3"></div>
            <p className="text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrderDetail && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={() => setSelectedOrderDetail(null)}
        >
          <div
            className="bg-gray-50 w-full max-w-3xl my-8 rounded-[2rem] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white px-8 py-6 flex items-center gap-4 border-b border-gray-100">
              <button
                onClick={() => setSelectedOrderDetail(null)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 hover:bg-gray-50 transition flex-shrink-0"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h2 className="text-2xl font-black text-gray-900 font-display">Chi tiết đơn hàng</h2>
                <p className="text-sm text-gray-500">Mã: #{selectedOrderDetail.orderId.substring(0, 8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">Shop: {vendorShopName || selectedOrderDetail.vendor?.shopName || 'N/A'}</p>
              </div>
            </div>

            {/* Status Banner */}
            <div className={`mx-6 mt-6 p-6 rounded-[1.5rem] border flex items-center justify-between ${getStatusCfg(selectedOrderDetail.orderStatus).badge}`}>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Trạng thái hiện tại</p>
                <h3 className="text-2xl font-black">{getStatusCfg(selectedOrderDetail.orderStatus).label}</h3>
              </div>
            </div>

            {/* Update status section – always visible */}
            <div className="mx-6 mt-4 bg-white rounded-[1.5rem] border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Cập nhật trạng thái</h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => { setNewStatus(e.target.value); setStatusUpdateError(null); }}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                >
                  <option value="">-- Chọn trạng thái mới --</option>
                  {(NEXT_STATUSES[normalizeOrderStatus(selectedOrderDetail.orderStatus)] ?? []).map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Ghi chú / lý do (tùy chọn)"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                <button
                  onClick={handleUpdateStatus}
                  disabled={!newStatus || statusUpdating}
                  className="bg-primary text-white font-bold px-6 py-2.5 rounded-xl hover:bg-primary/90 transition shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                >
                  {statusUpdating ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
              {statusUpdateError && (
                <p className="mt-2 text-xs text-red-500 font-medium">{statusUpdateError}</p>
              )}
              {(NEXT_STATUSES[normalizeOrderStatus(selectedOrderDetail.orderStatus)] ?? []).length === 0 && (
                <p className="mt-2 text-xs text-slate-500 font-medium">Không có trạng thái tiếp theo cho đơn này ở phía Vendor.</p>
              )}
              {statusSuccessMsg && (
                <div className="mt-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
                  {statusSuccessMsg}
                </div>
              )}
            </div>

            {/* Body grid */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Left – 2 cols */}
              <div className="md:col-span-2 space-y-5">

                {/* Vendor / customer card */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm relative overflow-hidden group">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    Người nhận
                  </h3>
                  <p className="font-bold text-xl text-primary">{selectedOrderDetail.customer.fullName}</p>
                  <div className="flex gap-4 mt-2 text-sm text-gray-500">
                    <span>{selectedOrderDetail.customer.phoneNumber}</span>
                    <span>{selectedOrderDetail.customer.email}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5 flex items-center gap-2 border-b border-gray-100 pb-4">
                    Danh sách gói lễ
                  </h3>
                  <div className="space-y-5">
                    {(selectedOrderDetail.items || []).map((item, idx) => (
                      <div key={item.itemId} className="flex gap-4 items-start">
                        <div className="size-16 rounded-2xl bg-gray-100 border border-gray-200 flex-shrink-0 relative overflow-hidden">
                          <img
                            src={`https://picsum.photos/200?random=${idx + 10}`}
                            alt={item.packageName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-bl-lg">
                            x{item.quantity}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <h5 className="font-bold text-gray-800">{item.packageName}</h5>
                          <p className="text-xs text-gray-500 mt-0.5">Gói: <span className="font-medium text-gray-700">{item.variantName}</span></p>
                          {item.decorationNote && (
                            <p className="text-xs text-amber-600 mt-1 italic">{item.decorationNote}</p>
                          )}
                        </div>
                        <div className="pt-0.5 text-right flex-shrink-0">
                          <p className="font-bold text-gray-800">{formatVnd(item.lineTotal)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cancel / Refund */}
                {(selectedOrderDetail.cancelReason || (Number(selectedOrderDetail.refundAmount) || 0) > 0) && (
                  <div className="bg-red-50 rounded-[1.5rem] border border-red-100 p-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-red-400">Thông tin hủy đơn</h4>
                    {selectedOrderDetail.cancelReason && (
                      <div>
                        <p className="text-xs text-red-400 mb-0.5">Lý do hủy</p>
                        <p className="text-sm text-gray-700 font-medium">{selectedOrderDetail.cancelReason}</p>
                      </div>
                    )}
                    {(Number(selectedOrderDetail.refundAmount) || 0) > 0 && (
                      <div>
                        <p className="text-xs text-red-400 mb-0.5">Số tiền hoàn</p>
                        <p className="font-black text-red-600 text-lg">{formatVnd(selectedOrderDetail.refundAmount)}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right – sidebar */}
              <div className="space-y-5">

                {/* Payment */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pb-3 border-b border-gray-100">Thanh toán</h3>
                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tạm tính ({(selectedOrderDetail.items || []).length} món)</span>
                      <span className="font-medium">{formatVnd(selectedOrderDetail.pricing?.subTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Phí giao hàng</span>
                      <span className="font-medium">{formatVnd(selectedOrderDetail.pricing?.shippingFee)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end border-t border-dashed border-gray-200 pt-3 mb-4">
                    <span className="text-sm font-bold text-gray-700">Tổng cộng</span>
                    <span className="text-2xl font-black text-primary">{formatVnd(selectedOrderDetail.pricing?.totalAmount)}</span>
                  </div>
                  <div className="space-y-1.5 text-xs border-t border-gray-100 pt-3">
                    <div className="flex justify-between text-red-400">
                      <span>Phí nền tảng ({((Number(selectedOrderDetail.pricing?.commissionRate) || 0) * 100).toFixed(0)}%)</span>
                      <span>−{formatVnd(selectedOrderDetail.pricing?.platformFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-green-600 bg-green-50 rounded-lg px-2 py-1.5">
                      <span>Thực nhận</span>
                      <span>{formatVnd(selectedOrderDetail.pricing?.vendorNetAmount)}</span>
                    </div>
                    {hasMeaningfulText(selectedOrderDetail.payment.paymentMethod) && (
                      <div className="flex justify-between text-gray-400 pt-1">
                        <span>Phương thức</span>
                        <span className="font-semibold text-gray-600">{selectedOrderDetail.payment.paymentMethod}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-gray-400">
                      <span>Thanh toán khách</span>
                      <span className={`font-semibold ${isCustomerPaid(selectedOrderDetail) ? 'text-green-600' : 'text-orange-500'}`}>
                        {isCustomerPaid(selectedOrderDetail) ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Chuyển khoản vendor</span>
                      <span className={`font-semibold ${selectedOrderDetail.payment.isPaidToVendor ? 'text-green-600' : 'text-orange-500'}`}>
                        {selectedOrderDetail.payment.isPaidToVendor ? 'Đã chuyển' : 'Chưa chuyển'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Delivery */}
                <div className="bg-white p-6 rounded-[1.5rem] border border-gray-200 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pb-3 border-b border-gray-100">Giao hàng</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Thời gian phục vụ</p>
                      <p className="font-bold text-gray-800">
                        {formatDateVi(selectedOrderDetail.delivery?.deliveryDate)} lúc {selectedOrderDetail.delivery?.deliveryTime?.slice(0, 5) || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Người nhận</p>
                      <p className="font-medium text-sm text-gray-800">
                        <span className="font-bold">{selectedOrderDetail.customer.fullName}</span>
                        {selectedOrderDetail.customer.phoneNumber && (
                          <span className="text-gray-500 ml-1">- {selectedOrderDetail.customer.phoneNumber}</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Địa chỉ giao mâm</p>
                      <p className="font-medium text-sm text-gray-800 leading-relaxed">{selectedOrderDetail.delivery.deliveryAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Khoảng cách</p>
                      <p className="font-medium text-sm text-gray-800">{selectedOrderDetail.delivery.shippingDistanceKm} km</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
