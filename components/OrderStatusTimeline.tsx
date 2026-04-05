import React from 'react';

export interface OrderStatusTimelineProps {
  orderId: string;
  currentStatus: string;
  trackingLists?: Array<{
    trackingId: string;
    title: string;
    status: string;
    description: string;
    createdAt: string;
  }>;
}

// Status to stage mapping
const STATUS_TO_STAGE: Record<string, number> = {
  'Paid': 1,
  'Confirmed': 1,
  'Processing': 2,
  'Preparing': 2,
  'Delivering': 3,
  'Shipping': 3,
  'Delivered': 4,
  'Completed': 4,
};

// Stage definitions
const TIMELINE_STAGES = [
  {
    number: 1,
    label: 'Xác nhận',
    description: 'Tiếp nhận và xác nhận đơn',
  },
  {
    number: 2,
    label: 'Chuẩn bị',
    description: 'Chuẩn bị hàng và vật phẩm',
  },
  {
    number: 3,
    label: 'Đang giao',
    description: 'Nhân viên đang giao chuyến',
  },
  {
    number: 4,
    label: 'Hoàn tất',
    description: 'Hoàn thành phục vụ và nghĩa lễ',
  },
];

const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    'Confirmed': 'Đã xác nhận',
    'Processing': 'Đang xử lý',
    'Preparing': 'Đang xử lý',
    'Delivering': 'Đang giao',
    'Shipping': 'Đang giao',
    'Delivered': 'Đã giao',
    'Completed': 'Hoàn thành',
    'Paid': 'Đã thanh toán',
    'Pending': 'Chờ duyệt',
    'Cancelled': 'Đã hủy',
    'Refunded': 'Đã hoàn tiền',
    'PaymentFailed': 'TT thất bại',
  };
  return map[status] || status;
};

const formatDateTimeVi = (value: unknown): string => {
  if (!value) return 'N/A';
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? 'N/A' : d.toLocaleString('vi-VN');
};

const hasMeaningfulText = (v: unknown): boolean => {
  if (typeof v !== 'string') return false;
  const n = v.trim().toLowerCase();
  return n !== '' && n !== 'n/a' && n !== 'na' && n !== 'null' && n !== 'undefined';
};

const OrderStatusTimeline: React.FC<OrderStatusTimelineProps> = ({
  orderId,
  currentStatus,
  trackingLists = [],
}) => {
  const currentStage = STATUS_TO_STAGE[currentStatus] || 1;
  const normalizedStatus = currentStatus || 'Pending';

  // Calculate which stages are completed
  const isStageCompleted = (stageNumber: number) => stageNumber < currentStage;
  const isStageActive = (stageNumber: number) => stageNumber === currentStage;

  return (
    <div className="space-y-6">
      {/* Header with current status */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-[1.5rem] border border-blue-200 p-6 md:p-8">
        <p className="text-xs font-bold uppercase text-blue-500 tracking-widest mb-2">TRANG THÁI HIỆN TẠI</p>
        <h2 className="text-3xl md:text-4xl font-black text-blue-900 mb-6">
          {getStatusLabel(normalizedStatus)}
        </h2>

        {/* Order ID */}
        <div>
          <p className="text-xs font-bold uppercase text-blue-400 tracking-widest mb-1">THEO DÕI ĐƠN HÀNG</p>
          <p className="text-sm font-mono font-bold text-blue-700 break-all">{orderId}</p>
        </div>
      </div>

      {/* Timeline visualization */}
      <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 md:p-8">
        {/* Progress steps */}
        <div className="flex items-start justify-between gap-2 md:gap-4 mb-8 relative">
          {/* Background connector lines */}
          <div className="absolute top-6 left-0 right-0 h-1 bg-gray-200" 
               style={{ 
                 width: `${((currentStage - 1) / (TIMELINE_STAGES.length - 1)) * 100}%`,
                 backgroundColor: '#3B82F6',
                 transition: 'width 0.3s ease',
                 zIndex: 0
               }}>
          </div>

          {TIMELINE_STAGES.map((stage) => (
            <div key={stage.number} className="flex flex-col items-center flex-1 relative z-10">
              {/* Circle */}
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg mb-3 transition-all border-4 ${
                  isStageCompleted(stage.number)
                    ? 'bg-blue-500 text-white border-white shadow-lg shadow-blue-500/30'
                    : isStageActive(stage.number)
                    ? 'bg-blue-500 text-white border-white shadow-lg shadow-blue-500/50 scale-110'
                    : 'bg-gray-100 text-gray-400 border-gray-100'
                }`}
              >
                {stage.number}
              </div>

              {/* Label and Description */}
              <div className="text-center">
                <p
                  className={`text-sm font-bold mb-1 ${
                    isStageCompleted(stage.number) || isStageActive(stage.number)
                      ? 'text-gray-900'
                      : 'text-gray-400'
                  }`}
                >
                  {stage.label}
                </p>

                <p
                  className={`text-xs leading-relaxed ${
                    isStageCompleted(stage.number) || isStageActive(stage.number)
                      ? 'text-gray-600'
                      : 'text-gray-300'
                  }`}
                  style={{ maxWidth: '110px' }}
                >
                  {stage.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking history */}
      {trackingLists && trackingLists.length > 0 && (
        <div className="bg-white rounded-[1.5rem] border border-gray-200 p-6 md:p-8">
          <h3 className="text-lg font-bold uppercase tracking-widest text-gray-700 mb-6 pb-4 border-b border-gray-100">
            Lịch sử cập nhật
          </h3>

          <div className="space-y-4">
            {trackingLists.map((tracking) => (
              <div
                key={tracking.trackingId}
                className="relative pl-6 pb-4 border-l-2 border-blue-200 last:pb-0"
              >
                {/* Timeline dot */}
                <div className="absolute -left-3.5 top-1 w-5 h-5 bg-blue-500 rounded-full border-4 border-white" />

                {/* Content */}
                <div>
                  <p className="font-bold text-gray-900 text-sm">
                    {tracking.title || 'Cập nhật đơn hàng'}
                  </p>
                  {hasMeaningfulText(tracking.description) && (
                    <p className="text-xs text-gray-600 mt-1">
                      {tracking.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 font-medium mt-2">
                    {formatDateTimeVi(tracking.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStatusTimeline;
