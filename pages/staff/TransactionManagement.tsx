import React, { useState, useEffect, useCallback } from 'react';
import { 
  getAllTransactions, 
  getTransactionById, 
  getRelatedTransactions,
  WalletTransaction,
  AllTransactionFilter 
} from '../../services/walletService';
import toast from '../../services/toast';

interface TransactionManagementProps {
  onNavigate: (path: string) => void;
  userRole: 'admin' | 'staff';
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
  'PaymentOrder': 'Thanh toán đơn hàng',
  'RefundOrder': 'Hoàn tiền',
  'Commission': 'Phí hoa hồng',
  'ShippingFee': 'Phí vận chuyển',
  'Penalty': 'Phạt vi phạm',
  'Adjust': 'Điều chỉnh số dư',
  'PlatformFee': 'Phí nền tảng',
};

const TransactionManagement: React.FC<TransactionManagementProps> = ({ onNavigate, userRole }) => {
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<AllTransactionFilter>({});
  const [selectedTx, setSelectedTx] = useState<WalletTransaction | null>(null);
  const [relatedTxs, setRelatedTxs] = useState<WalletTransaction[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      let data = await getAllTransactions(filter);
      
      // BR-057: Staff bị loại trừ PlatformFee và system wallet transactions
      if (userRole === 'staff') {
        data = data.filter(tx => 
          tx.type !== 'PlatformFee' && 
          tx.walletType !== 'System' // Giả sử walletType 'System' là system wallet
        );
      }
      
      setTransactions(data);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      toast.error('Không thể tải danh sách giao dịch.');
    } finally {
      setLoading(false);
      setCurrentPage(1);
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
  const totalPages = Math.ceil(transactions.length / ITEMS_PER_PAGE);
  const currentTransactions = transactions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 md:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            <button
              onClick={() => onNavigate(userRole === 'admin' ? '/admin/dashboard' : '/staff/dashboard')}
              className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0 hover:bg-slate-50 hover:text-black transition-all group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Quản lý giao dịch</h1>
              <p className="text-slate-500 font-bold text-sm">
                Theo dõi và kiểm soát toàn bộ dòng tiền trong hệ thống.
                {userRole === 'staff' && <span className="ml-2 bg-blue-100 text-blue-600 px-2 py-0.5 rounded-md text-[10px] uppercase font-black tracking-widest">Quyền Staff</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Mã Ví</label>
              <input 
                type="text"
                placeholder="Nhập mã ví..."
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-black transition-all"
                value={filter.walletId || ''}
                onChange={(e) => setFilter({...filter, walletId: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Loại GD</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-black transition-all"
                value={filter.type || ''}
                onChange={(e) => setFilter({...filter, type: e.target.value})}
              >
                <option value="">Tất cả loại</option>
                {Object.entries(TRANSACTION_TYPE_LABELS)
                  .filter(([val]) => userRole === 'admin' || val !== 'PlatformFee')
                  .map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Trạng thái</label>
              <select 
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-black transition-all"
                value={filter.status || ''}
                onChange={(e) => setFilter({...filter, status: e.target.value})}
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(TRANSACTION_STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Từ ngày</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-black transition-all"
                value={filter.from || ''}
                onChange={(e) => setFilter({...filter, from: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Đến ngày</label>
              <input 
                type="date"
                className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-black transition-all"
                value={filter.to || ''}
                onChange={(e) => setFilter({...filter, to: e.target.value})}
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={() => setFilter({})}
                className="w-full h-[46px] bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-50 hover:text-rose-600 transition-all"
              >
                Xóa bộ lọc
              </button>
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Thời gian</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nội dung</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Số tiền</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  Array(8).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6">
                        <div className="h-4 bg-slate-100 rounded-lg w-full" />
                      </td>
                    </tr>
                  ))
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <p className="text-slate-400 font-bold">Không tìm thấy giao dịch nào.</p>
                    </td>
                  </tr>
                ) : (
                  currentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
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
                        <p className="text-xs text-slate-500 truncate max-w-[250px]" title={tx.description}>
                          {tx.description || 'Không có mô tả'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <p className={`text-base font-black tabular-nums ${
                          tx.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {tx.amount >= 0 ? '+' : ''}{formatVnd(tx.amount)}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyle(tx.status)}`}>
                          {TRANSACTION_STATUS_LABELS[tx.status] || tx.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button 
                          onClick={() => handleShowDetail(tx)}
                          className="w-10 h-10 bg-slate-100 rounded-xl inline-flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm"
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

          {/* Pagination Controls */}
          {!loading && transactions.length > 0 && (
            <div className="bg-slate-50/50 px-8 py-4 flex items-center justify-between border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Hiển thị <span className="text-slate-900">{Math.min(transactions.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}</span> 
                - <span className="text-slate-900">{Math.min(transactions.length, currentPage * ITEMS_PER_PAGE)}</span> 
                trên <span className="text-slate-900">{transactions.length}</span> kết quả
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = currentPage <= 3 ? i + 1 : (currentPage >= totalPages - 2 ? totalPages - 4 + i : currentPage - 2 + i);
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 rounded-xl font-bold text-[10px] transition-all ${currentPage === pageNum ? 'bg-black text-white' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-500 hover:bg-black hover:text-white transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
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
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">ID: {selectedTx.id}</p>
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
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Thời gian</p>
                      <p className="font-bold text-slate-900">{new Date(selectedTx.createdAt).toLocaleString('vi-VN')}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ví / Wallet</p>
                      <p className="font-bold text-slate-900 truncate" title={selectedTx.walletId}>{selectedTx.walletId}</p>
                      <span className="text-[8px] px-1.5 py-0.5 bg-slate-100 text-slate-400 rounded uppercase font-black">{selectedTx.walletType}</span>
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
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Số dư sau GD</p>
                      <p className="font-bold text-slate-900 tabular-nums">
                        {selectedTx.balanceAfter !== null ? formatVnd(selectedTx.balanceAfter!) : '--'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[2rem] p-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Mô tả giao dịch</p>
                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{selectedTx.description || 'Không có mô tả'}</p>
                  </div>

                  {relatedTxs.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Các giao dịch liên quan trong chuỗi</p>
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

export default TransactionManagement;
