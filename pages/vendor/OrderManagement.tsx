import React, { useState, useEffect, useCallback } from 'react';
import { orderService, VendorOrder, Order } from '../../services/orderService';
import { getProfile } from '../../services/auth';
import VendorRefundTab from './VendorRefundTab';


interface OrderManagementProps {
  onNavigate: (path: string) => void;
}


const ORDER_STATUS_TABS = [
  { id: 'all',           label: 'Tất cả' },
  { id: 'Paid',          label: 'Đã thanh toán' },
  { id: 'Confirmed',     label: 'Đã xác nhận' },
  { id: 'Processing',    label: 'Đang xử lý' },
  { id: 'Delivering',    label: 'Đang giao' },
  { id: 'Delivered',     label: 'Đã giao' },
  { id: 'Completed',     label: 'Hoàn thành' },
  { id: 'Cancelled',     label: 'Đã hủy' },
  { id: 'Refunded',      label: 'Đã hoàn' },
  { id: 'PaymentFailed', label: 'Thanh toán lỗi' },
];

const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  Paid:          [{ value: 'Confirmed',  label: 'Xác nhận đơn' },            { value: 'Cancelled', label: 'Hủy đơn' }],
  Confirmed:     [{ value: 'Processing', label: 'Bắt đầu xử lý đơn' },      { value: 'Cancelled', label: 'Hủy đơn' }],
  Processing:    [{ value: 'Delivering', label: 'Bắt đầu giao hàng' },      { value: 'Cancelled', label: 'Hủy đơn' }],
  Delivering:    [{ value: 'Delivered',  label: 'Xác nhận đã giao' }],
  Delivered:     [],
  Completed:     [],
  Cancelled:     [{ value: 'Refunded',   label: 'Hoàn tiền' }],
  Refunded:      [],
  PaymentFailed: [{ value: 'Cancelled',  label: 'Hủy đơn' }],
  Pending:       [{ value: 'Confirmed',  label: 'Xác nhận đơn' },            { value: 'Cancelled', label: 'Hủy đơn' }],
  Preparing:     [{ value: 'Processing', label: 'Chuyển sang đang xử lý' }, { value: 'Cancelled', label: 'Hủy đơn' }],
  Shipping:      [{ value: 'Delivered',  label: 'Xác nhận đã giao' },        { value: 'Cancelled', label: 'Hủy đơn' }],
};

const STATUS_BADGE: Record<string, { badge: string; label: string }> = {
  Pending:       { badge: 'bg-yellow-100 text-yellow-700',   label: 'Chờ duyệt' },
  Confirmed:     { badge: 'bg-blue-100   text-blue-700',     label: 'Đã xác nhận' },
  Processing:    { badge: 'bg-violet-100 text-violet-700',   label: 'Đang xử lý' },
  Preparing:     { badge: 'bg-violet-100 text-violet-700',   label: 'Đang xử lý' },
  Paid:          { badge: 'bg-emerald-100 text-emerald-700', label: 'Đã thanh toán' },
  Delivering:    { badge: 'bg-orange-100 text-orange-700',   label: 'Đang giao' },
  Delivered:     { badge: 'bg-green-100  text-green-700',    label: 'Đã giao' },
  Completed:     { badge: 'bg-green-100  text-green-700',    label: 'Hoàn thành' },
  Cancelled:     { badge: 'bg-red-100    text-red-600',      label: 'Đã hủy' },
  Refunded:      { badge: 'bg-purple-100 text-purple-600',   label: 'Đã hoàn tiền' },
  PaymentFailed: { badge: 'bg-red-100    text-red-700',      label: 'TT thất bại' },
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const formatVnd = (value: unknown): string => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? `${n.toLocaleString('vi-VN')}đ` : '0đ';
};

const formatDateVi = (value: unknown): string => {
  if (!value) return 'N/A';
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString('vi-VN');
};

const hasMeaningfulText = (v: unknown): boolean => {
  if (typeof v !== 'string') return false;
  const n = v.trim().toLowerCase();
  return n !== '' && n !== 'n/a' && n !== 'na' && n !== 'null' && n !== 'undefined';
};

const normalizeStatus = (v: unknown): string => {
  const map: Record<string, string> = {
    paid: 'Paid', confirmed: 'Confirmed', processing: 'Processing',
    preparing: 'Processing', delivering: 'Delivering', shipping: 'Delivering',
    delivered: 'Delivered', completed: 'Completed', cancelled: 'Cancelled',
    refunded: 'Refunded', paymentfailed: 'PaymentFailed', pending: 'Pending',
  };
  return map[String(v || '').trim().toLowerCase()] ?? String(v || '').trim();
};

