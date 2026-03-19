import React, { useEffect, useState } from 'react';
import { approveWithdrawal, getWithdrawalRequests, rejectWithdrawal, WithdrawalListItem } from '../../services/walletService';
import { refundService, RefundRecord } from '../../services/refundService';
import toast from '../../services/toast';
import Swal from 'sweetalert2';

interface AdminDashboardProps {
  onNavigate: (path: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'vendors' | 'users' | 'orders' | 'disputes' | 'content' | 'withdrawals'>('overview');
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalListItem[]>([]);
  const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
  const [withdrawalsError, setWithdrawalsError] = useState<string | null>(null);
  const [processingWithdrawalId, setProcessingWithdrawalId] = useState<string | null>(null);
  const [refundRequests, setRefundRequests] = useState<RefundRecord[]>([]);
  const [isLoadingRefunds, setIsLoadingRefunds] = useState(false);
  const [refundsError, setRefundsError] = useState<string | null>(null);
  const [processingRefundId, setProcessingRefundId] = useState<string | null>(null);

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

  const loadWithdrawalRequests = async () => {
    setIsLoadingWithdrawals(true);
    setWithdrawalsError(null);

    try {
      const data = await getWithdrawalRequests();
      setWithdrawalRequests(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách rút tiền.';
      setWithdrawalsError(message);
      setWithdrawalRequests([]);
    } finally {
      setIsLoadingWithdrawals(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'withdrawals' && withdrawalRequests.length === 0 && !isLoadingWithdrawals) {
      loadWithdrawalRequests();
    }
  }, [activeTab]);

  const loadRefundRequests = async () => {
    setIsLoadingRefunds(true);
    setRefundsError(null);

    try {
      const data = await refundService.getAllRefunds();
      setRefundRequests(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách hoàn tiền.';
      setRefundsError(message);
      setRefundRequests([]);
    } finally {
      setIsLoadingRefunds(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'disputes' && refundRequests.length === 0 && !isLoadingRefunds) {
      loadRefundRequests();
    }
  }, [activeTab]);

  const getStatusTheme = (status: string): string => {
    const normalized = status.toLowerCase();

    if (normalized.includes('hoàn tất') || normalized.includes('completed') || normalized.includes('đã duyệt') || normalized.includes('approved')) {
      return 'bg-green-100 text-green-700';
    }

    if (normalized.includes('đang xử lý') || normalized.includes('processing')) {
      return 'bg-blue-100 text-blue-700';
    }

    if (normalized.includes('từ chối') || normalized.includes('rejected')) {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-yellow-100 text-yellow-700';
  };

  const isFinalWithdrawalStatus = (status: string): boolean => {
    const normalized = status.toLowerCase();
    return (
      normalized.includes('hoàn tất') ||
      normalized.includes('completed') ||
      normalized.includes('đã duyệt') ||
      normalized.includes('approved') ||
      normalized.includes('từ chối') ||
      normalized.includes('rejected')
    );
  };

  const getDisplayStatus = (status: string): string => {
    const normalized = status.toLowerCase();

    if (normalized.includes('pending') || normalized.includes('chờ duyệt')) {
      return 'Chờ duyệt';
    }

    if (normalized.includes('processing') || normalized.includes('đang xử lý')) {
      return 'Đang xử lý';
    }

    if (normalized.includes('approved') || normalized.includes('đã duyệt') || normalized.includes('hoàn tất') || normalized.includes('completed')) {
      return 'Đã duyệt';
    }

    if (normalized.includes('rejected') || normalized.includes('từ chối')) {
      return 'Đã từ chối';
    }

    return status;
  };

  const formatDateTimeVN = (value: string): string => {
    if (!value || value === 'Chưa xác định') {
      return 'Chưa xác định';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    const hours = String(parsed.getHours()).padStart(2, '0');
    const minutes = String(parsed.getMinutes()).padStart(2, '0');
    const seconds = String(parsed.getSeconds()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  };

  const formatCurrencyVN = (value: number): string => `${value.toLocaleString('vi-VN')}đ`;

  const escapeHtml = (value: unknown): string => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const getPendingCount = (): number => {
    return withdrawalRequests.filter((item) => {
      const status = item.status.toLowerCase();
      return status.includes('chờ duyệt') || status.includes('pending');
    }).length;
  };

  const handleViewWithdrawalDetail = async (request: WithdrawalListItem) => {
    const rawData = request.raw || {};
    const transaction = (rawData.transaction || rawData.Transaction || {}) as Record<string, unknown>;

    const withdrawalId = String(rawData.withdrawalId || rawData.WithdrawalId || request.id);
    const accountHolder = String(rawData.accountHolder || rawData.AccountHolder || request.vendor || 'N/A');
    const rejectionReason = rawData.rejectionReason || rawData.RejectionReason;
    const processedDate = String(rawData.processedDate || rawData.ProcessedDate || '');
    const createdDate = String(rawData.createdDate || rawData.CreatedDate || request.requestedAt || '');
    const walletId = String(rawData.walletId || rawData.WalletId || transaction.walletId || transaction.WalletId || 'N/A');

    const transactionId = String(transaction.transactionId || transaction.TransactionId || 'N/A');
    const transactionType = String(transaction.type || transaction.Type || 'N/A');
    const transactionStatus = String(transaction.status || transaction.Status || request.status);
    const transactionDescription = String(transaction.description || transaction.Description || '');
    const balanceAfterRaw = transaction.balanceAfter || transaction.BalanceAfter;
    const balanceAfter = typeof balanceAfterRaw === 'number' ? balanceAfterRaw : Number(balanceAfterRaw);
    const localizedStatus = getDisplayStatus(request.status);
    const localizedTransactionStatus = getDisplayStatus(transactionStatus);
    const resolvedShopName = request.vendor;

    const statusStyle = (() => {
      const normalized = request.status.toLowerCase();
      if (normalized.includes('approved') || normalized.includes('đã duyệt') || normalized.includes('hoàn tất') || normalized.includes('completed')) {
        return 'background:#dcfce7;color:#166534;';
      }
      if (normalized.includes('processing') || normalized.includes('đang xử lý')) {
        return 'background:#dbeafe;color:#1d4ed8;';
      }
      if (normalized.includes('rejected') || normalized.includes('từ chối')) {
        return 'background:#fee2e2;color:#b91c1c;';
      }
      return 'background:#fef3c7;color:#a16207;';
    })();

    await Swal.fire({
      title: 'Chi tiết yêu cầu rút tiền',
      width: 860,
      confirmButtonText: 'Đóng',
      buttonsStyling: false,
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3 text-white bg-primary hover:opacity-90 transition-all'
      },
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.5; color:#334155;">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding:14px 16px; border:1px solid #e2e8f0; border-radius:12px; background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%); margin-bottom:14px;">
            <div>
              <div style="font-size:12px; color:#64748b;">Mã yêu cầu</div>
              <div style="font-weight:700; color:#0f172a; margin-top:2px;">${escapeHtml(withdrawalId)}</div>
              <div style="font-size:12px; color:#64748b; margin-top:6px;">Nhà cung cấp: <span style="font-weight:600; color:#1e293b;">${escapeHtml(resolvedShopName)}</span></div>
            </div>
            <div style="text-align:right;">
              <span style="display:inline-block; padding:4px 10px; border-radius:999px; font-weight:700; font-size:12px; ${statusStyle}">${escapeHtml(localizedStatus)}</span>
              <div style="font-size:24px; font-weight:800; color:#0f172a; margin-top:8px;">${escapeHtml(formatCurrencyVN(request.amount))}</div>
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
            <div style="padding:12px; border:1px solid #e2e8f0; border-radius:12px; background:#fff;">
              <div style="font-size:12px; color:#64748b; margin-bottom:8px; font-weight:700;">THÔNG TIN RÚT TIỀN</div>
              <div><strong>Wallet ID:</strong> ${escapeHtml(walletId)}</div>
              <div><strong>Chủ tài khoản:</strong> ${escapeHtml(accountHolder)}</div>
              <div><strong>Tài khoản nhận:</strong> ${escapeHtml(request.bank)}</div>
              <div><strong>Thời gian tạo:</strong> ${escapeHtml(formatDateTimeVN(createdDate))}</div>
              <div><strong>Thời gian xử lý:</strong> ${escapeHtml(processedDate ? formatDateTimeVN(processedDate) : 'Chưa xử lý')}</div>
              <div><strong>Lý do từ chối:</strong> ${escapeHtml(rejectionReason ? String(rejectionReason) : 'Không có')}</div>
            </div>

            <div style="padding:12px; border:1px solid #e2e8f0; border-radius:12px; background:#fff;">
              <div style="font-size:12px; color:#64748b; margin-bottom:8px; font-weight:700;">THÔNG TIN GIAO DỊCH</div>
              <div><strong>Mã giao dịch:</strong> ${escapeHtml(transactionId)}</div>
              <div><strong>Loại:</strong> ${escapeHtml(transactionType)}</div>
              <div><strong>Trạng thái GD:</strong> ${escapeHtml(localizedTransactionStatus)}</div>
              <div><strong>Số dư sau GD:</strong> ${escapeHtml(Number.isFinite(balanceAfter) ? formatCurrencyVN(balanceAfter) : 'N/A')}</div>
              <div><strong>Mô tả:</strong> ${escapeHtml(transactionDescription || 'N/A')}</div>
            </div>
          </div>
        </div>
      `,
    });
  };

  const handleApproveWithdrawal = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Duyệt yêu cầu rút tiền?',
      text: 'Hành động này sẽ xác nhận chuyển tiền cho nhà cung cấp.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Duyệt',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setProcessingWithdrawalId(requestId);

    try {
      await approveWithdrawal(requestId);
      await toast.success('Duyệt yêu cầu rút tiền thành công.');
      await loadWithdrawalRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Duyệt yêu cầu rút tiền thất bại.';
      await toast.error(message);
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    const result = await Swal.fire({
      title: 'Duyệt hoàn tiền?',
      text: 'Xác nhận duyệt yêu cầu hoàn tiền này.',
      input: 'text',
      inputPlaceholder: 'Ghi chú (tuỳ chọn)',
      showCancelButton: true,
      confirmButtonText: 'Duyệt',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setProcessingRefundId(refundId);

    try {
      await refundService.approveRefund(refundId, String(result.value || ''));
      toast.success('Đã duyệt hoàn tiền.');
      await loadRefundRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể duyệt hoàn tiền.';
      toast.error(message);
    } finally {
      setProcessingRefundId(null);
    }
  };

  const handleRejectRefund = async (refundId: string) => {
    const result = await Swal.fire({
      title: 'Từ chối hoàn tiền?',
      input: 'text',
      inputPlaceholder: 'Lý do từ chối (bắt buộc)',
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Vui lòng nhập lý do từ chối.';
        }
        return null;
      },
      showCancelButton: true,
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    setProcessingRefundId(refundId);

    try {
      await refundService.rejectRefund(refundId, String(result.value || ''));
      toast.success('Đã từ chối hoàn tiền.');
      await loadRefundRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể từ chối hoàn tiền.';
      toast.error(message);
    } finally {
      setProcessingRefundId(null);
    }
  };

  const handleRejectWithdrawal = async (requestId: string) => {
    const result = await Swal.fire({
      title: 'Từ chối yêu cầu rút tiền',
      input: 'text',
      inputLabel: 'Nhập lý do từ chối',
      inputValue: 'Sai thông tin tài khoản nhận tiền',
      inputPlaceholder: 'Ví dụ: Sai thông tin tài khoản nhận tiền',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xác nhận từ chối',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3'
      },
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return 'Vui lòng nhập lý do từ chối.';
        }

        return null;
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    const normalizedReason = String(result.value || '').trim();

    setProcessingWithdrawalId(requestId);

    try {
      await rejectWithdrawal(requestId, normalizedReason);
      await toast.success('Đã từ chối yêu cầu rút tiền.');
      await loadWithdrawalRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Từ chối yêu cầu rút tiền thất bại.';
      await toast.error(message);
    } finally {
      setProcessingWithdrawalId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ritual-bg via-white to-gold/5 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-display font-black text-primary mb-2"> Bảng Điều Khiển Quản Trị Viên</h1>
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
          {['overview', 'vendors', 'users', 'orders', 'disputes', 'content', 'withdrawals'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 md:flex-none md:px-6 py-3 rounded-lg font-bold text-sm uppercase transition-all tracking-wider whitespace-nowrap ${
                activeTab === tab
                  ? 'border-2 border-primary text-primary bg-primary/5'
                  : 'text-slate-500 hover:text-primary'
              }`}
            >
              {tab === 'overview' && ' Tổng quan'}
              {tab === 'vendors' && ' Nhà cung cấp'}
              {tab === 'users' && ' Người dùng'}
              {tab === 'orders' && ' Đơn hàng'}
              {tab === 'disputes' && ' khiếu nại'}
              {tab === 'content' && ' Nội dung'}
              {tab === 'withdrawals' && ' Quản lý rút tiền'}
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
                <h3 className="font-bold text-primary mb-2">khiếu nại</h3>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold text-primary">Xử lý hoàn tiền</h2>
                <p className="text-sm text-slate-500 mt-1">Duyệt hoặc từ chối yêu cầu hoàn tiền của khách hàng.</p>
              </div>
              <button
                onClick={loadRefundRequests}
                className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
              >
                Tải lại
              </button>
            </div>

            {isLoadingRefunds && (
              <div className="text-center py-10 text-slate-500">Đang tải danh sách hoàn tiền...</div>
            )}

            {refundsError && (
              <div className="text-center py-10 text-red-500">{refundsError}</div>
            )}

            {!isLoadingRefunds && !refundsError && refundRequests.length === 0 && (
              <div className="text-center py-10 text-slate-500">Chưa có yêu cầu hoàn tiền.</div>
            )}

            <div className="space-y-4">
              {refundRequests.map((refund) => (
                <div key={refund.refundId} className="p-6 bg-ritual-bg rounded-xl border border-gold/10 hover:border-primary transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs font-bold uppercase text-gold tracking-widest mb-1">#{refund.orderCode || refund.orderId.slice(0, 8)}</p>
                      <h3 className="text-lg font-bold text-primary mb-2">{refund.customerName}</h3>
                      <div className="flex gap-4 text-sm text-slate-600">
                        <span> {formatCurrencyVN(refund.refundAmount)}</span>
                        <span> {formatDateTimeVN(refund.createdAt)}</span>
                      </div>
                      <p className="text-sm text-slate-500 mt-2 line-clamp-2">{refund.reason || 'Không có lý do'}</p>
                    </div>
                    <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${getStatusTheme(refund.status)}`}>
                      {getDisplayStatus(refund.status)}
                    </span>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-gold/10">
                    <button
                      className="flex-1 px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm hover:bg-primary/5 transition-all"
                    >
                      Xem chi tiết
                    </button>
                    {refund.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleApproveRefund(refund.refundId)}
                          disabled={processingRefundId === refund.refundId}
                          className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg font-bold text-sm hover:bg-green-50 transition-all disabled:opacity-50"
                        >
                          Duyệt
                        </button>
                        <button
                          onClick={() => handleRejectRefund(refund.refundId)}
                          disabled={processingRefundId === refund.refundId}
                          className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-bold text-sm hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                      </>
                    )}
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

        {activeTab === 'withdrawals' && (
          <div className="bg-white rounded-[2rem] border border-gold/10 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gold/10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">Quản Lý Rút Tiền</h2>
                <p className="text-sm text-slate-500 mt-1">Theo dõi và duyệt các yêu cầu rút tiền từ nhà cung cấp</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-lg bg-yellow-100 text-yellow-700 text-xs font-bold uppercase">
                  {getPendingCount()} chờ duyệt
                </span>
                <button
                  onClick={loadWithdrawalRequests}
                  className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-xs uppercase hover:bg-primary/5 transition-all"
                >
                  Tải lại
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isLoadingWithdrawals && (
                <div className="px-8 py-10 text-center text-slate-500 font-semibold">Đang tải dữ liệu rút tiền...</div>
              )}

              {!isLoadingWithdrawals && withdrawalsError && (
                <div className="px-8 py-10 text-center">
                  <p className="text-red-600 font-semibold mb-4">{withdrawalsError}</p>
                  <button
                    onClick={loadWithdrawalRequests}
                    className="px-6 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
                  >
                    Thử lại
                  </button>
                </div>
              )}

              {!isLoadingWithdrawals && !withdrawalsError && withdrawalRequests.length === 0 && (
                <div className="px-8 py-10 text-center text-slate-500 font-semibold">Chưa có yêu cầu rút tiền nào.</div>
              )}

              {!isLoadingWithdrawals && !withdrawalsError && withdrawalRequests.length > 0 && (
              <table className="w-full">
                <thead>
                  <tr className="bg-ritual-bg border-b border-gold/10">
                    {/* <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Mã yêu cầu</th> */}
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Nhà cung cấp</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Số tiền</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Tài khoản nhận</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Thời gian</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Trạng thái</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase text-slate-600">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.map((request) => (
                    <tr key={request.id} className="border-b border-gold/10 hover:bg-ritual-bg transition-all">
                      {/* <td className="px-6 py-4 font-bold text-primary">{request.id}</td> */}
                      <td className="px-6 py-4 text-slate-700 font-semibold">{request.vendor}</td>
                      <td className="px-6 py-4 text-primary font-black">{formatCurrencyVN(request.amount)}</td>
                      <td className="px-6 py-4 text-slate-600 text-sm">{request.bank}</td>
                      <td className="px-6 py-4 text-slate-500 text-sm">{formatDateTimeVN(request.requestedAt)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${getStatusTheme(request.status)}`}>
                          {getDisplayStatus(request.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewWithdrawalDetail(request)}
                            className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-xs hover:bg-primary/5 transition-all whitespace-nowrap"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleApproveWithdrawal(request.id)}
                            disabled={processingWithdrawalId === request.id || isFinalWithdrawalStatus(request.status)}
                            className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-lg font-bold text-xs hover:bg-green-50 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleRejectWithdrawal(request.id)}
                            disabled={processingWithdrawalId === request.id || isFinalWithdrawalStatus(request.status)}
                            className="px-4 py-2 border-2 border-red-600 text-red-600 rounded-lg font-bold text-xs hover:bg-red-50 transition-all whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
