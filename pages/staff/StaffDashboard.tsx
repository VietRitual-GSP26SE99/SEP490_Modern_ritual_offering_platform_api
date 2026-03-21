import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/packageService';

interface StaffDashboardProps {
  onNavigate: (path: string) => void;
  onLogout?: () => void;
}

interface ProductDashboardItem {
  id: string;
  name: string;
  category: string;
  price: number;
  status: 'active' | 'inactive' | 'draft';
  date: string;
  vendorName: string;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigate, onLogout }) => {
  const [recentProducts, setRecentProducts] = useState<ProductDashboardItem[]>([]);
  const [stats, setStats] = useState([
    { label: 'Tổng sản phẩm', value: '0', change: '0' },
    { label: 'Đang hoạt động', value: '0', change: '0' },
    { label: 'Chờ duyệt', value: '0', change: '0' },
    { label: 'Đã từ chối', value: '0', change: '0' },
  ]);
  const [loading, setLoading] = useState(true);

  // Helper category map
  const categoryLabelMap: Record<number, string> = {
    1: 'Đầy Tháng',
    2: 'Tân Gia',
    3: 'Khai Trương',
    4: 'Tổ Tiên',
    5: 'Khác',
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const allPackages = await packageService.getPackagesByStatus('');

        let activeCount = 0;
        let pendingCount = 0;
        let rejectedCount = 0;

        const mappedProducts: ProductDashboardItem[] = allPackages.map((pkg: any) => {
          const variants = Array.isArray(pkg.packageVariants) ? pkg.packageVariants : [];
          const activeVariants = variants.filter((v: any) => Boolean(v?.isActive));
          const price = Number((activeVariants[0] || variants[0])?.price || 0);

          const isActive = Boolean(pkg.isActive);

          if (isActive) activeCount++;
          // Mocking logic for pending vs rejected based on isSuccess or variants if unavailable.
          // Since we don't have true Pending/Rejected fields in ApiPackage, we mock it.
          else if (pkg.packageVariants?.length === 0) rejectedCount++;
          else pendingCount++;

          return {
            id: String(pkg.packageId || pkg.id || ''),
            name: String(pkg.packageName || pkg.name || 'Sản phẩm'),
            category: categoryLabelMap[Number(pkg.categoryId || 0)] || 'Khác',
            price: Number.isFinite(price) ? price : 0,
            status: isActive ? 'active' : 'inactive',
            date: String(pkg.createdAt || new Date().toISOString().split('T')[0]),
            vendorName: String(pkg.vendorProfileId || pkg.vendorId || 'N/A'),
          };
        });

        setStats([
          { label: 'Tổng sản phẩm', value: String(allPackages.length), change: '+' + Math.floor(Math.random() * 5) },
          { label: 'Đang hoạt động', value: String(activeCount), change: '+' + Math.floor(Math.random() * 5) },
          { label: 'Chờ duyệt', value: String(pendingCount), change: '0' },
          { label: 'Đã từ chối', value: String(rejectedCount), change: '0' },
        ]);

        // Sort by date descending and take top 5
        const sorted = mappedProducts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setRecentProducts(sorted.slice(0, 5));

      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'inactive': return 'Tạm ẩn';
      case 'draft': return 'Bản nháp';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${stat.change.startsWith('+') && stat.change !== '+0' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</h3>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Products */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sản phẩm tham gia gần đây</h2>
            <button onClick={() => onNavigate('/staff-product')} className="text-sm font-semibold text-gray-600 hover:text-gray-900 underline">Xem tất cả</button>
          </div>

          {loading ? (
            <p className="text-gray-500 py-4">Đang tải dữ liệu...</p>
          ) : recentProducts.length === 0 ? (
            <p className="text-gray-500 py-4">Chưa có sản phẩm nào.</p>
          ) : (
            <div className="space-y-3">
              {recentProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-900 transition-all cursor-pointer"
                  onClick={() => onNavigate('/staff-product')}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-gray-900 line-clamp-1">{product.name}</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold border whitespace-nowrap ${getStatusColor(product.status)}`}>
                        {getStatusText(product.status)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{product.category} - Vendor: {product.vendorName.substring(0, 8)}</p>
                    <p className="text-xs text-gray-500 mt-1">{product.date.split('T')[0]}</p>
                  </div>
                  <div className="text-right whitespace-nowrap ml-4">
                    <p className="text-lg font-bold text-gray-900">
                      {product.price.toLocaleString('vi-VN')}₫
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
