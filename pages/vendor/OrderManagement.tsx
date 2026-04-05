import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { orderService, VendorOrder, Order } from '../../services/orderService';
import { getProfile } from '../../services/auth';
import VendorRefundTab from './VendorRefundTab';
import VendorReviewTab from './VendorReviewTab';
import OrderStatusTimeline from '../../components/OrderStatusTimeline';


interface OrderManagementProps {
  onNavigate: (path: string) => void;
}


const ORDER_STATUS_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'Paid', label: 'Đã thanh toán' },
  { id: 'Confirmed', label: 'Đã xác nhận' },
  { id: 'Processing', label: 'Đang xử lý' },
  { id: 'Delivering', label: 'Đang giao' },
  { id: 'Delivered', label: 'Đã giao' },
  { id: 'Completed', label: 'Hoàn thành' },
  { id: 'Cancelled', label: 'Đã hủy' },
  { id: 'Refunded', label: 'Đã hoàn' },
  { id: 'PaymentFailed', label: 'Thanh toán lỗi' },
];

const NEXT_STATUSES: Record<string, { value: string; label: string }[]> = {
  Paid: [
    { value: 'Confirmed', label: 'Xác nhận đơn' },
    { value: 'Cancelled', label: 'Hủy đơn' }
  ],
  Confirmed: [
    { value: 'Processing', label: 'Bắt đầu xử lý' },
    { value: 'Cancelled', label: 'Hủy đơn' }
  ],
  Processing: [
    { value: 'Delivering', label: 'Bắt đầu giao hàng' },
    { value: 'Cancelled', label: 'Hủy đơn' }
  ],
  Delivering: [
    { value: 'Delivered', label: 'Xác nhận đã giao' },
    { value: 'Cancelled', label: 'Hủy đơn' }
  ],
  Delivered: [],
  Completed: [],
  Cancelled: [],
};

