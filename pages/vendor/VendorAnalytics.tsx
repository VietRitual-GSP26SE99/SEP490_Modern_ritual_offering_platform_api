import React, { useState } from 'react';

interface VendorAnalyticsProps {
  onNavigate: (path: string) => void;
}

const VendorAnalytics: React.FC<VendorAnalyticsProps> = ({ onNavigate }) => {
  const [timeRange, setTimeRange] = useState('month');

  const stats = {
    revenue: 15200000,
    orders: 284,
    avgOrderValue: 5350000,
    customerSatisfaction: 4.8,
    topProduct: 'Mâm Cúng Đầy Tháng 5 Món',
    topCategory: 'Đầy Tháng',
  };

  const monthlyData = [
    { month: 'Tháng 1', revenue: 8500000, orders: 42 },
    { month: 'Tháng 2', revenue: 12300000, orders: 58 },
    { month: 'Tháng 3', revenue: 15200000, orders: 71 },
    { month: 'Tháng 4', revenue: 11800000, orders: 55 },
    { month: 'Tháng 5', revenue: 14900000, orders: 68 },
    { month: 'Tháng 6', revenue: 18700000, orders: 85 },
  ];

  const categoryBreakdown = [
    { category: 'Đầy Tháng', percentage: 45, revenue: 6840000, orders: 128 },
    { category: 'Tân Gia', percentage: 30, revenue: 4560000, orders: 85 },
    { category: 'Khai Trương', percentage: 15, revenue: 2280000, orders: 43 },
    { category: 'Tổ Tiên', percentage: 10, revenue: 1520000, orders: 28 },
  ];

  const customerSegments = [
    { segment: 'VIP (Mua 5+)', percentage: 15, count: 126, avgSpend: 8500000 },
    { segment: 'Regular (Mua 2-4)', percentage: 35, count: 294, avgSpend: 5200000 },
    { segment: 'First-time', percentage: 50, count: 420, avgSpend: 2100000 },
  ];

  const topProducts = [
    { name: 'Mâm Cúng Đầy Tháng 5 Món', sales: 156, revenue: 187200000, rating: 4.8 },
    { name: 'Mâm Cúng Tân Gia 8 Món', sales: 89, revenue: 160200000, rating: 4.6 },
    { name: 'Mâm Cúng Khai Trương Premium', sales: 34, revenue: 85000000, rating: 5.0 },
    { name: 'Combo Tổ Tiên 10 Món', sales: 28, revenue: 56000000, rating: 4.7 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-playfair font-bold text-primary mb-2">Thống Kê & Báo Cáo</h1>
          <p className="text-gray-600">Phân tích dữ liệu kinh doanh và hiệu suất bán hàng</p>
        </div>

        {/* Time Range Filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          {['week', 'month', 'quarter', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg font-bold transition-all border-2 ${
                timeRange === range
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'bg-white text-gray-700 border-slate-300 hover:border-primary'
              }`}
            >
              {range === 'week' ? 'Tuần' : range === 'month' ? 'Tháng' : range === 'quarter' ? 'Quý' : 'Năm'}
            </button>
          ))}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-primary">
            <p className="text-gray-600 text-xs font-bold mb-2">DOANH THU</p>
            <p className="text-2xl font-black text-primary">{(stats.revenue / 1000000).toFixed(1)}M ₫</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-xs font-bold mb-2">TỔNG ĐƠN</p>
            <p className="text-2xl font-black text-blue-600">{stats.orders}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-xs font-bold mb-2">TB/ĐƠN</p>
            <p className="text-2xl font-black text-green-600">{(stats.avgOrderValue / 1000000).toFixed(1)}M ₫</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-xs font-bold mb-2">ĐÁ GIÁNH</p>
            <p className="text-2xl font-black text-yellow-600">{stats.customerSatisfaction} ⭐</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-xs font-bold mb-2">TOP SP</p>
            <p className="text-sm font-bold text-purple-600 line-clamp-2">{stats.topProduct}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-xs font-bold mb-2">TOP DANH MỤC</p>
            <p className="text-2xl font-black text-orange-600">{stats.topCategory}</p>
          </div>
        </div>

        {/* Revenue Trend */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border-2 border-gold/20">
          <h2 className="text-xl font-bold text-primary mb-6">Doanh Thu Theo Tháng</h2>
          <div className="space-y-4">
            {monthlyData.map((data) => (
              <div key={data.month} className="flex items-center gap-4">
                <div className="w-24 font-semibold text-gray-700">{data.month}</div>
                <div className="flex-1">
                  <div className="bg-gradient-to-r from-primary to-gold rounded-lg h-8 flex items-center justify-end pr-4 text-white font-bold text-sm">
                    {(data.revenue / 1000000).toFixed(1)}M ₫
                  </div>
                </div>
                <div className="w-16 text-right font-semibold text-gray-700">{data.orders} đơn</div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Breakdown & Customer Segments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
            <h2 className="text-xl font-bold text-primary mb-6">Phân Tích Danh Mục</h2>
            <div className="space-y-4">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-700">{cat.category}</span>
                    <span className="text-sm font-bold text-primary">{cat.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-gold h-full rounded-full"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-gray-600">
                    <span>{cat.revenue.toLocaleString('vi-VN')} ₫</span>
                    <span>{cat.orders} đơn</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customer Segments */}
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
            <h2 className="text-xl font-bold text-primary mb-6">Phân Khúc Khách Hàng</h2>
            <div className="space-y-4">
              {customerSegments.map((seg) => (
                <div key={seg.segment} className="p-4 bg-gradient-to-r from-primary/5 to-gold/5 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-gray-800">{seg.segment}</p>
                      <p className="text-xs text-gray-600">{seg.count} khách hàng</p>
                    </div>
                    <span className="text-lg font-black text-primary">{seg.percentage}%</span>
                  </div>
                  <p className="text-sm text-gray-700">TB/khách: {(seg.avgSpend / 1000000).toFixed(1)}M ₫</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
          <h2 className="text-xl font-bold text-primary mb-6">Sản Phẩm Bán Chạy</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary/10 to-gold/10 border-b-2 border-gold/20">
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Sản Phẩm</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Số Lượng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Doanh Thu</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Đánh Giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {topProducts.map((product, idx) => (
                  <tr key={idx} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">{product.name}</p>
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-600">{product.sales}</td>
                    <td className="px-6 py-4 font-bold text-primary">{(product.revenue / 1000000).toFixed(1)}M ₫</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-500 text-sm">star</span>
                        <span className="font-bold text-gray-800">{product.rating}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Growth Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm font-bold mb-2">TĂNG TRƯỞNG DOANH THU</p>
            <p className="text-3xl font-black text-green-600">+24.5%</p>
            <p className="text-xs text-gray-600 mt-2">So với tháng trước</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-bold mb-2">TĂNG TRƯỞNG ĐƠN</p>
            <p className="text-3xl font-black text-blue-600">+18.3%</p>
            <p className="text-xs text-gray-600 mt-2">So với tháng trước</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm font-bold mb-2">KHÁCH HÀ MỚI</p>
            <p className="text-3xl font-black text-purple-600">+156</p>
            <p className="text-xs text-gray-600 mt-2">Tháng này</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorAnalytics;
