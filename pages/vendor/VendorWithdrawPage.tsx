import React, { useState, useEffect } from 'react';
import { 
  createWithdrawal, 
  getMyWallet, 
  WalletInfo,
  getMyWithdrawalRequests,
  WithdrawalListItem
} from '../../services/walletService';
import toast from '../../services/toast';

interface VendorWithdrawPageProps {
  onNavigate: (path: string) => void;
}

const VendorWithdrawPage: React.FC<VendorWithdrawPageProps> = ({ onNavigate }) => {
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [withdrawals, setWithdrawals] = useState<WithdrawalListItem[]>([]);
  
  const [formData, setFormData] = useState({
    amount: '',
    bankName: '',
    accountNumber: '',
    accountHolder: '',
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [walletData, withdrawalData] = await Promise.all([
        getMyWallet('Vendor'),
        getMyWithdrawalRequests()
      ]);
      setWallet(walletData);
      setWithdrawals(withdrawalData);
      
      // Pre-fill from wallet if available (if backend provides these)
      // Or we can pre-fill from previous successful withdrawals if we have them
      if (withdrawalData.length > 0) {
        const last = withdrawalData[0];
        // Parse bank/account from last withdrawal if needed
        const bankParts = last.bank.split(' - ');
        setFormData(prev => ({
          ...prev,
          bankName: bankParts[0] || '',
          accountNumber: bankParts[1] || '',
          accountHolder: last.vendor || '',
        }));
      }
    } catch (err) {
      console.error('Failed to fetch withdraw data:', err);
      toast.error('Không thể tải dữ liệu ví.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    
    if (isNaN(amount) || amount < 50000) {
      toast.error('Số tiền rút tối thiểu là 50.000 ₫.');
      return;
    }

    if (wallet && amount > (wallet.balance || 0)) {
      toast.error('Số dư khả dụng không đủ.');
      return;
    }

    try {
      setSubmitting(true);
      await createWithdrawal({
        amount,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        accountHolder: formData.accountHolder,
        type: 'Vendor'
      });
      toast.success('Yêu cầu rút tiền đã được gửi. Vui lòng chờ hệ thống phê duyệt.');
      setFormData({ ...formData, amount: '' });
      fetchData(); // Refresh
    } catch (err: any) {
      toast.error(err.message || 'Rút tiền thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <div className="min-h-screen py-12 px-4 md:px-8 font-sans">
      <div className="max-w-[1650px] mx-auto">
        
        {/* Header Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex items-start gap-5">
            <button
              onClick={() => onNavigate('/vendor/transactions')}
              className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-700 flex-shrink-0 hover:bg-slate-50 hover:text-black transition-all group"
              title="Quay lại Giao dịch"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Rút tiền</h1>
              <p className="text-slate-500 font-bold text-sm">Rút doanh thu từ ví Vendor về tài khoản ngân hàng của bạn.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Form Section */}
          <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-slate-200 shadow-sm">
            <div className="mb-10 p-8 bg-black rounded-[2rem] text-white relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-full -mr-10 -mt-10" />
               <p className="text-xs font-black text-white/40 uppercase tracking-widest mb-2 relative z-10">Số dư khả dụng</p>
               <h2 className="text-4xl font-black tabular-nums relative z-10">
                 {wallet ? formatVnd(wallet.balance || 0) : '0 ₫'}
               </h2>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Số tiền muốn rút (₫)</label>
                <input
                  type="number"
                  required
                  placeholder="Vd: 1.000.000"
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-lg text-slate-900 focus:ring-2 focus:ring-black transition-all"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tên ngân hàng</label>
                  <input
                    type="text"
                    required
                    placeholder="Vd: Vietcombank"
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-black transition-all"
                    value={formData.bankName}
                    onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Số tài khoản</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập số tài khoản"
                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-black transition-all"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Tên chủ tài khoản</label>
                <input
                  type="text"
                  required
                  placeholder="VD: NGUYEN VAN A"
                  className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold text-slate-900 focus:ring-2 focus:ring-black transition-all uppercase"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({...formData, accountHolder: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="w-full py-5 bg-black text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl shadow-black/20 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {submitting ? 'Đang gửi yêu cầu...' : 'Xác nhận rút tiền'}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-bold px-4 leading-relaxed">
                Yêu cầu rút tiền sẽ được xử lý trong vòng 24h làm việc. Phí chuyển khoản tùy thuộc vào ngân hàng thụ hưởng.
              </p>
            </form>
          </div>

          {/* Recently Withdrawal Section */}
          <div className="space-y-8">
             <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
               <span className="w-1.5 h-6 bg-black rounded-full" />
               Lịch sử rút tiền gần đây
             </h3>

             <div className="space-y-4">
               {loading ? (
                 Array(3).fill(0).map((_, i) => (
                   <div key={i} className="bg-white rounded-[2rem] p-6 border border-slate-100 animate-pulse h-24" />
                 ))
               ) : withdrawals.length === 0 ? (
                 <div className="bg-white rounded-[2rem] p-12 border border-slate-100 text-center">
                   <p className="text-slate-400 font-bold">Chưa có yêu cầu rút tiền nào.</p>
                 </div>
               ) : (
                 withdrawals.map((wd) => (
                   <div key={wd.id} className="bg-white rounded-[2.5rem] p-6 border border-slate-200 shadow-sm flex items-center justify-between group hover:border-black transition-all">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xs ${
                          wd.status === 'Approved' ? 'bg-emerald-100 text-emerald-600' :
                          wd.status === 'Rejected' ? 'bg-rose-100 text-rose-600' :
                          'bg-amber-100 text-amber-600'
                        }`}>
                          {wd.status === 'Approved' ? '✓' : wd.status === 'Rejected' ? '✕' : '...'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{formatVnd(wd.amount)}</p>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{wd.bank}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                          {new Date(wd.requestedAt).toLocaleDateString('vi-VN')}
                        </p>
                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${
                          wd.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                          wd.status === 'Rejected' ? 'bg-rose-50 text-rose-600' :
                          'bg-amber-50 text-amber-600'
                        }`}>
                          {wd.status}
                        </span>
                      </div>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorWithdrawPage;
