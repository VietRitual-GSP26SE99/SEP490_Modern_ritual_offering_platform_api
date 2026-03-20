import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService, Order } from '../../services/orderService';
import { refundService, RefundRecord } from '../../services/refundService';
import toast from '../../services/toast';
import RefundModal from '../../components/customer/RefundModal';
import ReviewModal from '../../components/customer/ReviewModal';

const OrderDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [completing, setCompleting] = useState(false);
    const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [selectedItemForReview, setSelectedItemForReview] = useState<{ itemId: string, packageName: string } | null>(null);
    const [refundInfo, setRefundInfo] = useState<RefundRecord | null>(null);
    const [escalating, setEscalating] = useState(false);
    const [refundDismissed, setRefundDismissed] = useState(false);

    const fetchOrder = async () => {
        if (!id) return;
        try {
            const data = await orderService.getOrderDetails(id);
            if (data) {
                setOrder(data);
                await loadRefundInfo(data.orderId);
            } else {
                toast.error('Không tìm thấy đơn hàng!');
                navigate('/profile/orders');
            }
        } catch (error) {
            console.error('Lỗi khi lấy chi tiết đơn hàng:', error);
            toast.error('Không thể tải chi tiết đơn hàng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id, navigate]);

    const loadRefundInfo = async (orderId: string) => {
        try {
            const refundId = localStorage.getItem(`refundId:${orderId}`);
            if (refundId) {
                const data = await refundService.getRefundById(refundId);
                setRefundInfo(data);
                if (data?.refundId) {
                    setRefundDismissed(Boolean(localStorage.getItem(`refundEscalateDismissed:${data.refundId}`)));
                }
                return;
            }

            const fallback = await refundService.getRefundByOrderId(orderId);
            if (fallback?.refundId) {
                localStorage.setItem(`refundId:${orderId}`, fallback.refundId);
                setRefundDismissed(Boolean(localStorage.getItem(`refundEscalateDismissed:${fallback.refundId}`)));
            }
            setRefundInfo(fallback);
        } catch {
            setRefundInfo(null);
        }
    };

    const handleEscalateRefund = async () => {
        if (!refundInfo) return;
        setEscalating(true);
        try {
            const ok = await refundService.escalateRefund(refundInfo.refundId, true);
            if (ok) {
                toast.success('Đã gửi khiếu nại lên quản trị. Vui lòng chờ phản hồi.');
                localStorage.setItem(`refundEscalateDismissed:${refundInfo.refundId}`, '1');
                setRefundDismissed(true);
            } else {
                toast.error('Không thể gửi khiếu nại. Vui lòng thử lại.');
            }
        } catch (error: any) {
            toast.error(error.message || 'Không thể gửi khiếu nại.');
        } finally {
            setEscalating(false);
        }
    };

    const handleDismissRefundNotice = () => {
        if (!refundInfo) return;
        localStorage.setItem(`refundEscalateDismissed:${refundInfo.refundId}`, '1');
        setRefundDismissed(true);
    };

    const handleCancelOrder = async () => {
        if (!order || window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Không thể hoàn tác!') === false) {
            return;
        }

        setCancelling(true);
        try {
            const success = await orderService.cancelOrder(order.orderId);
            if (success) {
                toast.success('Hủy đơn hàng thành công');
                // Refresh data
                await fetchOrder();
            } else {
                toast.error('Hủy đơn hàng thất bại');
            }
        } catch (error: any) {
            toast.error(error.message || 'Hủy đơn hàng thất bại. Vui lòng thử lại.');
        } finally {
            setCancelling(false);
        }
    };

    const handleCompleteOrder = async () => {
        if (!order || window.confirm('Bạn xác nhận đã nhận đủ hàng và hài lòng với dịch vụ? Thao tác này sẽ hoàn thành đơn hàng.') === false) {
            return;
        }

        setCompleting(true);
        try {
            const success = await orderService.updateOrderStatus(order.orderId, 'Completed');
            if (success) {
                toast.success('Đơn hàng đã hoàn thành');
                await fetchOrder();
            } else {
                toast.error('Không thể hoàn thành đơn hàng');
            }
        } catch (error: any) {
            toast.error(error.message || 'Cập nhật thất bại. Vui lòng thử lại.');
        } finally {
            setCompleting(false);
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'CONFIRMED': return 'Đã xác nhận';
            case 'PAID': return 'Đã thanh toán';
            case 'PREPARING':
            case 'PROCESSING': return 'Đang chuẩn bị';
            case 'SHIPPING':
            case 'DELIVERING': return 'Đang giao hàng';
            case 'DELIVERED': return 'Đã giao hàng';
            case 'COMPLETED': return 'Đã hoàn thành đơn hàng';
            case 'CANCELLED': return 'Đã hủy';
            case 'REFUNDED': return 'Đã hoàn tiền';
            case 'PAYMENTFAILED': return 'Thanh toán lỗi';
            default: return status;
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'CONFIRMED': return 'bg-sky-100 text-sky-700 border-sky-200';
            case 'PAID': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'PREPARING':
            case 'PROCESSING': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'SHIPPING':
            case 'DELIVERING': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            case 'DELIVERED':
            case 'COMPLETED': return 'bg-green-100 text-green-700 border-green-200';
            case 'CANCELLED': return 'bg-red-100 text-red-700 border-red-200';
            case 'REFUNDED': return 'bg-slate-200 text-slate-700 border-slate-200';
            case 'PAYMENTFAILED': return 'bg-rose-100 text-rose-700 border-rose-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
                    <p className="text-slate-500 font-medium">Đang tải chi tiết đơn hàng...</p>
                </div>
            </div>
        );
    }

    if (!order) return null;

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="max-w-4xl mx-auto px-4 md:px-8">

                {/* Header Navigation */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/profile/orders')}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 hover:bg-gray-50 transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 font-display">Chi tiết đơn hàng</h1>
                        <p className="text-sm text-gray-500">Mã: #{order.orderId.substring(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Status Banner */}
                <div className={`p-6 rounded-[2rem] border mb-6 flex items-center justify-between ${getStatusStyle(order.orderStatus)}`}>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Trạng thái hiện tại</p>
                        <h2 className="text-2xl font-black">{getStatusText(order.orderStatus)}</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        {order.orderStatus.toUpperCase() === 'PENDING' && (
                            <button
                                onClick={handleCancelOrder}
                                disabled={cancelling}
                                className={`px-6 py-2 rounded-xl font-bold text-sm transition bg-white text-red-600 border border-red-200 hover:bg-red-50 ${cancelling ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {cancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                            </button>
                        )}
                        {['PAID', 'PROCESSING', 'DELIVERING'].includes(order.orderStatus.toUpperCase()) && (
                            <button
                                onClick={() => navigate(`/tracking?orderId=${order.orderId}`)}
                                className="bg-white/90 backdrop-blur-sm text-current px-6 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-white transition"
                            >
                                Theo dõi ngay
                            </button>
                        )}
                        {order.orderStatus.toUpperCase() === 'DELIVERED' && (
                            <>
                                <button
                                    onClick={() => setIsRefundModalOpen(true)}
                                    className="bg-white text-orange-600 border border-orange-200 px-6 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-orange-50 transition"
                                >
                                    Yêu cầu hoàn tiền
                                </button>
                                <button
                                    onClick={handleCompleteOrder}
                                    disabled={completing}
                                    className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-sm hover:bg-green-700 transition disabled:opacity-50"
                                >
                                    {completing ? 'Đang xử lý...' : 'Hoàn thành đơn'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {(refundInfo?.status === 'Rejected' || order.orderStatus.toUpperCase() === 'VENDORREJECTED') && !refundDismissed && (
                    <div className="bg-white border border-orange-200 rounded-[1.5rem] p-5 mb-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-orange-500">Hoàn tiền bị từ chối</p>
                                <p className="text-sm text-gray-700 mt-1">Bạn muốn khiếu nại lên quản trị không?</p>
                                {refundInfo.adminNote && (
                                    <p className="text-xs text-gray-500 mt-1">Ghi chú: {refundInfo.adminNote}</p>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleDismissRefundNotice}
                                    className="px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50"
                                >
                                    Không khiếu nại
                                </button>
                                <button
                                    onClick={handleEscalateRefund}
                                    disabled={escalating || !refundInfo?.refundId}
                                    className="px-4 py-2 rounded-xl text-sm font-bold bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {escalating ? 'Đang gửi...' : 'Khiếu nại'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Main Info */}
                    <div className="md:col-span-2 space-y-6">

                        {/* Store details */}
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-orange-100 text-primary flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                    </svg>
                                </span>
                                Người cung cấp
                            </h3>
                            <div>
                                <p className="font-bold text-xl text-primary">{order.vendor?.shopName || (order as any).shopName || "Cúng Bái Tâm Linh"}</p>
                                <p className="text-sm text-gray-500 mt-2">Dịch vụ mâm cúng trọn gói và trang trí tận nhà.</p>
                            </div>
                        </div>

                        {/* Application items */}
                        <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                </svg>
                                Danh sách gói lễ
                            </h3>
                            <div className="space-y-6">
                                {order.items?.map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <div className="size-20 rounded-2xl bg-gray-100 border border-gray-200 flex-shrink-0 relative overflow-hidden">
                                            <img src={`https://picsum.photos/200?random=${idx}`} alt={item.packageName} className="w-full h-full object-cover" />
                                            <div className="absolute top-0 right-0 bg-primary text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-bl-lg">
                                                x{item.quantity}
                                            </div>
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <h4 className="font-bold text-gray-800">{item.packageName}</h4>
                                            <p className="text-xs text-gray-500 mt-1">Gói: <span className="text-gray-700 font-medium">{item.variantName}</span></p>
                                        </div>
                                        <div className="pt-1 text-right">
                                            <p className="font-bold text-primary">{(item.lineTotal || (item.price || (item as any).unitPrice || 0) * item.quantity).toLocaleString('vi-VN')}đ</p>

                                            {order.orderStatus.toUpperCase() === 'COMPLETED' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedItemForReview({ itemId: item.itemId, packageName: item.packageName });
                                                        setIsReviewModalOpen(true);
                                                    }}
                                                    className="mt-2 text-xs font-bold text-primary hover:text-primary/70 transition-all underline underline-offset-4"
                                                >
                                                    Viết đánh giá
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* Side Info */}
                    <div className="space-y-6">

                        {/* Payment Summary */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">Thanh toán</h3>

                            <div className="space-y-3 text-sm mb-4">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tạm tính ({order.items?.length || 0} món)</span>
                                    <span className="font-medium">{(order.pricing?.subTotal || (order.pricing as any)?.subTotal || (order as any).subTotal || 0).toLocaleString('vi-VN')}đ</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Phí giao hàng</span>
                                    <span className="font-medium">{(order.pricing?.shippingFee || (order.pricing as any)?.totalShippingFee || (order as any).shippingFee || (order as any).totalShippingFee || 0).toLocaleString('vi-VN')}đ</span>
                                </div>
                                {((order.pricing as any)?.discountAmount || (order.pricing as any)?.totalDiscount || (order as any).totalDiscount || (order as any).discountAmount || 0) > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Giảm giá</span>
                                        <span className="font-medium text-green-600">- {((order.pricing as any)?.discountAmount || (order.pricing as any)?.totalDiscount || (order as any).totalDiscount || (order as any).discountAmount || 0).toLocaleString('vi-VN')}đ</span>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 border-t border-dashed border-gray-200 flex justify-between items-end">
                                <span className="text-sm font-bold text-gray-700">Tổng cộng</span>
                                <span className="text-2xl font-black text-primary">{((order.pricing as any)?.finalAmount || order.pricing?.totalAmount || (order as any).totalAmount || (order as any).finalAmount || 0).toLocaleString('vi-VN')}đ</span>
                            </div>
                        </div>

                        {/* Delivery Details */}
                        <div className="bg-white p-6 rounded-[2rem] border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-100">Giao hàng</h3>

                            <div className="space-y-5">
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Thời gian phục vụ</p>
                                    <p className="font-bold text-gray-800">
                                        {(order.delivery?.deliveryDate || (order as any).deliveryDate) ? new Date(order.delivery?.deliveryDate || (order as any).deliveryDate).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                        {(order.delivery?.deliveryTime || (order as any).deliveryTime) ? ` lúc ${(order.delivery?.deliveryTime || (order as any).deliveryTime)}` : ''}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Người nhận</p>
                                    <p className="font-medium text-sm text-gray-800">
                                        <span className="font-bold">{order.customer?.fullName || (order.customer as any)?.customerName || (order as any).customerName || 'Chưa cập nhật'}</span>
                                        {(order.customer?.phoneNumber || (order.customer as any)?.customerPhone || (order as any).customerPhone) && <span className="text-gray-500 ml-1">- {(order.customer?.phoneNumber || (order.customer as any)?.customerPhone || (order as any).customerPhone)}</span>}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Địa chỉ giao mâm</p>
                                    <p className="font-medium text-sm text-gray-800 leading-relaxed">{order.delivery?.deliveryAddress || (order as any).deliveryAddress}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* Refund Modal */}
            <RefundModal
                isOpen={isRefundModalOpen}
                onClose={() => setIsRefundModalOpen(false)}
                onSuccess={fetchOrder}
                order={order}
            />

            {/* Review Modal */}
            {selectedItemForReview && (
                <ReviewModal
                    isOpen={isReviewModalOpen}
                    onClose={() => {
                        setIsReviewModalOpen(false);
                        setSelectedItemForReview(null);
                    }}
                    onSuccess={fetchOrder}
                    itemId={selectedItemForReview.itemId}
                    packageName={selectedItemForReview.packageName}
                />
            )}
        </div>
    );
};

export default OrderDetailsPage;
