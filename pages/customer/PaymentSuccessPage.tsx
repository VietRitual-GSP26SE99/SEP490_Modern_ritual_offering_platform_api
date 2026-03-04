import React, { useEffect, useState } from 'react';
import { checkoutService } from '../../services/checkoutService';
import toast from '../../services/toast';

interface PaymentSuccessPageProps {
  onNavigate: (path: string) => void;
}

const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ onNavigate }) => {
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        // Lấy transactionId từ URL params
        const params = new URLSearchParams(window.location.search);
        const transactionId = params.get('transactionId');

        if (!transactionId) {
          setError('Không tìm thấy mã giao dịch');
          toast.error('Không tìm thấy mã giao dịch');
          setLoading(false);
          return;
        }

        console.log('💳 Transaction ID from URL:', transactionId);

        // Gọi API GET /api/payments/{transactionId}
        const result = await checkoutService.getTransaction(transactionId);

        if (result) {
          setTransaction(result);
          console.log('✅ Transaction details:', result);
          
          // Hiển thị toast theo trạng thái
          if (result.status === 'Success' || result.paymentStatus === 'Success') {
            toast.success('Thanh toán thành công!');
          } else if (result.status === 'Pending' || result.paymentStatus === 'Pending') {
            toast.info('Đang xử lý thanh toán...');
          } else {
            toast.warning('Trạng thái thanh toán: ' + (result.status || result.paymentStatus || 'Unknown'));
          }
        } else {
          setError('Không thể lấy thông tin giao dịch');
          toast.error('Không thể lấy thông tin giao dịch');
        }
      } catch (err: any) {
        console.error('❌ Failed to fetch transaction:', err);
        setError('Đã xảy ra lỗi khi lấy thông tin giao dịch');
        toast.error('Đã xảy ra lỗi khi lấy thông tin giao dịch');
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary mb-4"></div>
          <p className="text-lg text-gray-600 font-medium">Đang xử lý kết quả thanh toán...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => onNavigate('/')}
            className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const isSuccess = transaction?.status === 'Success' || transaction?.paymentStatus === 'Success';
  const isPending = transaction?.status === 'Pending' || transaction?.paymentStatus === 'Pending';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 px-4">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 md:p-12">
        {/* Icon */}
        <div className={`w-24 h-24 ${isSuccess ? 'bg-green-100' : isPending ? 'bg-yellow-100' : 'bg-red-100'} rounded-full flex items-center justify-center mx-auto mb-8`}>
          {isSuccess ? (
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : isPending ? (
            <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2" style={{ color: isSuccess ? '#10b981' : isPending ? '#f59e0b' : '#ef4444' }}>
          {isSuccess ? 'Thanh toán thành công!' : isPending ? 'Đang xử lý thanh toán' : 'Thanh toán thất bại'}
        </h1>
        <p className="text-center text-gray-600 mb-8">
          {isSuccess ? 'Đơn hàng của bạn đã được thanh toán thành công' : isPending ? 'Giao dịch của bạn đang được xử lý' : 'Đã xảy ra lỗi trong quá trình thanh toán'}
        </p>

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 space-y-3">
          {transaction?.orderId && (
            <div className="flex justify-between">
              <span className="text-gray-600">Mã đơn hàng</span>
              <span className="font-bold text-gray-900">{transaction.orderId}</span>
            </div>
          )}
          {transaction?.transactionId && (
            <div className="flex justify-between">
              <span className="text-gray-600">Mã giao dịch</span>
              <span className="font-mono text-sm text-gray-900">{transaction.transactionId}</span>
            </div>
          )}
          {transaction?.amount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Số tiền</span>
              <span className="font-bold text-primary">{transaction.amount.toLocaleString('vi-VN')}₫</span>
            </div>
          )}
          {transaction?.totalAmount && (
            <div className="flex justify-between">
              <span className="text-gray-600">Tổng tiền</span>
              <span className="font-bold text-primary">{transaction.totalAmount.toLocaleString('vi-VN')}₫</span>
            </div>
          )}
          {(transaction?.status || transaction?.paymentStatus) && (
            <div className="flex justify-between">
              <span className="text-gray-600">Trạng thái</span>
              <span className={`font-bold ${isSuccess ? 'text-green-600' : isPending ? 'text-yellow-600' : 'text-red-600'}`}>
                {transaction.status || transaction.paymentStatus}
              </span>
            </div>
          )}
          {transaction?.paymentMethod && (
            <div className="flex justify-between">
              <span className="text-gray-600">Phương thức</span>
              <span className="font-medium text-gray-900">{transaction.paymentMethod}</span>
            </div>
          )}
          {transaction?.createdAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Thời gian</span>
              <span className="font-medium text-gray-900">{new Date(transaction.createdAt).toLocaleString('vi-VN')}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isSuccess && transaction?.orderId && (
            <button
              onClick={() => onNavigate(`/tracking?orderId=${transaction.orderId}`)}
              className="flex-1 bg-primary text-white font-bold py-4 px-6 rounded-xl hover:bg-primary/90 transition"
            >
              Theo dõi đơn hàng
            </button>
          )}
          <button
            onClick={() => onNavigate('/')}
            className={`flex-1 ${isSuccess ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-primary text-white hover:bg-primary/90'} font-bold py-4 px-6 rounded-xl transition`}
          >
            {isSuccess ? 'Về trang chủ' : 'Thử lại'}
          </button>
        </div>

        {/* Additional Note */}
        {isSuccess && (
          <p className="text-center text-sm text-gray-500 mt-6">
            Chúng tôi đã gửi email xác nhận đến địa chỉ của bạn
          </p>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