const parseDate = (v: unknown): Date | null => {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

const toYmd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const getStatusBadge = (status: unknown) =>
  STATUS_BADGE[normalizeStatus(status)] ?? { badge: 'bg-gray-100 text-gray-600', label: String(status) };

// ─── Component ────────────────────────────────────────────────────────────────

const OrderManagement: React.FC<OrderManagementProps> = ({ onNavigate: _onNavigate }) => {
  // ── orders state ────────────────────────────────────────────────────────────
  const [orders, setOrders]               = useState<VendorOrder[]>([]);
  const [vendorShopName, setVendorShopName] = useState('');
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string | null>(null);
  const [filterStatus, setFilterStatus]   = useState('all');
  const [fromDate, setFromDate]           = useState('');
  const [toDate, setToDate]               = useState('');

  // ── detail modal state ──────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError]     = useState<string | null>(null);
  const [newStatus, setNewStatus]         = useState('');
  const [statusReason, setStatusReason]   = useState('');
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);

  // ── tab state ───────────────────────────────────────────────────────────────
  const [mainTab, setMainTab]             = useState<'orders' | 'refunds'>('orders');
  const [pendingRefunds, setPendingRefunds] = useState(0);

  // ── fetch orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [data, profile] = await Promise.all([
        orderService.getVendorOrders(),
        getProfile().catch(() => null),
      ]);
      setOrders(data);
      setVendorShopName((profile?.shopName || '').trim());
    } catch {
      setError('Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── update order status ─────────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    setStatusUpdating(true);
    setStatusError(null);
    setStatusSuccess(null);
    try {
      if (newStatus === 'Cancelled') {
        await orderService.cancelOrder(selectedOrder.orderId, statusReason);
      } else {
        await orderService.updateOrderStatus(selectedOrder.orderId, newStatus, statusReason);
      }
      const [detail, list] = await Promise.all([
        orderService.getOrderDetails(selectedOrder.orderId),
        orderService.getVendorOrders(),
      ]);
      setSelectedOrder(detail);
      setOrders(list);
      setNewStatus('');
      setStatusReason('');
      setStatusSuccess(
        newStatus === 'Delivered'  ? 'Đơn hàng đã giao thành công. Khách hàng sẽ xác nhận để hoàn thành đơn.' :
        newStatus === 'Cancelled'  ? 'Đơn hàng đã được hủy thành công.' :
        'Cập nhật trạng thái thành công!'
      );
    } catch (e: any) {
      setStatusError(e.message || 'Cập nhật thất bại. Vui lòng thử lại.');
    } finally {
      setStatusUpdating(false);
    }
  };

  const openDetail = async (orderId: string) => {
    setSelectedOrder(null);
    setDetailLoading(true);
    try {
      setSelectedOrder(await orderService.getOrderDetails(orderId));
    } catch { /* silently fail */ } finally {
      setDetailLoading(false);
    }
  };

  // ── derived ─────────────────────────────────────────────────────────────────
  const filteredOrders = orders
    .filter(o => filterStatus === 'all' || normalizeStatus(o.orderStatus) === filterStatus)
    .filter(o => {
      if (!fromDate && !toDate) return true;
      const d = parseDate(o.createdAt);
      if (!d) return false;
      const ymd = toYmd(d);
      if (fromDate && ymd < fromDate) return false;
      if (toDate   && ymd > toDate)   return false;
      return true;
    })
    .sort((a, b) => (parseDate(b.createdAt)?.getTime() ?? 0) - (parseDate(a.createdAt)?.getTime() ?? 0));

  // ── loading / error screens ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4" />
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
            onClick={fetchOrders}
            className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary/90 transition"
          >Thử lại</button>
        </div>
      </div>
    );
  }
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        <div className="mb-6">
          <h1 className="text-3xl font-black text-primary font-display italic">Quản Lý Đơn Hàng</h1>
          <p className="text-slate-500 mt-2">Theo dõi, xử lý đơn hàng và yêu cầu hoàn tiền của gian hàng.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Tổng đơn',      value: orders.length,                                                                                                color: 'text-primary' },
            { label: 'Đã giao',       value: orders.filter(o => ['Delivered','Completed'].includes(normalizeStatus(o.orderStatus))).length,              color: 'text-green-600' },
            { label: 'Chờ xử lý',     value: orders.filter(o => ['Paid','Confirmed','Processing','Delivering','Pending'].includes(normalizeStatus(o.orderStatus))).length, color: 'text-amber-600' },
            { label: 'Doanh thu',     value: `${(orders.reduce((s, o) => s + (Number(o.vendorNetAmount) || 0), 0) / 1_000_000).toFixed(1)}M ₫`,          color: 'text-blue-600' },
            { label: 'Yêu cầu hoàn', value: pendingRefunds,                                                                                              color: 'text-orange-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-fit">
          {(['orders', 'refunds'] as const).map(id => (
            <button
              key={id}
              onClick={() => setMainTab(id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
                mainTab === id
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
              }`}
            >
              {id === 'refunds' && pendingRefunds > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-black bg-orange-500 text-white rounded-full">
                  {pendingRefunds}
                </span>
              )}
              {id === 'orders' ? 'Đơn Hàng' : 'Yêu Cầu Hoàn Tiền'}
            </button>
          ))}
        </div>

       
        {mainTab === 'orders' && (
          <>
            {/* Date filter */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              <input type="date" value={toDate} min={fromDate || undefined} onChange={e => setToDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
              <button onClick={() => { setFromDate(''); setToDate(''); }}
                className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-gray-200 bg-white hover:bg-gray-50 transition">
                Xóa lọc ngày
              </button>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-1 pb-4 mb-8 border-b border-gray-200">
              {ORDER_STATUS_TABS.map(tab => (
                <button key={tab.id} onClick={() => setFilterStatus(tab.id)}
                  className={`whitespace-nowrap px-5 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${
                    filterStatus === tab.id
                      ? 'border-primary text-primary bg-primary/5'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-gray-100'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Order cards */}
            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm text-center">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có đơn hàng nào</h3>
                  <p className="text-gray-500">Không có đơn hàng nào ở trạng thái này.</p>
                </div>
              ) : (
                filteredOrders.map(order => {
                  const cfg = getStatusBadge(order.orderStatus);
                  return (
                    <div key={order.orderId} className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">

                      {/* Card header */}
                      <div className="p-6 md:p-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-gray-100 bg-gray-50/50">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center">
                          <div>
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Cửa hàng</span>
                            <span className="text-gray-900 font-semibold">{vendorShopName || order.vendorName || 'N/A'}</span>
                          </div>
                          <div className="hidden md:block w-px h-8 bg-gray-300" />
                          <div>
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Mã đơn hàng</span>
                            <span className="font-mono text-gray-900 font-bold text-base">#{order.orderId.slice(0, 8).toUpperCase()}</span>
                          </div>
                          <div className="hidden md:block w-px h-8 bg-gray-300" />
                          <div>
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Ngày đặt</span>
                            <span className="text-gray-900 font-medium">{formatDateVi(order.createdAt)}</span>
                          </div>
                          <div className="hidden md:block w-px h-8 bg-gray-300" />
                          <div>
                            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Giao hàng</span>
                            <span className="text-gray-900 font-medium">
                              {formatDateVi(order.deliveryDate)} lúc {order.deliveryTime?.slice(0, 5) || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex-shrink-0 ${cfg.badge}`}>
                          {cfg.label}
                        </span>
                      </div>

                      {/* Card body – items */}
                      <div className="p-6 md:p-8">
                        <div className="space-y-4">
                          {(order.items || []).map(item => (
                            <div key={item.itemId} className="flex gap-4 items-center">
                              <div className="size-16 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 bg-cover bg-center"
                                style={{ backgroundImage: 'url("https://picsum.photos/100?random=2")' }} />
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
                            <span className="text-gray-400 font-normal ml-1">
                              (sau {((Number(order.commissionRate) || 0) * 100).toFixed(0)}% phí)
                            </span>
                          </p>
                        </div>
                        <button
                          onClick={() => openDetail(order.orderId)}
                          disabled={detailLoading}
                          className="bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20 disabled:opacity-60 w-full sm:w-auto"
                        >
                          {detailLoading ? 'Đang tải...' : 'Xem chi tiết'}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            REFUNDS TAB  –  delegated to VendorRefundTab
        ══════════════════════════════════════════════════════════════════ */}
        {mainTab === 'refunds' && (
          <VendorRefundTab onPendingCount={setPendingRefunds} />
        )}

      </div>

      {/* ── Loading overlay (detail fetch) ───────────────────────────────────── */}
      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary mb-3" />
            <p className="text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ORDER DETAIL MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={() => { setSelectedOrder(null); setNewStatus(''); setStatusReason(''); setStatusError(null); setStatusSuccess(null); }}
        >
          <div
            className="bg-gray-50 w-full max-w-3xl my-8 rounded-[2rem] shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-white px-8 py-6 flex items-center gap-4 border-b border-gray-100">
              <button
                onClick={() => { setSelectedOrder(null); setNewStatus(''); setStatusReason(''); setStatusError(null); setStatusSuccess(null); }}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 hover:bg-gray-50 transition flex-shrink-0"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-gray-900">Chi tiết đơn hàng</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  #{selectedOrder.orderId.slice(0, 8).toUpperCase()}
                  {hasMeaningfulText(selectedOrder.customer?.fullName) && ` · Khách: ${selectedOrder.customer.fullName}`}
                </p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex-shrink-0 ${getStatusBadge(selectedOrder.orderStatus).badge}`}>
                {getStatusBadge(selectedOrder.orderStatus).label}
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Left column: items + delivery */}
              <div className="md:col-span-2 space-y-5">

                {/* Items */}
                <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pb-3 border-b border-gray-100">
                    Sản phẩm ({(selectedOrder.items || []).length})
                  </h3>
                  <div className="space-y-4">
                    {(selectedOrder.items || []).map(item => (
                      <div key={item.itemId} className="flex gap-4 items-center">
                        <div className="size-14 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 bg-cover bg-center"
                          style={{ backgroundImage: 'url("https://picsum.photos/100?random=3")' }} />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{item.packageName}</p>
                          <p className="text-sm text-slate-500">{item.variantName} × {item.quantity}</p>
                          {item.decorationNote && (
                            <p className="text-xs text-amber-600 italic mt-0.5">{item.decorationNote}</p>
                          )}
                        </div>
                        <p className="font-bold text-primary flex-shrink-0">{formatVnd(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery info */}
                {selectedOrder.delivery && (
                  <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Thông tin giao hàng</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        { label: 'Ngày giao', value: formatDateVi(selectedOrder.delivery.deliveryDate) },
                        { label: 'Giờ giao',  value: selectedOrder.delivery.deliveryTime?.slice(0, 5) || 'N/A' },
                        { label: 'Phí giao',  value: formatVnd(selectedOrder.pricing?.shippingFee) },
                        { label: 'Khoảng cách', value: `${selectedOrder.delivery.shippingDistanceKm} km` },
                      ].map(row => (
                        <div key={row.label}>
                          <p className="text-gray-400 text-xs font-semibold uppercase">{row.label}</p>
                          <p className="font-medium text-gray-800 mt-0.5">{row.value}</p>
                        </div>
                      ))}
                    </div>
                    {hasMeaningfulText(selectedOrder.delivery.deliveryAddress) && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                        <p className="text-xs text-blue-400 font-semibold uppercase mb-1">Địa chỉ giao</p>
                        <p className="text-sm text-gray-700">{selectedOrder.delivery.deliveryAddress}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Right column: summary + status update */}
              <div className="space-y-5">

                {/* Order summary */}
                <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pb-3 border-b border-gray-100">Tóm tắt</h3>
                  <div className="space-y-3 text-sm">
                    {[
                      { label: 'Tạm tính',   value: formatVnd(selectedOrder.pricing?.subTotal) },
                      { label: 'Phí giao',   value: formatVnd(selectedOrder.pricing?.shippingFee) },
                      { label: 'Thanh toán', value: selectedOrder.payment?.paymentMethod || 'N/A' },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between">
                        <span className="text-gray-500">{row.label}</span>
                        <span className="font-medium">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 border-t border-dashed border-gray-200">
                      <span className="font-bold text-gray-700">Tổng cộng</span>
                      <span className="text-xl font-black text-primary">{formatVnd(selectedOrder.pricing?.totalAmount)}</span>
                    </div>
                    <p className="text-xs text-green-600 font-semibold text-right">
                      Thực nhận: {formatVnd(selectedOrder.pricing?.vendorNetAmount)}
                    </p>
                  </div>
                </div>

                {/* Status update */}
                {(NEXT_STATUSES[normalizeStatus(selectedOrder.orderStatus)] ?? []).length > 0 && (
                  <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Cập nhật trạng thái</h3>
                    <div className="space-y-3">
                      <select
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white"
                      >
                        <option value="">-- Chọn trạng thái --</option>
                        {(NEXT_STATUSES[normalizeStatus(selectedOrder.orderStatus)] ?? []).map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                      {newStatus === 'Cancelled' && (
                        <textarea
                          value={statusReason}
                          onChange={e => setStatusReason(e.target.value)}
                          placeholder="Lý do hủy đơn..."
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
                        />
                      )}
                      {statusError   && <p className="text-xs text-red-500 font-medium">{statusError}</p>}
                      {statusSuccess && <p className="text-xs text-green-600 font-medium">{statusSuccess}</p>}
                      <button
                        onClick={handleUpdateStatus}
                        disabled={!newStatus || statusUpdating}
                        className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition text-sm disabled:opacity-50 shadow-md shadow-primary/20"
                      >
                        {statusUpdating ? 'Đang cập nhật...' : 'Xác nhận'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderManagement;
