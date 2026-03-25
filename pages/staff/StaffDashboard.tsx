import React, { useState, useEffect } from 'react';
import { packageService } from '../../services/packageService';
import { staffService, VendorVerification } from '../../services/staffService';

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

const formatDateVi = (value: string | null): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const StaffDashboard: React.FC<StaffDashboardProps> = ({ onNavigate, onLogout }) => {
  const [recentProducts, setRecentProducts] = useState<ProductDashboardItem[]>([]);
  const [stats, setStats] = useState([
    { label: 'Tổng sản phẩm', value: '0', change: '0' },
    { label: 'Đang hoạt động', value: '0', change: '0' },
    { label: 'Chờ duyệt', value: '0', change: '0' },
    { label: 'Đã từ chối', value: '0', change: '0' },
  ]);
  const [pendingVendors, setPendingVendors] = useState<VendorVerification[]>([]);
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

        // Fetch pending vendors
        try {
          const pendingData = await staffService.getVendorVerifications('2'); // 2 = Pending
          setPendingVendors(pendingData.slice(0, 5));

          setStats(prev => [
            ...prev,
            { label: 'Vendor chờ duyệt', value: String(pendingData.length), change: 'new' }
          ]);
        } catch (error) {
          console.error('Failed to fetch pending vendors', error);
        }

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
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Quick Access */}
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 text-3xl">
                💸
              </div> */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Giao dịch</h2>
                <p className="text-sm text-gray-500 font-medium">Theo dõi dòng tiền hệ thống.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/staff-transactions')}
              className="w-full md:w-auto px-6 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
            >
              Quản lý
            </button>
          </div>

          {/* Audit Log Quick Access */}
          <div className="bg-white rounded-2xl p-8 border-2 border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              {/* <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 text-3xl">
                📜
              </div> */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">Nhật ký</h2>
                <p className="text-sm text-gray-500 font-medium">Theo dõi hoạt động hệ thống.</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/staff-audit-logs')}
              className="w-full md:w-auto px-6 py-2.5 bg-black text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg"
            >
              Xem log
            </button>
          </div>
        </div>

        {/* Pending Vendors Section */}
        <div className="bg-white rounded-2xl p-6 border-2 border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Hồ sơ Vendor chờ duyệt</h2>
            <button onClick={() => onNavigate('/staff-vendors')} className="text-sm font-semibold text-gray-600 hover:text-gray-900 underline">Quản lý duyệt</button>
          </div>

          {loading ? (
            <p className="text-gray-500 py-4">Đang tải dữ liệu...</p>
          ) : pendingVendors.length === 0 ? (
            <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <p className="text-gray-500 font-medium">Không có hồ sơ nào chờ duyệt.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingVendors.map((vendor) => (
                <div
                  key={vendor.profileId}
                  onClick={() => onNavigate('/staff-vendors')}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:border-slate-900 transition-all cursor-pointer group"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-white shadow-sm flex-shrink-0">
                    {vendor.shopAvatarUrl ? (
                      <img src={vendor.shopAvatarUrl} alt={vendor.shopName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{vendor.shopName}</h3>
                    <p className="text-xs text-gray-500 truncate">{vendor.fullName}</p>
                    <p className="text-[10px] text-gray-400 mt-1">{formatDateVi(vendor.createdAt)} (Chờ duyệt)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
