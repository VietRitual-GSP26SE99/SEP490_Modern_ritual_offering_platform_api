import React, { useState, useEffect, useCallback } from 'react';
import { reviewService, Review } from '../../services/reviewService';
import toast from '../../services/toast';

const VendorReviewTab: React.FC = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const fetchReviews = useCallback(async () => {
        try {
            setLoading(true);
            const data = await reviewService.getVendorReviews();
            setReviews(data);
        } catch (error) {
            console.error('Failed to fetch reviews:', error);
            toast.error('Không thể tải đánh giá.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim()) {
            toast.error('Vui lòng nhập nội dung phản hồi.');
            return;
        }

        try {
            setSubmitting(true);
            const success = await reviewService.updateVendorReply(reviewId, replyText);
            if (success) {
                toast.success('Phản hồi thành công!');
                setReplyingTo(null);
                setReplyText('');
                fetchReviews();
            }
        } catch (error: any) {
            toast.error(error.message || 'Phản hồi thất bại.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <div className="w-10 h-10 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
                <p className="text-slate-500 font-medium">Đang tải đánh giá...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">Đánh giá từ khách hàng</h3>
                <span className="text-sm font-medium text-slate-500">{reviews.length} đánh giá</span>
            </div>

            {reviews.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border border-gray-200 shadow-sm">
                    <div className="text-6xl mb-4">⭐</div>
                    <p className="text-slate-500 font-medium">Bạn chưa có đánh giá nào.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {reviews.map((review) => (
                        <div key={review.reviewId} className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all">
                            <div className="p-6 md:p-8">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-bold shadow-inner flex-shrink-0">
                                        {review.customerAvatar ? (
                                            <img src={review.customerAvatar} alt={review.customerName} className="w-full h-full object-cover" />
                                        ) : (
                                            review.customerName?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <div>
                                                <h4 className="font-bold text-slate-900">{review.customerName}</h4>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex">
                                                        {[1, 2, 3, 4, 5].map((star) => (
                                                            <span key={star} className="text-sm" style={{ color: star <= review.rating ? '#FFD700' : '#cbd5e1' }}>★</span>
                                                        ))}
                                                    </div>
                                                    <span className="text-xs text-slate-400">• {new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-bold text-slate-400 block mb-1 uppercase tracking-widest">Sản phẩm</span>
                                                <span className="text-xs font-bold text-primary italic">({review.variantName})</span>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 mb-4 leading-relaxed">{review.comment}</p>

                                        {/* Review Images */}
                                        {review.reviewImageUrls && review.reviewImageUrls.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {review.reviewImageUrls.map((url, i) => (
                                                    <div key={i} className="size-20 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                                        <img src={url} alt={`review-${i}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Vendor Reply Display */}
                                        {review.vendorReply ? (
                                            <div className="mt-4 p-5 bg-primary/5 rounded-2xl border-l-4 border-primary relative">
                                                <p className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Phản hồi của bạn</p>
                                                <p className="text-sm text-slate-700 italic">"{review.vendorReply}"</p>
                                                <button 
                                                    onClick={() => {
                                                        setReplyingTo(review.reviewId);
                                                        setReplyText(review.vendorReply || '');
                                                    }}
                                                    className="absolute top-4 right-4 text-xs font-bold text-primary hover:underline"
                                                >
                                                    Chỉnh sửa
                                                </button>
                                            </div>
                                        ) : (
                                            replyingTo !== review.reviewId && (
                                                <button 
                                                    onClick={() => setReplyingTo(review.reviewId)}
                                                    className="mt-2 text-sm font-bold text-primary hover:bg-primary/5 px-4 py-2 rounded-lg border-2 border-primary transition-all uppercase tracking-widest"
                                                >
                                                    Phản hồi ngay
                                                </button>
                                            )
                                        )}

                                        {/* Reply Form */}
                                        {replyingTo === review.reviewId && (
                                            <div className="mt-4 space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Viết phản hồi</p>
                                                <textarea 
                                                    value={replyText}
                                                    onChange={(e) => setReplyText(e.target.value)}
                                                    placeholder="Cảm ơn khách hàng hoặc giải quyết vấn đề của họ..."
                                                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-h-[100px]"
                                                />
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleReply(review.reviewId)}
                                                        disabled={submitting}
                                                        className="px-6 py-2.5 bg-primary text-white font-bold rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 uppercase tracking-widest text-sm"
                                                    >
                                                        {submitting ? 'Đang gửi...' : 'Gửi phản hồi'}
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setReplyingTo(null);
                                                            setReplyText('');
                                                        }}
                                                        disabled={submitting}
                                                        className="px-6 py-2.5 border-2 border-slate-300 text-slate-500 font-bold rounded-lg hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                                                    >
                                                        Hủy
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default VendorReviewTab;
