
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { checkoutService } from '../../services/checkoutService';
import { getProfile, getCurrentUser } from '../../services/auth';

const TrackingPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const orderIdParam = searchParams.get('orderId') || 'MRT-8829-2024';
    const [loading, setLoading] = useState(true);

    const [orderInfo, setOrderInfo] = useState({
        orderId: orderIdParam,
        date: new Date().toLocaleString('vi-VN'),
        status: 'Đang chuẩn bị',
        customerName: 'Khách hàng',
        phone: '',
        address: 'Số 3, Phường Tân Phú, Thành phố Thủ Đức, Thành phố Hồ Chí Minh',
        items: [
            { name: 'Mâm Cúng Đầy Tháng Đặc Biệt', variant: 'Tiêu chuẩn', quantity: 1, price: 850000 },
        ],
        subtotal: 850000,
        shippingFee: 70000,
        total: 920000,
    });

    useEffect(() => {
        const fetchData = async () => {
            if (!orderIdParam || orderIdParam === 'MRT-8829-2024') {
                setLoading(false);
                return;
            }

            try {
                // Fetch User Profile
                let cName = 'Khách hàng';
                let cPhone = 'Chưa cập nhật';

                try {
                    const user = getCurrentUser();
                    if (user?.name) {
                        cName = user.name;
                        if (cName.includes('@') && user.email === cName) {
                            cName = user.email.split('@')[0];
                        }
                    }

                    try {
                        const profile = await getProfile();
                        if (profile?.fullName) {
                            cName = profile.fullName;
                        }
                        if (profile?.phoneNumber) {
                            cPhone = profile.phoneNumber;
                        }
                    } catch (e) {
                        console.warn('Could not fetch profile for tracking', e);
                    }
                } catch (e) {
                    console.warn('Error reading user info', e);
                }

                // Cập nhật state với thông tin cName và cPhone vừa lấy được, phòng khi API transaction thất bại
                setOrderInfo(prev => ({
                    ...prev,
                    customerName: cName,
                    phone: cPhone
                }));

                const transaction = await checkoutService.getTransaction(orderIdParam);
                if (transaction) {
                    if (transaction.orders && transaction.orders.length > 0) {
                        const firstOrder = transaction.orders[0];
                        setOrderInfo({
                            orderId: firstOrder.orderId || transaction.transactionId,
                            date: transaction.paidAt ? new Date(transaction.paidAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
                            status: transaction.paymentStatus === 'Success' ? 'Đã thanh toán / Đang chuẩn bị' : (firstOrder.orderStatus || 'Đang xử lý'),
                            customerName: cName,
                            phone: cPhone,
                            address: firstOrder.deliveryAddress || 'Chưa cập nhật',
                            items: firstOrder.items.map((i: any) => ({
                                name: i.packageName,
                                variant: i.variantName,
                                quantity: i.quantity || 1,
                                price: i.price || i.lineTotal / (i.quantity || 1)
                            })),
                            subtotal: firstOrder.totalAmount - (firstOrder.shippingFee || 0),
                            shippingFee: firstOrder.shippingFee || 0,
                            total: firstOrder.totalAmount,
                        });
                    } else {
                        // Fallback cho trường hợp API chỉ trả về transaction cơ bản, không có danh sách orders
                        setOrderInfo(prev => ({
                            ...prev,
                            orderId: transaction.transactionId || orderIdParam,
                            date: transaction.paidAt ? new Date(transaction.paidAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN'),
                            status: transaction.paymentStatus === 'Success' ? 'Đã thanh toán' : 'Đang xử lý',
                            customerName: cName,
                            phone: cPhone,
                            total: transaction.amount || transaction.totalAmount || prev.total
                        }));
                    }
                }
            } catch (error) {
                console.error("Error fetching order info:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [orderIdParam]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-primary mb-4"></div>
                    <p className="text-slate-500 font-medium">Đang tải thông tin đơn hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-lg">{orderInfo.status}</span>
                        <span className="text-slate-400 font-mono text-sm max-w-[200px] truncate">#{orderInfo.orderId}</span>
                    </div>
                    <h1 className="text-3xl font-black text-primary font-display italic">Theo dõi đơn hàng</h1>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giao hàng dự kiến</p>
                    <p className="text-3xl font-black text-primary">12:45 Hôm nay</p>
                </div>
            </div>

            <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-xl border border-gray-200 mb-12 overflow-hidden relative">
                <div className="relative flex justify-between">
                    <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 rounded-full"></div>
                    <div className="absolute top-5 left-0 w-2/3 h-1 bg-primary rounded-full"></div>

                    {[
                        { label: 'Xác nhận', time: '10:15' },
                        { label: 'Chuẩn bị', time: '11:30' },
                        { label: 'Đang giao', time: 'Đang đi', active: true },
                        { label: 'Hoàn tất', time: 'Dự kiến', disabled: true }
                    ].map((step, i) => (
                        <div key={i} className={`relative z-10 flex flex-col items-center text-center w-24 ${step.disabled ? 'opacity-30' : ''}`}>
                            <div className={`size-12 rounded-full flex items-center justify-center mb-4 ring-8 ring-white font-bold ${step.active ? 'bg-primary text-white animate-pulse' : (step.disabled ? 'bg-slate-200 text-slate-400' : 'bg-primary text-white')}`}>
                                {i + 1}
                            </div>
                            <span className={`text-sm font-bold ${step.active ? 'text-primary' : 'text-slate-900'}`}>{step.label}</span>
                            <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">{step.time}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-lg h-[400px] relative">
                        <div className="absolute inset-0 bg-slate-200 grayscale opacity-40 bg-cover bg-center" style={{ backgroundImage: 'url("https://picsum.photos/1200/800?grayscale")' }} />
                        <div className="absolute top-1/2 left-1/3 size-4 bg-primary rounded-full animate-ping" />
                        <div className="absolute top-1/2 left-1/3 size-4 bg-primary rounded-full ring-4 ring-primary/20" />

                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-6 rounded-3xl shadow-2xl border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-14 rounded-full bg-cover border-2 border-gray-400 shadow-md" style={{ backgroundImage: 'url("https://picsum.photos/200/200?random=50")' }} />
                                <div>
                                    <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tài xế</p>
                                    <p className="text-lg font-black text-primary">Minh Đức</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="size-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg font-bold">📞</button>
                                <button className="size-12 rounded-full bg-white border border-gray-300 text-primary flex items-center justify-center shadow-lg font-bold">💬</button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-sm mt-8">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-6 border-b border-gray-100 pb-4">Thông tin người nhận</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Người nhận</p>
                                <p className="font-bold text-slate-800">{orderInfo.customerName}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Số điện thoại</p>
                                <p className="font-bold text-slate-800">{orderInfo.phone}</p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-xs text-slate-400 mb-1">Địa chỉ giao hàng</p>
                                <p className="font-bold text-slate-800">{orderInfo.address}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-6">
                    {/* Invoice Section */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-200 shadow-xl relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 size-24 bg-primary/5 rounded-full blur-2xl"></div>

                        <div className="mb-6 pb-6 border-b border-dashed border-gray-300">
                            <h3 className="text-xl font-bold text-slate-800 mb-1">Hóa đơn điện tử</h3>
                            <p className="text-xs text-slate-500 truncate" title={orderInfo.orderId}>Mã: #{orderInfo.orderId}</p>
                            <p className="text-xs text-slate-500 mt-1">{orderInfo.date}</p>
                        </div>

                        <div className="space-y-4 mb-6">
                            {orderInfo.items.map((item, index) => (
                                <div key={index} className="flex justify-between items-start gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">{item.name}</p>
                                        <p className="text-[10px] text-slate-400">Gói: {item.variant} • SL: {item.quantity}</p>
                                    </div>
                                    <p className="text-sm font-bold text-slate-800 whitespace-nowrap">{(item.price * item.quantity).toLocaleString()}đ</p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-3 pt-6 border-t border-dashed border-gray-300">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Tạm tính</span>
                                <span className="font-bold text-slate-800">{orderInfo.subtotal.toLocaleString()}đ</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Phí giao hàng</span>
                                <span className="font-bold text-slate-800">{orderInfo.shippingFee.toLocaleString()}đ</span>
                            </div>

                            <div className="flex justify-between items-end pt-4 mt-2 border-t border-gray-100">
                                <div>
                                    <span className="text-xs font-bold uppercase text-slate-400 tracking-widest block">Tổng cộng</span>
                                    <span className="text-[10px] italic text-slate-400">(Đã bao gồm VAT)</span>
                                </div>
                                <span className="text-2xl font-black text-primary">{orderInfo.total.toLocaleString()}đ</span>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <button className="flex-1 bg-primary text-white py-3 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                Tải hóa đơn
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200 text-center">
                        <p className="text-sm font-bold text-primary mb-2">Cần hỗ trợ?</p>
                        <p className="text-xs text-slate-500 mb-6 leading-relaxed">Đội ngũ chuyên gia của chúng tôi luôn sẵn sàng hỗ trợ bạn 24/7 về cấu trúc mâm cúng hoặc thông tin hóa đơn.</p>
                        <button className="w-full bg-white border border-gray-300 py-3 rounded-xl text-primary font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">Liên hệ ngay</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrackingPage;
