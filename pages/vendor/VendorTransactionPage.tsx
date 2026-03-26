import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getMyTransactions,
  getMyWallet,
  getTransactionById,
  getRelatedTransactions,
  createTopupLink,
  WalletInfo,
  WalletTransaction,
  TransactionFilter
} from '../../services/walletService';
import toast from '../../services/toast';

interface VendorTransactionPageProps {
  onNavigate: (path: string) => void;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDateTimeVi = (dateStr: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  const day = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${time} ${day}`;
};

const getTransactionStatusLabel = (status: string) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'success' || normalized === 'succeeded') return 'Thành công';
  if (normalized === 'pending') return 'Đang xử lý';
  if (normalized === 'failed') return 'Thất bại';
  if (normalized === 'cancelled') return 'Đã hủy';
  return status;
};

const getTransactionStatusClass = (status: string) => {
  const normalized = String(status || '').trim().toLowerCase();
  if (normalized === 'success' || normalized === 'succeeded') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (normalized === 'pending') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (normalized === 'failed' || normalized === 'cancelled') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const getTransactionTypeLabel = (type: string, amount: number): string => {
  const normalized = String(type || '').trim().toLowerCase();
  
  if ((normalized === 'systemadjustment' || normalized === 'adjust') && amount > 0) {
    return 'Nạp tiền';
  }
  if ((normalized === 'systemadjustment' || normalized === 'adjust') && amount < 0) {
    return 'Điều chỉnh số dư';
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

const VendorTransactionPage: React.FC<VendorTransactionPageProps> = ({ onNavigate }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  
  const [detailTx, setDetailTx] = useState<WalletTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [relatedTxs, setRelatedTxs] = useState<WalletTransaction[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const filter: TransactionFilter = {
        type: typeFilter || undefined,
        status: statusFilter || undefined,
        from: fromDate || undefined,
        to: toDate || undefined,
        walletType: 'Vendor'
      };

      const [walletData, txData] = await Promise.all([
        getMyWallet('Vendor'),
        getMyTransactions(filter)
      ]);
      setWallet(walletData);
      
      const sorted = [...txData].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setTransactions(sorted);
    } catch (err) {
      console.error('Failed to fetch transaction data:', err);
      // Giảm bớt cường độ thông báo, nếu lỗi chỉ đơn giản là null/404 thì coi như rỗng
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, statusFilter, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDetail = async (tx: WalletTransaction) => {
    setDetailTx(tx);
    setDetailOpen(true);
    setDetailLoading(true);
    setRelatedTxs([]);
    try {
      const [detail, related] = await Promise.all([
        getTransactionById(tx.id),
        getRelatedTransactions(tx.id)
      ]);
      setDetailTx(detail);
      setRelatedTxs(related);
    } catch (err) {
      console.error('Failed to fetch transaction detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleTopup = async () => {
    const amountStr = window.prompt('Nhập số tiền muốn nạp (₫):', '100000');
    if (!amountStr) return;

    const amount = Number(amountStr);
    if (isNaN(amount) || amount < 5000) {
      toast.error('Số tiền nạp tối thiểu là 5.000 ₫');
      return;
    }

    try {
      toast.info('Đang tạo liên kết thanh toán...');
      const result = await createTopupLink(amount, 'Vendor');
      const url = result.checkoutUrl || result.paymentLink || result.payUrl || result.url || result.link;
      if (url && typeof url === 'string') {
        window.location.href = url;
      } else {
        toast.error('Không thể tạo link nạp tiền.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Nạp tiền thất bại.');
    }
  };

  const totalIn = useMemo(() => {
    return transactions
      .filter(tx => tx.amount > 0)
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const totalOut = useMemo(() => {
    return transactions
      .filter(tx => tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [transactions]);

  return (
    <div className="bg-slate-50 min-h-screen py-10 px-4 md:px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Giao dịch gian hàng</h1>
            <p className="text-sm text-slate-500 mt-1">
              Quản lý doanh thu, phí vận chuyển và lịch sử rút tiền của bạn.
            </p>
          </div>
          <div className="flex gap-3">
            <button
               onClick={handleTopup}
               className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 hover:-translate-y-0.5 transition-all"
            >
              Nạp tiền
            </button>
            <button
              onClick={() => onNavigate('/vendor/withdraw')}
              className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-slate-900/20 hover:-translate-y-0.5 transition-all"
            >
              Rút tiền
            </button>
          </div>
        </div>

        {/* Balance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số dư ví</p>
             <p className="text-2xl font-black text-emerald-600 tabular-nums">{formatCurrency(wallet?.balance || 0)}</p>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tạm giữ</p>
             <p className="text-2xl font-black text-amber-600 tabular-nums">{formatCurrency(wallet?.heldBalance || 0)}</p>
           </div>
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nợ hệ thống</p>
             <p className="text-2xl font-black text-rose-600 tabular-nums">{formatCurrency(wallet?.debt || 0)}</p>
           </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Loại giao dịch</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full rounded-xl border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 border-none px-4 py-3 focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
              >
                <option value="">Tất cả loại giao dịch</option>
                <option value="Deposit">Nạp tiền</option>
                <option value="Withdrawal">Rút tiền</option>
                <option value="PaymentOrder">Nhận thanh toán</option>
                <option value="RefundOrder">Hoàn tiền đơn</option>
                <option value="Penalty">Phạt vi phạm</option>
                <option value="Commission">Phí hoa hồng</option>
                <option value="ShippingFee">Phí vận chuyển</option>
                <option value="Adjust">Điều chỉnh số dư</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Trạng thái</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 border-none px-4 py-3 focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="Success">Thành công</option>
                <option value="Pending">Đang xử lý</option>
                <option value="Failed">Thất bại</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Từ ngày</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-xl border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 border-none px-4 py-3 focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Đến ngày</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-xl border-slate-200 text-sm font-bold text-slate-700 bg-slate-50 border-none px-4 py-3 focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between mt-8 gap-6">
            <button
              type="button"
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
                setFromDate('');
                setToDate('');
              }}
              className="inline-flex items-center px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest border-2 border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200 transition-all"
            >
              Làm mới bộ lọc
            </button>
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-4 py-2.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black flex items-center gap-2 border border-emerald-100/50">
                Tổng tiền vào: <span className="text-emerald-800 font-black tabular-nums">{formatCurrency(totalIn)}</span>
              </div>
              <div className="px-4 py-2.5 bg-rose-50 text-rose-700 rounded-full text-xs font-black flex items-center gap-2 border border-rose-100/50">
                Tổng tiền ra: <span className="text-rose-800 font-black tabular-nums">{formatCurrency(totalOut)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden min-h-[400px]">
          {loading ? (
             <div className="p-16 text-center text-slate-400 italic font-bold">Đang tải dữ liệu giao dịch...</div>
          ) : transactions.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-bold">Chưa có giao dịch nào phù hợp.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                const incoming = tx.amount >= 0;
                const statusLabel = getTransactionStatusLabel(tx.status);
                const statusClass = getTransactionStatusClass(tx.status);

                return (
                  <div
                    key={tx.id}
                    className="p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-6 cursor-pointer hover:bg-slate-50 transition-colors group"
                    onClick={() => handleOpenDetail(tx)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                          {getTransactionTypeLabel(tx.type, tx.amount)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <p className="text-base font-black text-slate-900 leading-snug">
                        {tx.description || 'Không có mô tả'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                        <span>{formatDateTimeVi(tx.createdAt)}</span>
                        {tx.id && <span className="opacity-40">• Mã GD: {tx.id}</span>}
                      </p>
                    </div>

                    <div className="text-right min-w-[160px]">
                      <p className={`text-base md:text-lg font-extrabold tabular-nums ${incoming ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {incoming ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                      </p>
                      {tx.balanceAfter !== null && (
                        <p className="mt-1 text-xs text-slate-500 font-bold">
                          Số dư sau giao dịch: {formatCurrency(Math.abs(tx.balanceAfter as number))}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Detail */}
      {detailOpen && detailTx && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4"
          onClick={() => setDetailOpen(false)}
        >
          <div
            className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chi tiết giao dịch</p>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  {getTransactionTypeLabel(detailTx.type, detailTx.amount)}
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-widest">Mã GD: {detailTx.id}</p>
              </div>
              <button
                onClick={() => setDetailOpen(false)}
                className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center border border-slate-100"
              >
                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-8 space-y-8">
              {detailLoading && <p className="text-xs text-slate-400 italic">Đang tải thêm...</p>}

              <div className="grid grid-cols-2 gap-8">
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số tiền</p>
                   <p className={`text-2xl font-black tabular-nums ${detailTx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {detailTx.amount >= 0 ? '+' : ''}{formatCurrency(detailTx.amount)}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số dư sau GD</p>
                   <p className="text-2xl font-black text-slate-900 tabular-nums">
                     {detailTx.balanceAfter !== null ? formatCurrency(detailTx.balanceAfter as number) : '--'}
                   </p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ngày tạo</p>
                   <p className="text-sm font-bold text-slate-700">{formatDateTimeVi(detailTx.createdAt)}</p>
                 </div>
                 <div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trạng thái</p>
                   <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getTransactionStatusClass(detailTx.status)}`}>
                     {getTransactionStatusLabel(detailTx.status)}
                   </span>
                 </div>
              </div>

              <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mô tả</p>
                 <p className="text-sm text-slate-700 font-bold leading-relaxed">{detailTx.description || 'Không có mô tả chi tiết.'}</p>
              </div>

              {relatedTxs.length > 0 && (
                 <div className="pt-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Các giao dịch liên quan</p>
                    <div className="space-y-3">
                      {relatedTxs.map(rtx => (
                        <div key={rtx.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl">
                          <div>
                            <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{getTransactionTypeLabel(rtx.type, rtx.amount)}</p>
                            <p className="text-[9px] text-slate-400 font-bold">{formatDateTimeVi(rtx.createdAt).split(' ')[0]}</p>
                          </div>
                          <p className={`text-sm font-black tabular-nums ${rtx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {rtx.amount >= 0 ? '+' : ''}{formatCurrency(rtx.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorTransactionPage;
