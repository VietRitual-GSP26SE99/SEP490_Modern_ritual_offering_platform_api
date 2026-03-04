import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService, Order } from '../../services/orderService';
import toast from '../../services/toast';

const MyOrdersPage: React.FC = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('ALL');
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const fetchOrders = async () => {
        try {
            const data = await orderService.getMyOrders();
            setOrders(data || []);
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
            toast.error('Không thể tải danh sách đơn hàng.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCancelOrder = async (orderId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn hủy đơn hàng này không? Không thể hoàn tác!') === false) {
            return;
        }

        setCancellingId(orderId);
        try {
            const success = await orderService.cancelOrder(orderId);
            if (success) {
                toast.success('Hủy đơn hàng thành công');
                await fetchOrders();
            } else {
                toast.error('Hủy đơn hàng thất bại');
            }
        } catch (error: any) {
            toast.error(error.message || 'Hủy đơn hàng thất bại. Vui lòng thử lại.');
        } finally {
            setCancellingId(null);
        }
    };

    const getStatusStyle = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            case 'PAID': return 'bg-blue-100 text-blue-700';
            case 'PROCESSING': return 'bg-purple-100 text-purple-700';
            case 'DELIVERING': return 'bg-indigo-100 text-indigo-700';
            case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toUpperCase()) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'PROCESSING': return 'Đang chuẩn bị';
            case 'DELIVERING': return 'Đang giao hàng';
            case 'COMPLETED': return 'Đã hoàn thành';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    const filteredOrders = activeTab === 'ALL'
        ? orders
        : orders.filter(o => o.orderStatus.toUpperCase() === activeTab);

    const tabs = [
        { id: 'ALL', label: 'Tất cả' },
        { id: 'PENDING', label: 'Chờ thanh toán' },
        { id: 'PAID', label: 'Đang xử lý' },
        { id: 'DELIVERING', label: 'Đang giao' },
        { id: 'COMPLETED', label: 'Hoàn thành' },
        { id: 'CANCELLED', label: 'Đã hủy' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
                    <p className="text-slate-500 font-medium">Đang tải danh sách đơn hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="max-w-5xl mx-auto px-4 md:px-8">
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-primary font-display italic">Đơn hàng của tôi</h1>
                    <p className="text-slate-500 mt-2">Quản lý và theo dõi trạng thái các mâm cúng bạn đã đặt.</p>
                </div>

                {/* Tabs */}
                <div className="flex overflow-x-auto pb-4 mb-8 hide-scrollbar border-b border-gray-200">
                    <div className="flex space-x-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`whitespace-nowrap px-6 py-3 rounded-t-xl font-bold text-sm transition-all border-b-2 ${activeTab === tab.id
                                    ? 'border-primary text-primary bg-primary/5'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Orders List */}
                <div className="space-y-6">
                    {filteredOrders.length === 0 ? (
                        <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm text-center">
                            <div className="size-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Chưa có đơn hàng nào</h3>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Bạn chưa có đơn hàng nào ở trạng thái này. Hãy khám phá các mâm cúng của chúng tôi nhé!</p>
                            <button
                                onClick={() => navigate('/shop')}
                                className="bg-primary text-white font-bold py-3 px-8 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                            >
                                Khám phá ngay
                            </button>
                        </div>
                    ) : (
                        filteredOrders.map((order) => (
                            <div key={order.orderId} className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 justify-between border-b border-gray-100 bg-gray-50/50">
                                    <div className="flex flex-col md:flex-row gap-4 md:items-center">
                                        <div>
                                            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Mã đơn hàng</span>
                                            <span className="font-mono text-gray-900 font-bold">#{order.orderCode || order.orderId.substring(0, 8).toUpperCase()}</span>
                                        </div>
                                        <div className="hidden md:block w-px h-8 bg-gray-300"></div>
                                        <div>
                                            <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block mb-1">Ngày đặt</span>
                                            <span className="text-gray-900 font-medium">{new Date(order.createdAt).toLocaleDateString('vi-VN')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${getStatusStyle(order.orderStatus)}`}>
                                            {getStatusText(order.orderStatus)}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 md:p-8">
                                    <div className="flex items-center gap-3 mb-6 pb-6 border-b border-dashed border-gray-200">
                                        <div className="size-10 rounded-full bg-orange-100 flex items-center justify-center text-primary">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-gray-900">{order.vendorName || "Tiệm Cúng Bái"}</h4>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {order.items?.map((item, idx) => (
                                            <div key={idx} className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                                <div className="flex gap-4 items-center w-full">
                                                    <div className="size-16 rounded-xl bg-gray-100 border border-gray-200 flex-shrink-0 bg-cover bg-center" style={{ backgroundImage: 'url("https://picsum.photos/100?random=1")' }} />
                                                    <div className="flex-1">
                                                        <h5 className="font-bold text-gray-800 text-sm md:text-base">{item.packageName}</h5>
                                                        <p className="text-xs text-slate-500 mt-1">Gói: {item.variantName}</p>
                                                        <p className="text-sm font-medium mt-1">x{item.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-bold text-primary">{(item.price * item.quantity).toLocaleString('vi-VN')}đ</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 md:p-8 pt-0 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                        <span className="text-sm text-gray-500 mr-2">Tổng tiền:</span>
                                        <span className="text-2xl font-black text-primary">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className="flex gap-3 w-full sm:w-auto">
                                        {order.orderStatus.toUpperCase() === 'PENDING' && (
                                            <button
                                                onClick={() => handleCancelOrder(order.orderId)}
                                                disabled={cancellingId === order.orderId}
                                                className={`flex-1 sm:flex-none border border-red-200 text-red-600 font-bold py-3 px-6 rounded-xl hover:bg-red-50 transition ${cancellingId === order.orderId ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {cancellingId === order.orderId ? 'Đang hủy...' : 'Hủy đơn'}
                                            </button>
                                        )}
                                        {['PAID', 'PROCESSING', 'DELIVERING'].includes(order.orderStatus.toUpperCase()) && (
                                            <button
                                                onClick={() => navigate(`/tracking?orderId=${order.orderId}`)}
                                                className="flex-1 sm:flex-none border border-primary text-primary font-bold py-3 px-6 rounded-xl hover:bg-primary/5 transition"
                                            >
                                                Theo dõi
                                            </button>
                                        )}
                                        <button
                                            onClick={() => navigate(`/profile/orders/${order.orderId}`)}
                                            className="flex-1 sm:flex-none bg-primary text-white font-bold py-3 px-6 rounded-xl hover:bg-primary/90 transition shadow-lg shadow-primary/20"
                                        >
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyOrdersPage;
