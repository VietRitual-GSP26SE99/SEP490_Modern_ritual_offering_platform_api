import React, { useEffect, useState } from 'react';
import { getMyTransactions, getTransactionById, getRelatedTransactions, WalletTransaction, TransactionFilter } from '../../services/walletService';
import toast from '../../services/toast';

interface TransactionHistoryPageProps {
  onNavigate: (path: string) => void;
}

const formatCurrency = (value: number): string => {
  if (!Number.isFinite(value)) return '0đ';
  return `${value.toLocaleString('vi-VN')}đ`;
};

const formatDateTimeVi = (value: string): string => {
  if (!value) return 'Chưa xác định';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getTransactionStatusLabel = (status: string): string => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized.includes('success')) return 'Thành công';
  if (normalized.includes('fail') || normalized.includes('error')) return 'Thất bại';
  if (normalized.includes('pending')) return 'Chờ xử lý';
  if (normalized.includes('processing')) return 'Đang xử lý';
  if (!normalized || normalized === 'n/a') return 'Không có';
  return status;
};

const getTransactionStatusClass = (status: string): string => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized.includes('success') || normalized.includes('thành công')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (normalized.includes('fail') || normalized.includes('error') || normalized.includes('thất bại')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (normalized.includes('pending') || normalized.includes('processing')) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const getTransactionTypeLabel = (type: string, amount?: number): string => {
  const normalized = String(type || '').trim().toLowerCase();

  // If system adjustment results in a positive balance (Admin top-up), show as Nạp tiền for cleaner UI
  if ((normalized === 'systemadjustment' || normalized === 'adjust') && (amount || 0) > 0) {
    return 'Nạp tiền';
  }

  switch (normalized) {
    case 'deposit':
    case 'topup':
      return 'Nạp tiền';
    case 'withdrawal':
    case 'withdraw':
      return 'Rút tiền';
    case 'paymentorder':
      return 'Thanh toán đơn hàng';
    case 'systemadjustment':
    case 'adjust':
      return 'Điều chỉnh số dư';
    case 'vendorincome':
      return 'Doanh thu nhà cung cấp';
    case 'refundcustomer':
    case 'refundorder':
      return 'Hoàn tiền';
    case 'vendorcompensation':
      return 'Bồi thường nhà cung cấp';
    case 'penaltyvendor':
    case 'penalty':
      return 'Phạt vi phạm';
    case 'debtsettlement':
      return 'Thanh toán công nợ';
    case 'withholdingdeduction':
      return 'Khấu trừ tạm giữ';
    case 'withholdingrelease':
      return 'Giải phóng tạm giữ';
    case 'platformfee':
      return 'Phí nền tảng';
    default:
      return type || 'Khác';
  }
};

const isIncomingTransaction = (tx: WalletTransaction): boolean => {
  const normalized = String(tx.type || '').trim().toLowerCase();
  // Các loại giao dịch cộng tiền vào ví
  if (
    normalized === 'deposit' ||
    normalized === 'vendorincome' ||
    normalized === 'refundcustomer' ||
    normalized === 'withholdingrelease'
  ) {
    return true;
  }

  // Các loại hay trừ tiền khỏi ví
  if (
    normalized === 'withdrawal' ||
    normalized === 'paymentorder' ||
    normalized === 'penaltyvendor' ||
    normalized === 'platformfee' ||
    normalized === 'withholdingdeduction'
  ) {
    return false;
  }

  // Mặc định: xem amount > 0 là cộng tiền
  return (tx.amount || 0) >= 0;
};

const toDateParam = (value: string | null): string | undefined => {
  if (!value) return undefined;
  // Use standard ISO-like format YYYY-MM-DD which is common for our APIs
  return value;
};

const buildInitialDateRange = () => {
  const today = new Date();
  const to = today.toISOString().slice(0, 10);
  const fromDate = new Date(today);
  fromDate.setDate(today.getDate() - 7);
  const from = fromDate.toISOString().slice(0, 10);
  return { from, to };
};

const TransactionHistoryPage: React.FC<TransactionHistoryPageProps> = () => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTx, setDetailTx] = useState<WalletTransaction | null>(null);
  const [detailRaw, setDetailRaw] = useState<Record<string, unknown> | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [relatedChain, setRelatedChain] = useState<WalletTransaction[]>([]);

  const initialDates = buildInitialDateRange();
  const [showFilters, setShowFilters] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>(initialDates.from);
  const [toDate, setToDate] = useState<string>(initialDates.to);

  const fetchData = async (options?: { showToastOnError?: boolean }) => {
    try {
      setLoading(true);
      setError(null);

      const filter: TransactionFilter = {
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        from: toDateParam(fromDate),
        to: toDateParam(toDate),
      };

      const data = await getMyTransactions(filter);
      const sorted = [...data].sort((a, b) => {
        const ta = new Date(a.createdAt).getTime();
        const tb = new Date(b.createdAt).getTime();
        return (Number.isNaN(tb) ? 0 : tb) - (Number.isNaN(ta) ? 0 : ta);
      });

      setTransactions(sorted);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải lịch sử giao dịch.';
      setError(message);
      if (options?.showToastOnError !== false) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData({ showToastOnError: false });
  }, []);

  const handleApplyFilters = () => {
    void fetchData();
  };

  const handleClearFilters = () => {
    const range = buildInitialDateRange();
    setTypeFilter('');
    setStatusFilter('');
    setFromDate(range.from);
    setToDate(range.to);
    void fetchData();
  };

  const handleOpenDetail = async (tx: WalletTransaction) => {
    setDetailOpen(true);
    setDetailTx(tx);
    setDetailRaw((tx.raw as Record<string, unknown> | undefined) || null);
    setDetailError(null);
    setRelatedChain([]);

    if (!tx.id) return;

    try {
      setDetailLoading(true);
      const [fresh, chain] = await Promise.all([
        getTransactionById(tx.id),
        getRelatedTransactions(tx.id),
      ]);
      setDetailTx(fresh);
      setDetailRaw((fresh.raw as Record<string, unknown> | undefined) || null);
      setRelatedChain(chain);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải chi tiết.';
      setDetailError(message);
      toast.error(message);
    } finally {
      setDetailLoading(false);
    }
  };

  const totalIn = transactions
    .filter((tx) => isIncomingTransaction(tx))
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalOut = transactions
    .filter((tx) => !isIncomingTransaction(tx))
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const relatedTransactions = (() => {
    if (!detailRaw) return [] as any[];
    const anyRaw = detailRaw as any;
    if (Array.isArray(anyRaw.relatedTransactions)) return anyRaw.relatedTransactions as any[];
    if (Array.isArray(anyRaw.RelatedTransactions)) return anyRaw.RelatedTransactions as any[];
    return [] as any[];
  })();

  const parentTransactionId = (() => {
    if (!detailRaw) return null as string | null;
    const anyRaw = detailRaw as any;
    return (
      (anyRaw.relatedTransactionId as string | undefined) ||
      (anyRaw.RelatedTransactionId as string | undefined) ||
      (anyRaw.parentTransactionId as string | undefined) ||
      (anyRaw.ParentTransactionId as string | undefined) ||
      null
    );
  })();

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-4xl font-black text-slate-900 font-display italic tracking-tight">Lịch sử ví</h1>
          <p className="text-sm text-slate-500 mt-1 font-medium">Theo dõi biến động và lịch sử giao dịch của bạn.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden flex items-center justify-center gap-2 px-6 py-4 rounded-[2rem] bg-white border-2 border-slate-100 text-sm font-black uppercase tracking-widest text-slate-700 active:scale-95 transition-all shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Bộ lọc
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <div className="px-6 py-3 rounded-[2rem] bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.1em] border border-emerald-100 shadow-sm">
          Tổng nhận: {formatCurrency(totalIn)}
        </div>
        <div className="px-6 py-3 rounded-[2rem] bg-rose-50 text-rose-700 text-[10px] font-black uppercase tracking-[0.1em] border border-rose-100 shadow-sm">
          Tổng chi: {formatCurrency(totalOut)}
        </div>
      </div>

      <div className={`${showFilters ? 'block' : 'hidden'} md:block bg-white border border-slate-100 rounded-[2.5rem] p-8 mb-10 shadow-2xl shadow-slate-200/50 transition-all`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Loại giao dịch</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-50 rounded-2xl border-transparent px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all cursor-pointer"
            >
              <option value="">Tất cả loại</option>
              <option value="Deposit">Nạp tiền</option>
              <option value="Withdrawal">Rút tiền</option>
              <option value="PaymentOrder">Thanh toán đơn</option>
              <option value="VendorIncome">Doanh thu</option>
              <option value="RefundCustomer">Hoàn tiền</option>
              <option value="SystemAdjustment">Điều chỉnh hệ thống</option>
              <option value="PlatformFee">Phí nền tảng</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-50 rounded-2xl border-transparent px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all cursor-pointer"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="Success">Thành công</option>
              <option value="Failed">Thất bại</option>
              <option value="Pending">Đang xử lý</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Từ ngày</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-slate-50 rounded-2xl border-transparent px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Đến ngày</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-slate-50 rounded-2xl border-transparent px-5 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:ring-8 focus:ring-primary/5 transition-all"
            />
          </div>
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={() => { handleApplyFilters(); setShowFilters(false); }}
            disabled={loading}
            className="flex-1 bg-slate-900 text-white rounded-[2rem] px-10 py-5 text-xs font-black uppercase tracking-widest hover:bg-primary transition-all shadow-xl shadow-slate-900/10 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Đang lọc...' : 'Cập nhật danh sách'}
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            disabled={loading}
            className="bg-white border-2 border-slate-100 text-slate-400 rounded-[2rem] px-10 py-5 text-xs font-black uppercase tracking-widest hover:border-slate-200 hover:text-slate-600 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Đặt lại lọc
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/40 border border-slate-50 overflow-hidden">
        {transactions.length === 0 && !loading ? (
          <div className="py-24 text-center">
            <div className="size-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-slate-400 font-bold text-lg">Không tìm thấy giao dịch nào</p>
            <p className="text-slate-300 text-sm mt-1">Vui lòng thử thay đổi bộ lọc</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {transactions.map((tx) => {
              const incoming = isIncomingTransaction(tx);
              const statusClass = getTransactionStatusClass(tx.status);

              return (
                <div
                  key={tx.id}
                  className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6 cursor-pointer hover:bg-slate-50/50 transition-all active:bg-slate-100 group"
                  onClick={() => handleOpenDetail(tx)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {getTransactionTypeLabel(tx.type)}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-transparent shadow-sm ${statusClass}`}>
                        {getTransactionStatusLabel(tx.status)}
                      </span>
                    </div>
                    <p className="text-base font-black text-slate-900 group-hover:text-primary transition-colors line-clamp-1 mb-1">
                      {tx.description || 'Giao dịch không có mô tả'}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>{formatDateTimeVi(tx.createdAt)}</span>
                      <span className="text-slate-200">•</span>
                      <span className="font-mono text-[10px]">ID: {String(tx.id).substring(0, 8)}</span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <p className={`text-2xl font-black font-display italic ${incoming ? 'text-emerald-500' : 'text-slate-900'}`}>
                      {incoming ? '+' : '-'}{formatCurrency(tx.amount)}
                    </p>
                    {Number.isFinite(tx.balanceAfter ?? NaN) && (
                      <p className="mt-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Dư: {formatCurrency((tx.balanceAfter as number) ?? 0)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {detailOpen && detailTx && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[150] p-4 sm:p-6"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-10 py-8 border-b border-slate-50 flex items-center justify-between gap-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Thông tin chi tiết</p>
                <h2 className="text-2xl font-black text-slate-900 italic font-display">{getTransactionTypeLabel(detailTx.type)}</h2>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-10 py-8 space-y-10 custom-scrollbar">
              {detailLoading && (
                <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">
                  <div className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  Đang đồng bộ dữ liệu...
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Biến động số tiền</p>
                  <p className={`text-3xl font-black font-display italic ${isIncomingTransaction(detailTx) ? 'text-emerald-500' : 'text-slate-900'}`}>
                    {isIncomingTransaction(detailTx) ? '+' : '-'}{formatCurrency(detailTx.amount)}
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Trạng thái xử lý</p>
                  <span className={`inline-flex px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${getTransactionStatusClass(detailTx.status)}`}>
                    {getTransactionStatusLabel(detailTx.status)}
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Thời gian giao dịch</p>
                  <p className="text-base font-bold text-slate-700">{formatDateTimeVi(detailTx.createdAt)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Mã định danh (ID)</p>
                  <p className="font-mono text-sm text-slate-400 font-medium break-all">{detailTx.id}</p>
                </div>

                {detailTx.walletType && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Nguồn ví</p>
                    <p className="text-base font-bold text-slate-700">{detailTx.walletType}</p>
                  </div>
                )}

                {Number.isFinite(detailTx.balanceAfter ?? NaN) && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Số dư sau GD</p>
                    <p className="text-base font-black text-slate-900">{formatCurrency((detailTx.balanceAfter as number) ?? 0)}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi chú giao dịch</p>
                <p className="text-base text-slate-700 font-bold leading-relaxed whitespace-pre-line text-balance">
                  {detailTx.description || 'Không có mô tả bổ sung cho giao dịch này.'}
                </p>
              </div>

              {(parentTransactionId || relatedChain.length > 0) && (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest shrink-0">Dòng giao dịch liên quan</p>
                    <div className="h-px bg-slate-100 w-full"></div>
                  </div>

                  {relatedChain.length > 0 && (
                    <div className="space-y-3">
                      {[...relatedChain]
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((rt) => {
                          const isCurrent = detailTx && rt.id === detailTx.id;
                          const incoming = isIncomingTransaction(rt);
                          return (
                            <button
                              key={rt.id}
                              type="button"
                              onClick={() => { if (!isCurrent) void handleOpenDetail(rt); }}
                              className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all ${isCurrent
                                  ? 'border-primary/40 bg-primary/5 ring-4 ring-primary/5'
                                  : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:scale-[0.99]'
                                }`}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                    {getTransactionTypeLabel(rt.type)}
                                  </span>
                                  {isCurrent && <span className="text-[9px] font-black uppercase text-primary tracking-widest bg-primary/10 px-2 py-0.5 rounded-full">Hiện tại</span>}
                                </div>
                                <p className="truncate text-xs font-bold text-slate-700">{rt.description || 'N/A'}</p>
                              </div>
                              <div className="text-right">
                                <p className={`font-black text-sm italic font-display ${incoming ? 'text-emerald-500' : 'text-slate-900'}`}>
                                  {incoming ? '+' : '-'}{formatCurrency(rt.amount)}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryPage;