const STATUS_BADGE: Record<string, { badge: string; label: string }> = {
  Pending: { badge: 'bg-yellow-100 text-yellow-700', label: 'Chờ duyệt' },
  Confirmed: { badge: 'bg-blue-100   text-blue-700', label: 'Đã xác nhận' },
  Processing: { badge: 'bg-violet-100 text-violet-700', label: 'Đang xử lý' },
  Preparing: { badge: 'bg-violet-100 text-violet-700', label: 'Đang xử lý' },
  Paid: { badge: 'bg-emerald-100 text-emerald-700', label: 'Đã thanh toán' },
  Delivering: { badge: 'bg-orange-100 text-orange-700', label: 'Đang giao' },
  Delivered: { badge: 'bg-green-100  text-green-700', label: 'Đã giao' },
  Completed: { badge: 'bg-green-100  text-green-700', label: 'Hoàn thành' },
  Cancelled: { badge: 'bg-red-100    text-red-600', label: 'Đã hủy' },
  Refunded: { badge: 'bg-purple-100 text-purple-600', label: 'Đã hoàn tiền' },
  PaymentFailed: { badge: 'bg-red-100    text-red-700', label: 'TT thất bại' },
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

const formatDateTimeVi = (value: unknown): string => {
  if (!value) return 'N/A';
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleString('vi-VN');
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

const formatYmdToVi = (ymd: string): string => {
  if (!ymd) return '';
  const [year, month, day] = ymd.split('-');
  if (!year || !month || !day) return '';
  return `${day}/${month}/${year}`;
};

const parseViDateToYmd = (value: string): string | null => {
  const normalized = value.trim();
  const match = normalized.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) return null;

  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return toYmd(date);
};

const getStatusBadge = (status: unknown) =>
  STATUS_BADGE[normalizeStatus(status)] ?? { badge: 'bg-gray-100 text-gray-600', label: String(status) };

const getPaymentStatusLabel = (status: unknown): string => {
  const key = String(status || '').trim().toLowerCase();
  const map: Record<string, string> = {
    paid: 'Đã thanh toán',
    pending: 'Chờ thanh toán',
    failed: 'Thanh toán thất bại',
    paymentfailed: 'Thanh toán thất bại',
    refunded: 'Đã hoàn tiền',
    cancelled: 'Đã hủy',
  };
  return map[key] || (key ? String(status) : 'N/A');
};

const getAvatarColor = (name: string) => {
  const colors = [
    'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name: string) => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const fallbackProductImage = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88">
      <rect width="88" height="88" rx="14" fill="#F1F5F9"/>
      <rect x="18" y="18" width="52" height="52" rx="10" fill="#E2E8F0"/>
      <text x="44" y="52" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#64748B">SP</text>
    </svg>`
)}`;

const toImageSrc = (value?: string | null): string => {
  const normalized = String(value || '').trim();
  if (!hasMeaningfulText(normalized)) return fallbackProductImage;
  if (/^https?:\/\//i.test(normalized)) return normalized;
  if (/^data:image\//i.test(normalized)) return normalized;
  if (/^blob:/i.test(normalized)) return normalized;
  if (normalized.startsWith('//')) return normalized;
  if (normalized.startsWith('/') || normalized.startsWith('./') || normalized.startsWith('../')) return normalized;
  // If API returns a relative path like "uploads/...", make it root-relative.
  return `/${normalized}`;
};

// ─── Component ────────────────────────────────────────────────────────────────

const OrderManagement: React.FC<OrderManagementProps> = ({ onNavigate: _onNavigate }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const itemsPerPage = 5;
  const fromDateInputRef = useRef<HTMLInputElement | null>(null);
  const toDateInputRef = useRef<HTMLInputElement | null>(null);

  type EnrichedOrderData = Partial<VendorOrder> & {
    itemImageByItemId?: Record<string, string | null | undefined>;
  };

  // ── orders state ────────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<VendorOrder[]>([]);
  const [enrichedData, setEnrichedData] = useState<Record<string, EnrichedOrderData>>({});
  const [vendorShopName, setVendorShopName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [fromDateText, setFromDateText] = useState('');
  const [toDateText, setToDateText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // ── detail modal state ──────────────────────────────────────────────────────
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [deliveryProofImages, setDeliveryProofImages] = useState<File[]>([]);

  // ── tab state ───────────────────────────────────────────────────────────────
  const [mainTab, setMainTab] = useState<'orders' | 'refunds' | 'reviews'>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'refund' || tab === 'refunds') return 'refunds';
    if (tab === 'review' || tab === 'reviews') return 'reviews';
    return 'orders';
  });
  const [pendingRefunds, setPendingRefunds] = useState(0);

  const getTodayYmd = (): string => toYmd(new Date());

  const applyDatePreset = (preset: 'today' | 'last7' | 'last30' | 'thisMonth' | 'clear') => {
    const today = new Date();
    const end = toYmd(today);

    if (preset === 'clear') {
      setFromDate('');
      setToDate('');
      setFromDateText('');
      setToDateText('');
      return;
    }

    if (preset === 'today') {
      setFromDate(end);
      setToDate(end);
      return;
    }

    if (preset === 'thisMonth') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(toYmd(start));
      setToDate(end);
      return;
    }

    const days = preset === 'last7' ? 6 : 29;
    const start = new Date(today);
    start.setDate(today.getDate() - days);
    setFromDate(toYmd(start));
    setToDate(end);
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
    setFromDateText(formatYmdToVi(value));
    if (toDate && value && toDate < value) {
      setToDate(value);
      setToDateText(formatYmdToVi(value));
    }
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
    setToDateText(formatYmdToVi(value));
    if (fromDate && value && value < fromDate) {
      setFromDate(value);
      setFromDateText(formatYmdToVi(value));
    }
  };

  const handleFromDateTextChange = (rawValue: string) => {
    const sanitized = rawValue.replace(/[^\d/]/g, '').slice(0, 10);
    setFromDateText(sanitized);

    const parsed = parseViDateToYmd(sanitized);
    if (parsed) {
      handleFromDateChange(parsed);
    }
  };

  const handleToDateTextChange = (rawValue: string) => {
    const sanitized = rawValue.replace(/[^\d/]/g, '').slice(0, 10);
    setToDateText(sanitized);

    const parsed = parseViDateToYmd(sanitized);
    if (parsed) {
      handleToDateChange(parsed);
    }
  };

  const handleFromDateTextBlur = () => {
    const parsed = parseViDateToYmd(fromDateText);
    setFromDateText(parsed ? formatYmdToVi(parsed) : formatYmdToVi(fromDate));
  };

  const handleToDateTextBlur = () => {
    const parsed = parseViDateToYmd(toDateText);
    setToDateText(parsed ? formatYmdToVi(parsed) : formatYmdToVi(toDate));
  };

  const openNativeDatePicker = (input: HTMLInputElement | null) => {
    if (!input) return;
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }
    pickerInput.click();
  };

  // ── fetch orders ────────────────────────────────────────────────────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // setCurrentPage(1); // Removed as per diff
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

  useEffect(() => {
    fetchOrders();
  }, [mainTab]); // Changed from [fetchOrders] to [mainTab]

  // Enrich visible orders when page or orders change
  useEffect(() => {
    const enrichVisibleOrders = async () => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      const visibleOrders = orders.slice(startIndex, startIndex + itemsPerPage);

      const ordersToEnrich = visibleOrders.filter(o => !enrichedData[o.orderId] || (!enrichedData[o.orderId].customerName && !o.customerName));

      if (ordersToEnrich.length === 0) return;

      console.log(`🔍 Enriching ${ordersToEnrich.length} orders...`);

      const results = await Promise.allSettled(
        ordersToEnrich.map(o => orderService.getOrderDetails(o.orderId))
      );

      const newEnrichments: Record<string, EnrichedOrderData> = { ...enrichedData };
      results.forEach((res, index) => {
        if (res.status === 'fulfilled' && res.value) {
          const orderId = ordersToEnrich[index].orderId;

          const itemImageByItemId: Record<string, string | null> = {};
          (res.value.items || []).forEach((it) => {
            itemImageByItemId[String(it.itemId)] = it.imageUrl || null;
          });

          newEnrichments[orderId] = {
            customerName: res.value.customer?.fullName || res.value.customerName,
            customerAvatar: res.value.customerAvatar || (res.value.customer as any)?.avatarUrl || '',
            customerPhone: res.value.customerPhone || res.value.customer?.phoneNumber,
            itemImageByItemId,
          };
        }
      });

      setEnrichedData(prev => ({ ...prev, ...newEnrichments }));
    };

    if (orders.length > 0) {
      enrichVisibleOrders();
    }
  }, [orders, currentPage, itemsPerPage]); // Removed enrichedData to avoid infinite loop

  // ── update order status ─────────────────────────────────────────────────────
  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;
    if ((newStatus === 'Delivered' || newStatus === 'Delivering') && deliveryProofImages.length === 0) {
      const fieldRequired = newStatus === 'Delivering' ? 'ảnh chuẩn bị' : 'ảnh chứng minh';
      setStatusError(`Vui lòng cung cấp ít nhất 1 ${fieldRequired}.`);
      return;
    }
    const oversizedFiles = deliveryProofImages.filter(file => file.size > 1 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setStatusError(`Ảnh ${oversizedFiles[0].name} quá lớn (>1MB). Vui lòng chọn ảnh nhỏ hơn.`);
      return;
    }

    setStatusUpdating(true);
    setStatusError(null);
    setStatusSuccess(null);
    try {
      if (newStatus === 'Cancelled') {
        await orderService.cancelOrder(selectedOrder.orderId, statusReason);
      } else {
        await orderService.updateOrderStatus(selectedOrder.orderId, newStatus, statusReason, deliveryProofImages);
      }
      const [detail, list] = await Promise.all([
        orderService.getOrderDetails(selectedOrder.orderId),
        orderService.getVendorOrders(),
      ]);
      setSelectedOrder(detail);
      setOrders(list);
      setNewStatus('');
      setStatusReason('');
      setDeliveryProofImages([]);
      setStatusSuccess(
        newStatus === 'Delivered' ? 'Đơn hàng đã giao thành công. Khách hàng sẽ xác nhận để hoàn thành đơn.' :
          newStatus === 'Cancelled' ? 'Đơn hàng đã được hủy thành công.' :
            (newStatus === 'Delivering' || newStatus === 'Shipping') ? 'Bắt đầu giao hàng! Khách hàng đã có thể theo dõi vị trí.' :
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
    setStatusError(null);
    try {
      const detail = await orderService.getOrderDetails(orderId);
      if (!detail) {
        throw new Error("Không tìm thấy dữ liệu đơn hàng.");
      }
      setSelectedOrder(detail);
    } catch (e: any) {
      console.error("Open detail error:", e);
      setStatusError("Lỗi khi tải chi tiết đơn hàng: " + (e.message || "Vui lòng thử lại sau."));
    } finally {
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
      if (toDate && ymd > toDate) return false;
      return true;
    })
    .sort((a, b) => (parseDate(b.createdAt)?.getTime() ?? 0) - (parseDate(a.createdAt)?.getTime() ?? 0));

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedOrders = filteredOrders.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, fromDate, toDate, mainTab]);

  useEffect(() => {
    setFromDateText(formatYmdToVi(fromDate));
  }, [fromDate]);

  useEffect(() => {
    setToDateText(formatYmdToVi(toDate));
  }, [toDate]);

  useEffect(() => {
    const currentTab = searchParams.get('tab');
    if (currentTab !== mainTab) {
      const newParams = new URLSearchParams(searchParams);
      newParams.set('tab', mainTab);
      setSearchParams(newParams, { replace: true });
    }
  }, [mainTab, searchParams, setSearchParams]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    const orderId = searchParams.get('orderId');

    if (tab === 'refund' || tab === 'refunds') {
      setMainTab('refunds');
    }

    if (orderId) {
      openDetail(orderId);
    }
  }, [searchParams]);

  // ── loading / error screens ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4" />
          <p className="text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-white">
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
    <div className="bg-white min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            {/* <button
              onClick={() => _onNavigate('/vendor/dashboard')}
              className="px-6 py-4 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0 hover:bg-slate-50 hover:text-black transition-all group font-black text-[10px] uppercase tracking-widest"
            >
              Quay lại Dashboard
            </button> */}
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Đơn Hàng</h1>
              <p className="text-slate-500 font-bold text-sm">Theo dõi và xử lý các đơn hàng của bạn.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Tổng đơn', value: orders.length, color: 'text-primary' },
            { label: 'Đã giao', value: orders.filter(o => ['Delivered', 'Completed'].includes(normalizeStatus(o.orderStatus))).length, color: 'text-green-600' },
            { label: 'Chờ xử lý', value: orders.filter(o => ['Paid', 'Confirmed', 'Processing', 'Delivering', 'Pending'].includes(normalizeStatus(o.orderStatus))).length, color: 'text-amber-600' },
            { label: 'Doanh thu', value: `${(orders.reduce((s, o) => s + (Number(o.vendorNetAmount) || 0), 0) / 1_000_000).toFixed(1)}M ₫`, color: 'text-blue-600' },
            { label: 'Yêu cầu hoàn', value: pendingRefunds, color: 'text-orange-500' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
              <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm w-fit">
          {(['orders', 'refunds', 'reviews'] as const).map(id => (
            <button
              key={id}
              onClick={() => setMainTab(id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${mainTab === id
                ? 'bg-primary text-white shadow-md shadow-primary/20'
                : 'text-slate-500 hover:text-slate-800 hover:bg-gray-50'
                }`}
            >
              {id === 'refunds' && pendingRefunds > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-black bg-orange-500 text-white rounded-full">
                  {pendingRefunds}
                </span>
              )}
              {id === 'orders' ? 'Đơn Hàng' : (id === 'refunds' ? 'Yêu cầu hoàn tiền' : 'Đánh giá')}
            </button>
          ))}
        </div>


        {mainTab === 'orders' && (
          <>
            {/* Date filter */}
            <div className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Từ ngày</label>
                  <div className="min-w-[170px] border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary flex items-center overflow-hidden">
                    <input
                      type="text"
                      value={fromDateText}
                      onChange={(e) => handleFromDateTextChange(e.target.value)}
                      onBlur={handleFromDateTextBlur}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => openNativeDatePicker(fromDateInputRef.current)}
                      className="px-3 py-2 border-l border-gray-200 text-slate-500 hover:bg-gray-50"
                      aria-label="Chọn ngày bắt đầu"
                    >

                    </button>
                  </div>
                  <input
                    ref={fromDateInputRef}
                    type="date"
                    value={fromDate}
                    max={toDate || getTodayYmd()}
                    onChange={(e) => handleFromDateChange(e.target.value)}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Đến ngày</label>
                  <div className="min-w-[170px] border border-gray-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary flex items-center overflow-hidden">
                    <input
                      type="text"
                      value={toDateText}
                      onChange={(e) => handleToDateTextChange(e.target.value)}
                      onBlur={handleToDateTextBlur}
                      placeholder="dd/mm/yyyy"
                      className="w-full px-3 py-2 text-sm text-gray-700 bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => openNativeDatePicker(toDateInputRef.current)}
                      className="px-3 py-2 border-l border-gray-200 text-slate-500 hover:bg-gray-50"
                      aria-label="Chọn ngày kết thúc"
                    >

                    </button>
                  </div>
                  <input
                    ref={toDateInputRef}
                    type="date"
                    value={toDate}
                    min={fromDate || undefined}
                    max={getTodayYmd()}
                    onChange={(e) => handleToDateChange(e.target.value)}
                    className="absolute opacity-0 pointer-events-none w-0 h-0"
                    tabIndex={-1}
                    aria-hidden="true"
                  />
                </div>

                <button
                  onClick={() => applyDatePreset('clear')}
                  className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 border border-gray-200 bg-white hover:bg-gray-50 transition"
                >
                  Xóa lọc ngày
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">Lọc nhanh</span>
                <button
                  onClick={() => applyDatePreset('today')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 transition"
                >
                  Hôm nay
                </button>
                <button
                  onClick={() => applyDatePreset('last7')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 transition"
                >
                  7 ngày qua
                </button>
                <button
                  onClick={() => applyDatePreset('last30')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 transition"
                >
                  30 ngày qua
                </button>
                <button
                  onClick={() => applyDatePreset('thisMonth')}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-slate-700 bg-white hover:bg-gray-50 transition"
                >
                  Tháng này
                </button>
              </div>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-1 pb-4 mb-8 border-b border-gray-200">
              {ORDER_STATUS_TABS.map(tab => (
                <button key={tab.id} onClick={() => setFilterStatus(tab.id)}
                  className={`whitespace-nowrap px-5 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${filterStatus === tab.id
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
                paginatedOrders.map(order => {
                  const cfg = getStatusBadge(order.orderStatus);
                  const enrichment = enrichedData[order.orderId] || {};
                  return (
                    <div key={order.orderId} className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">

                      {/* Card header */}
                      {(() => {
                        const enrichment = enrichedData[order.orderId] || {};
                        const displayName = enrichment.customerName || order.customerName || 'Khách hàng';

                        const displayPhone = enrichment.customerPhone || order.customerPhone;

                        return (
                          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center border-b border-gray-100 bg-gray-50/50">
                            <div className="flex flex-col md:flex-row gap-6 md:items-center">
                              <div className="flex items-center gap-3">
                                {/* {displayAvatar ? (
                                  <img src={displayAvatar} alt={displayName} className="size-12 rounded-full object-cover border-2 border-white shadow-sm" />
                                ) : (
                                  <div className={`size-12 rounded-full ${getAvatarColor(displayName)} flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm`}>
                                    {getInitials(displayName)}
                                  </div>
                                )} */}
                                <div>
                                  <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-0.5">Khách hàng</span>
                                  <span className="text-gray-900 font-bold text-lg">{displayName}</span>
                                  {displayPhone && (
                                    <span className="text-xs text-slate-500 block">{displayPhone}</span>
                                  )}
                                </div>
                              </div>

                              <div className="hidden md:block w-px h-8 bg-gray-200" />

                              <div>
                                <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Cửa hàng</span>
                                <span className="text-gray-900 font-semibold">{vendorShopName || order.vendorName || 'N/A'}</span>
                              </div>

                              <div className="hidden md:block w-px h-8 bg-gray-200" />
                              <div>
                                <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Ngày đặt</span>
                                <span className="text-gray-900 font-medium">{formatDateTimeVi(order.createdAt)}</span>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${getStatusBadge(order.orderStatus).badge}`}>
                                {getStatusBadge(order.orderStatus).label}
                              </span>
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <span className="text-[11px] font-bold uppercase tracking-wider">Giao hàng:</span>
                                <span className="text-xs font-semibold text-slate-600">
                                  {formatDateVi(order.deliveryDate)} lúc {order.deliveryTime?.slice(0, 5) || '00:00'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Card body – items */}
                      <div className="p-6 md:p-8">
                        <div className="space-y-4">
                          {(order.items || []).map(item => (
                            <div key={item.itemId} className="flex gap-4 items-center">
                              <div className="size-16 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
                                <img
                                  src={toImageSrc(enrichment.itemImageByItemId?.[String(item.itemId)] ?? item.imageUrl)}
                                  alt={item.packageName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const img = e.currentTarget;
                                    if (img.src !== fallbackProductImage) img.src = fallbackProductImage;
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="font-bold text-gray-800 text-base">{item.packageName}</h5>
                                <p className="text-sm text-slate-500 mt-0.5">Gói: {item.variantName}</p>
                                <p className="text-sm font-medium mt-0.5">x{item.quantity}</p>
                                {item.decorationNote && (
                                  <p className="text-xs text-amber-600 mt-0.5 italic">{item.decorationNote}</p>
                                )}
                                {item.isRequestRefund && (
                                  <div className="mt-1 flex">
                                    <span className="px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[9px] font-black uppercase tracking-tighter border border-orange-100 flex items-center gap-1">
                                      <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3" />
                                      </svg>
                                      Khách hoàn tiền
                                    </span>
                                  </div>
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
                          {order.finalAmount && order.finalAmount !== order.totalAmount && (
                            <p className="text-xs text-slate-400 mt-1">Sơ bộ: {formatVnd(order.totalAmount)} · Thực nhận: {formatVnd(order.finalAmount)}</p>
                          )}
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

            {filteredOrders.length > itemsPerPage && (
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-3 border border-gray-200 rounded-2xl bg-white px-4 md:px-6 py-4">
                <p className="text-sm text-slate-600">
                  Hiển thị{' '}
                  <span className="font-semibold">{(safeCurrentPage - 1) * itemsPerPage + 1}</span>
                  {' - '}
                  <span className="font-semibold">{Math.min(safeCurrentPage * itemsPerPage, filteredOrders.length)}</span>
                  {' / '}
                  <span className="font-semibold">{filteredOrders.length}</span>
                  {' đơn hàng'}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Trước
                  </button>

                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-9 h-9 px-2 rounded-lg text-sm font-bold transition-all ${safeCurrentPage === page
                        ? 'bg-primary text-white'
                        : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )}
          </>
        )}


        {mainTab === 'refunds' && (
          <VendorRefundTab onPendingCount={setPendingRefunds} />
        )}

        {mainTab === 'reviews' && (
          <VendorReviewTab />
        )}

      </div>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-4 border-b-4 border-primary mb-3" />
            <p className="text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</p>
          </div>
        </div>
      )}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto"
          onClick={() => { setSelectedOrder(null); setNewStatus(''); setStatusReason(''); setStatusError(null); setStatusSuccess(null); setDeliveryProofImages([]); }}
        >
          <div
            className="bg-gray-50 w-full max-w-6xl my-4 rounded-[2rem] shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-white px-6 md:px-8 py-5 flex items-center gap-4 border-b border-gray-100">
              <button
                onClick={() => { setSelectedOrder(null); setNewStatus(''); setStatusReason(''); setStatusError(null); setStatusSuccess(null); setDeliveryProofImages([]); }}
                className="px-5 py-2.5 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-200 hover:bg-gray-50 transition flex-shrink-0 font-bold text-xs uppercase tracking-widest text-gray-600"
              >
                Đóng
              </button>
              <div className="flex-1 flex items-center gap-4">
                {/* {selectedOrder.customer?.avatarUrl || selectedOrder.customerAvatar ? (
                  <img src={selectedOrder.customer?.avatarUrl || selectedOrder.customerAvatar} alt={selectedOrder.customer?.fullName} className="size-12 rounded-full object-cover border-2 border-white shadow-sm" />
                ) : (
                  <div className={`size-12 rounded-full ${getAvatarColor(selectedOrder.customer?.fullName || 'C')} flex items-center justify-center text-white font-bold text-lg border-2 border-white shadow-sm`}>
                    {getInitials(selectedOrder.customer?.fullName || 'C')}
                  </div>
                )} */}
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Chi tiết đơn hàng</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {(() => {
                      const displayCustomerName =
                        (hasMeaningfulText(selectedOrder.customer?.fullName) ? selectedOrder.customer?.fullName : '')
                        || (hasMeaningfulText(selectedOrder.customerName) ? selectedOrder.customerName : '')
                        || 'Khách hàng';

                      const displayCustomerPhone =
                        (hasMeaningfulText(selectedOrder.customer?.phoneNumber) ? selectedOrder.customer?.phoneNumber : '')
                        || (hasMeaningfulText(selectedOrder.customerPhone) ? selectedOrder.customerPhone : '');

                      return (
                        <>
                          <p className="text-sm text-gray-500">Khách: {displayCustomerName}</p>
                          {hasMeaningfulText(displayCustomerPhone) && <span className="text-gray-300">|</span>}
                          <p className="text-sm text-gray-500">{displayCustomerPhone}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex-shrink-0 ${getStatusBadge(selectedOrder.orderStatus).badge}`}>
                {getStatusBadge(selectedOrder.orderStatus).label}
              </span>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-5 overflow-y-auto">

              {/* Left column: items + delivery */}
              <div className="lg:col-span-7 space-y-4">

                {/* Items */}
                <div className="bg-white rounded-[1.25rem] border border-gray-200 p-4 md:p-5 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-100">
                    Sản phẩm ({(selectedOrder.items || []).length})
                  </h3>
                  <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                    {(selectedOrder.items || []).map(item => (
                      <div key={item.itemId} className="flex gap-3 items-center">
                        <div className="size-12 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 overflow-hidden">
                          <img
                            src={toImageSrc(item.imageUrl)}
                            alt={item.packageName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.src !== fallbackProductImage) img.src = fallbackProductImage;
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 truncate">{item.packageName}</p>
                          <p className="text-sm text-slate-500">{item.variantName} × {item.quantity}</p>
                          {item.decorationNote && (
                            <p className="text-xs text-amber-600 italic mt-0.5">{item.decorationNote}</p>
                          )}
                        </div>
                        <p className="font-bold text-primary flex-shrink-0 text-sm">{formatVnd(item.lineTotal)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Timeline - Full Width */}
                <OrderStatusTimeline
                  orderId={selectedOrder.orderId}
                  currentStatus={selectedOrder.orderStatus}
                  trackingLists={selectedOrder.trackingLists || []}
                />

                <div className="grid grid-cols-1 gap-4 mt-6">
                  {/* Delivery info */}
                  {selectedOrder.delivery && (
                    <div className="bg-white rounded-[1.25rem] border border-gray-200 p-4 md:p-5 shadow-sm">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Thông tin giao hàng</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          { label: 'Ngày giao', value: formatDateVi(selectedOrder.delivery.deliveryDate) },
                          { label: 'Giờ giao', value: selectedOrder.delivery.deliveryTime?.slice(0, 5) || 'N/A' },
                          { label: 'Phí giao', value: formatVnd(selectedOrder.pricing?.shippingFee) },
                          { label: 'Khoảng cách', value: `${selectedOrder.delivery.shippingDistanceKm} km` },
                        ].map(row => (
                          <div key={row.label}>
                            <p className="text-gray-400 text-xs font-semibold uppercase">{row.label}</p>
                            <p className="font-medium text-gray-800 mt-0.5">{row.value}</p>
                          </div>
                        ))}
                      </div>
                      {hasMeaningfulText(selectedOrder.delivery.deliveryAddress) && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-xl">
                          <p className="text-xs text-blue-400 font-semibold uppercase mb-1">Địa chỉ giao</p>
                          <p className="text-sm text-gray-700 line-clamp-3">{selectedOrder.delivery.deliveryAddress}</p>
                        </div>
                      )}
                      {(() => {
                        const proof = selectedOrder.delivery.deliveryProofImageUrl;
                        const firstProof = Array.isArray(proof) ? proof[0] : proof;
                        return firstProof;
                      })() && (
                          <div className="mt-3">
                            <a
                              href={(Array.isArray(selectedOrder.delivery.deliveryProofImageUrl)
                                ? selectedOrder.delivery.deliveryProofImageUrl[0]
                                : selectedOrder.delivery.deliveryProofImageUrl) as string}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                            >
                              Xem ảnh giao hàng
                            </a>
                          </div>
                        )}
                      {Array.isArray((selectedOrder.delivery as any).preparationProofImages)
                        && (selectedOrder.delivery as any).preparationProofImages.length > 0 && (
                          <div className="mt-2">
                            <a
                              href={(selectedOrder.delivery as any).preparationProofImages[0] as string}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
                            >
                              Xem ảnh chuẩn bị
                            </a>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: summary */}
              <div className="lg:col-span-5 space-y-4">

                {/* Order summary */}
                <div className="bg-white rounded-[1.25rem] border border-gray-200 p-4 md:p-5 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pb-3 border-b border-gray-100">Tóm tắt</h3>
                  <div className="text-sm divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                    {[
                      { label: 'Số lượng', value: String(selectedOrder.pricing?.totalQuantity ?? selectedOrder.items?.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0) ?? 0) },
                      { label: 'Tạm tính', value: formatVnd(selectedOrder.pricing?.subTotal) },
                      { label: 'Phí giao', value: formatVnd(selectedOrder.pricing?.shippingFee) },
                      { label: 'Giảm giá', value: formatVnd(selectedOrder.pricing?.discountAmount) },
                      { label: 'TT đơn hàng', value: getStatusBadge(selectedOrder.orderStatus).label },
                      { label: 'TT thanh toán', value: getPaymentStatusLabel(selectedOrder.payment?.paymentStatus) },
                    ].map(row => (
                      <div key={row.label} className="flex justify-between px-4 py-2.5 bg-white">
                        <span className="text-gray-500 text-[13px]">{row.label}</span>
                        <span className="font-semibold text-gray-800 text-right">{row.value}</span>
                      </div>
                    ))}
                    <div className="flex justify-between px-4 py-3 bg-slate-50">
                      <span className="font-bold text-gray-700">Tổng cộng</span>
                      <span className="text-xl font-black text-primary">{formatVnd(selectedOrder.pricing?.finalAmount ?? selectedOrder.pricing?.totalAmount)}</span>
                    </div>
                    <p className="text-xs text-green-600 font-semibold text-right px-4 py-2 bg-white">
                      Thực nhận: {formatVnd(selectedOrder.pricing?.vendorNetAmount)}
                    </p>
                    {selectedOrder.payment?.paidAt && (
                      <p className="text-xs text-slate-500 text-right px-4 py-2 bg-white">Thanh toán lúc: {formatDateTimeVi(selectedOrder.payment.paidAt)}</p>
                    )}
                  </div>

                  {hasMeaningfulText(selectedOrder.cancelReason) && (
                    <div className="mt-3 p-3 bg-red-50 rounded-xl border border-red-100">
                      <p className="text-xs text-red-500 font-semibold uppercase tracking-wide mb-1">Lý do hủy</p>
                      <p className="text-sm text-gray-700">{selectedOrder.cancelReason}</p>
                    </div>
                  )}
                </div>

              </div>

              {/* Bottom row: status update (left) + customer/settlement (right) */}
              {(NEXT_STATUSES[normalizeStatus(selectedOrder.orderStatus)] ?? []).length > 0 && (
                <div className="lg:col-span-7 bg-white rounded-[1.25rem] border border-gray-200 p-4 md:p-5 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-3">Cập nhật trạng thái</h3>
                  <div className="space-y-2.5">
                    <select
                      value={newStatus}
                      onChange={e => {
                        const nextValue = e.target.value;
                        setNewStatus(nextValue);
                        // Only clear images if not moving to a state that requires them
                        if (nextValue !== 'Delivered' && nextValue !== 'Delivering') {
                          setDeliveryProofImages([]);
                        }
                        setStatusError(null);
                        setStatusSuccess(null);
                      }}
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
                    {(newStatus === 'Delivered' || newStatus === 'Delivering') && (
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          {newStatus === 'Delivered' ? 'Ảnh chứng minh (Đã giao)' : 'Ảnh chuẩn bị mâm cúng'}
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => setDeliveryProofImages(Array.from(e.target.files || []))}
                          className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                        />
                        {deliveryProofImages.length > 0 && (
                          <p className="text-xs text-slate-500">Đã chọn {deliveryProofImages.length} ảnh</p>
                        )}
                      </div>
                    )}
                    {statusError && <p className="text-xs text-red-500 font-medium">{statusError}</p>}
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

              <div className="lg:col-span-5 bg-white rounded-[1.25rem] border border-gray-200 p-4 md:p-5 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4">Khách hàng & đối soát</h3>
                <div className="text-sm divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  <div className="flex justify-between items-center gap-3 px-4 py-3 bg-white">
                    <span className="text-gray-500">Khách hàng</span>
                    <div className="flex items-center gap-2">
                      {/* <div className={`size-8 rounded-full ${getAvatarColor(selectedOrder.customer?.fullName || 'C')} flex items-center justify-center text-white text-xs font-bold`}>
                         {getInitials(selectedOrder.customer?.fullName || 'C')}
                       </div> */}
                      <span className="font-semibold text-gray-800 text-right">
                        {(hasMeaningfulText(selectedOrder.customer?.fullName) ? selectedOrder.customer?.fullName : '')
                          || (hasMeaningfulText(selectedOrder.customerName) ? selectedOrder.customerName : '')
                          || 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between gap-3 px-4 py-2.5 bg-white">
                    <span className="text-gray-500">Số điện thoại</span>
                    <span className="font-semibold text-gray-800 text-right">
                      {(hasMeaningfulText(selectedOrder.customer?.phoneNumber) ? selectedOrder.customer?.phoneNumber : '')
                        || (hasMeaningfulText(selectedOrder.customerPhone) ? selectedOrder.customerPhone : '')
                        || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between gap-3 px-4 py-2.5 bg-white">
                    <span className="text-gray-500">Hoa hồng</span>
                    <span className="font-semibold text-gray-800">{((Number(selectedOrder.vendorPricingDetails?.commissionRate) || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between gap-3 px-4 py-2.5 bg-white">
                    <span className="text-gray-500">Phí nền tảng</span>
                    <span className="font-semibold text-gray-800">{formatVnd(selectedOrder.vendorPricingDetails?.platformFee)}</span>
                  </div>
                  <div className="flex justify-between gap-3 px-4 py-2.5 bg-white">
                    <span className="text-gray-500">Thực nhận</span>
                    <span className="font-semibold text-green-600">{formatVnd(selectedOrder.vendorPricingDetails?.vendorNetAmount)}</span>
                  </div>
                  <div className="flex justify-between gap-3 px-4 py-2.5 bg-white">
                    {/* <span className="text-gray-500">Đã trả cho nhà bán</span>
                    <span className={`font-bold ${selectedOrder.vendorPricingDetails?.isPaidToVendor ? 'text-green-600' : 'text-amber-600'}`}>
                      {selectedOrder.vendorPricingDetails?.isPaidToVendor ? 'Đã trả' : 'Chưa trả'}
                    </span> */}
                  </div>
                  {/* <div className="flex justify-between gap-3 px-4 py-2.5 bg-white">
                    <span className="text-gray-500">Ngày trả</span>
                    <span className="font-semibold text-gray-800 text-right">{selectedOrder.vendorPricingDetails?.paidToVendorDate ? formatDateTimeVi(selectedOrder.vendorPricingDetails.paidToVendorDate) : 'N/A'}</span>
                  </div> */}

                  <div className="flex justify-between gap-3 px-4 py-2.5 bg-white">
                    <span className="text-gray-500">Mã giao dịch</span>
                    <span className="font-semibold text-gray-800 text-right">
                      {hasMeaningfulText(selectedOrder.vendorPricingDetails?.transactionId)
                        ? selectedOrder.vendorPricingDetails?.transactionId
                        : (hasMeaningfulText(selectedOrder.payment?.transactionId) ? selectedOrder.payment?.transactionId : 'N/A')}
                    </span>
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
