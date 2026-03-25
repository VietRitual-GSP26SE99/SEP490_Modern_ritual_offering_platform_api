import React, { useState, useEffect, useCallback } from 'react';
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

const TRANSACTION_STATUS_LABELS: Record<string, string> = {
  'Success': 'Thành công',
  'Succeeded': 'Thành công',
  'Pending': 'Đang xử lý',
  'Failed': 'Thất bại',
  'Cancelled': 'Đã hủy',
};

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  'Topup': 'Nạp tiền',
  'Deposit': 'Nạp tiền',
  'Withdrawal': 'Rút tiền',
  'Withdraw': 'Rút tiền',
  'PaymentOrder': 'Nhận thanh toán',
  'RefundOrder': 'Hoàn tiền',
  'Commission': 'Phí hoa hồng',
  'ShippingFee': 'Phí vận chuyển',
  'Penalty': 'Phạt vi phạm',
  'Adjust': 'Điều chỉnh số dư',
};

const VendorTransactionPage: React.FC<VendorTransactionPageProps> = ({ onNavigate }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionFilter>({});
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [relatedTxs, setRelatedTxs] = useState<WalletTransaction[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [walletData, txData] = await Promise.all([
        getMyWallet('Vendor'),
        getMyTransactions(filter)
      ]);
      setWallet(walletData);
      setTransactions(txData);
    } catch (err) {
      console.error('Failed to fetch transaction data:', err);
      toast.error('Không thể tải dữ liệu giao dịch.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleShowDetail = async (tx: WalletTransaction) => {
    setSelectedTx(tx);
    setLoadingDetail(true);
    setRelatedTxs([]);
    try {
      const [detail, related] = await Promise.all([
        getTransactionById(tx.id),
        getRelatedTransactions(tx.id)
      ]);
      setSelectedTx(detail);
      setRelatedTxs(related);
    } catch (err) {
      console.error('Failed to fetch transaction detail:', err);
    } finally {
      setLoadingDetail(false);
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

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Success':
      case 'Succeeded':
        return 'bg-emerald-100 text-emerald-700';
      case 'Pending':
        return 'bg-amber-100 text-amber-700';
      case 'Failed':
      case 'Cancelled':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            {/* <button
              onClick={() => onNavigate('/vendor/dashboard')}
              className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0 hover:bg-slate-50 hover:text-black transition-all group"
              title="Quay lại Bảng điều khiền"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button> */}
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Giao Dịch</h1>
              <p className="text-slate-500 font-bold text-sm">Quản lý dòng tiền, doanh thu và lịch sử thanh toán.</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleTopup}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:-translate-y-1 transition-all flex items-center gap-3 text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Nạp tiền</span>
            </button>

            <button
              onClick={() => onNavigate('/vendor/withdraw')}
              className="px-10 py-4 bg-black text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-black/10 hover:shadow-black/20 hover:-translate-y-1 transition-all flex items-center gap-3 text-xs"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>Rút tiền</span>
            </button>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Số dư khả dụng</p>
            <h2 className="text-4xl font-black text-emerald-600 tabular-nums relative z-10">
              {wallet ? formatVnd(wallet.balance || 0) : '0 ₫'}
            </h2>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Đang đóng băng</p>
            <h2 className="text-4xl font-black text-amber-600 tabular-nums relative z-10">
              {wallet ? formatVnd(wallet.heldBalance || 0) : '0 ₫'}
            </h2>
          </div>
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 relative z-10">Nợ hệ thống</p>
            <h2 className="text-4xl font-black text-slate-600 tabular-nums relative z-10">
              {wallet ? formatVnd(wallet.debt || 0) : '0 ₫'}
            </h2>
          </div>
        </div>

        {/* Transactions Section */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h3 className="text-xl font-black text-slate-900">Lịch sử giao dịch</h3>
            <div className="flex flex-wrap gap-3">
              <select
                className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-black transition-all"
                value={filter.type || ''}
                onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              >
                <option value="">Tất cả loại</option>
                {Object.entries(TRANSACTION_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <select
                className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-black transition-all"
                value={filter.status || ''}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(TRANSACTION_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày giao dịch</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Loại giao dịch</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Số tiền</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6">
                        <div className="h-4 bg-slate-100 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <p className="text-slate-400 font-bold">Không tìm thấy giao dịch nào.</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-900">
                          {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="text-[10px] text-slate-400 font-black tabular-nums">
                          {new Date(tx.createdAt).toLocaleTimeString('vi-VN')}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-800">
                          {TRANSACTION_TYPE_LABELS[tx.type] || tx.type}
                        </p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]" title={tx.description}>
                          {tx.description || 'Không có mô tả'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className={`text-base font-black tabular-nums ${tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}>
                          {tx.amount >= 0 ? '+' : ''}{formatVnd(tx.amount)}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(tx.status)}`}>
                          {TRANSACTION_STATUS_LABELS[tx.status] || tx.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <button
                          onClick={() => handleShowDetail(tx)}
                          className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setSelectedTx(null)} />
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 md:p-12">
              <div className="flex justify-between items-start mb-10">
                <div>
                  <h4 className="text-3xl font-black text-slate-900 mb-2">Chi tiết giao dịch</h4>
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Mã: {selectedTx.id}</p>
                </div>
                <button onClick={() => setSelectedTx(null)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {loadingDetail ? (
                <div className="py-20 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-100 border-t-black mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">Đang tải chi tiết...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                      <p className="font-bold text-slate-900">{new Date(selectedTx.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Trạng thái</p>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(selectedTx.status)}`}>
                        {TRANSACTION_STATUS_LABELS[selectedTx.status] || selectedTx.status}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Loại</p>
                      <p className="font-bold text-slate-900">{TRANSACTION_TYPE_LABELS[selectedTx.type] || selectedTx.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số tiền</p>
                      <p className={`text-xl font-black tabular-nums ${selectedTx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {selectedTx.amount >= 0 ? '+' : ''}{formatVnd(selectedTx.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[2rem] p-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mô tả</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{selectedTx.description || 'Không có mô tả'}</p>
                  </div>

                  {relatedTxs.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Các giao dịch liên quan</p>
                      <div className="space-y-3">
                        {relatedTxs.map(rtx => (
                          <div key={rtx.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className={`w-2 h-2 rounded-full ${getStatusStyle(rtx.status).split(' ')[1].replace('text-', 'bg-')}`} />
                              <div>
                                <p className="text-xs font-black text-slate-800">{TRANSACTION_TYPE_LABELS[rtx.type] || rtx.type}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{new Date(rtx.createdAt).toLocaleTimeString('vi-VN')}</p>
                              </div>
                            </div>
                            <p className={`text-xs font-black tabular-nums ${rtx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {rtx.amount >= 0 ? '+' : ''}{formatVnd(rtx.amount)}
                            </p>
                          </div>
                        ))}
                      </div>
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

export default VendorTransactionPage;
