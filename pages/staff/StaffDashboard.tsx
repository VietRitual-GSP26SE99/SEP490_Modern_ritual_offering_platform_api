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
    <div className="min-h-screen bg-ritual-bg/20 py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Sidebar Navigation */}
          <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-[120px] z-30">
            <div className="bg-white rounded-[2.5rem] p-4 border border-gold/10 shadow-xl backdrop-blur-sm bg-white/90">
              <div className="px-6 py-8 mb-4 border-b border-gold/5 text-center lg:text-left">
                <h1 className="text-2xl font-display font-black text-primary tracking-tight">Bảng điều khiển nhân viên</h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Hệ thống nhân viên</p>
              </div>
              <div className="flex flex-col gap-1">
                {[
                  { id: 'overview', label: 'Tổng quan', icon: 'dashboard', path: '/staff-dashboard' },
                  { id: 'vendors', label: 'Duyệt Vendor', icon: 'verified_user', path: '/staff-vendors' },
                  { id: 'products', label: 'Quản lý Sản phẩm', icon: 'inventory_2', path: '/staff-product' },
                  { id: 'transactions', label: 'Giao dịch', icon: 'account_balance_wallet', path: '/staff-transactions' },
                  { id: 'audit', label: 'Nhật ký hệ thống', icon: 'history_edu', path: '/staff-audit-logs' },
                  { id: 'settings', label: 'Cài đặt hệ thống', icon: 'settings_suggest', path: '/staff-settings' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.path)}
                    className={`flex items-center w-full px-6 py-4 rounded-3xl font-bold text-sm uppercase transition-all tracking-wider ${item.id === 'overview'
                      ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                      : 'text-slate-500 hover:bg-ritual-bg hover:text-primary'
                      }`}
                  >
                    <span className="material-symbols-outlined mr-4 text-xl">{item.icon}</span>
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="mt-8 p-6 bg-ritual-bg/50 rounded-[2rem] border border-gold/5">
                <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-2">Thông tin nhân viên</p>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Đảm bảo quy trình phê duyệt đúng quy định của nền tảng.</p>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 w-full space-y-12">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 border border-gold/10 shadow-sm hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${stat.change.startsWith('+') && stat.change !== '+0' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {stat.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black text-primary mb-1">{stat.value}</h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 gap-12">
              {/* Pending Vendors Section */}
              <div className="bg-white rounded-[2rem] p-8 border border-gold/10 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined">verified_user</span>
                    Hồ sơ Vendor chờ duyệt
                  </h2>
                  <button onClick={() => onNavigate('/staff-vendors')} className="text-xs font-bold text-gold uppercase tracking-widest hover:text-primary underline transition-all">Tất cả hồ sơ</button>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-500">Đang tải dữ liệu...</div>
                ) : pendingVendors.length === 0 ? (
                  <div className="py-12 text-center bg-ritual-bg/30 rounded-3xl border border-dashed border-gold/20">
                    <p className="text-slate-500 font-medium">Không có hồ sơ nào chờ duyệt.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingVendors.map((vendor) => (
                      <div
                        key={vendor.profileId}
                        onClick={() => onNavigate('/staff-vendors')}
                        className="flex items-center gap-4 p-5 bg-ritual-bg/30 rounded-2xl border border-gold/10 hover:border-primary transition-all cursor-pointer group"
                      >
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-white shadow-sm flex-shrink-0 border border-gold/5">
                          {vendor.shopAvatarUrl ? (
                            <img src={vendor.shopAvatarUrl} alt={vendor.shopName} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl font-serif text-gold">V</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-primary truncate group-hover:text-gold transition-colors">{vendor.shopName}</h3>
                          <p className="text-xs text-slate-500 truncate">{vendor.fullName}</p>
                          <p className="text-[9px] font-bold text-gold/60 uppercase tracking-widest mt-2">{formatDateVi(vendor.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Recent Products */}
              <div className="bg-white rounded-[2rem] p-8 border border-gold/10 shadow-sm">
                <div className="flex justify-between items-center mb-10">
                  <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined">inventory_2</span>
                    Sản phẩm mới đăng tải
                  </h2>
                  <button onClick={() => onNavigate('/staff-product')} className="text-xs font-bold text-gold uppercase tracking-widest hover:text-primary underline transition-all">Xem tất cả</button>
                </div>

                {loading ? (
                  <div className="py-12 text-center text-slate-500">Đang tải dữ liệu...</div>
                ) : recentProducts.length === 0 ? (
                  <div className="py-12 text-center bg-ritual-bg/30 rounded-3xl border border-dashed border-gold/20">
                    <p className="text-slate-500 font-medium">Chưa có sản phẩm nào.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-6 bg-ritual-bg/30 rounded-2xl border border-gold/10 hover:border-primary transition-all cursor-pointer group"
                        onClick={() => onNavigate('/staff-product')}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-bold text-primary group-hover:text-gold transition-colors text-lg">{product.name}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border ${getStatusColor(product.status)}`}>
                              {getStatusText(product.status)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="font-bold text-slate-700">{product.category}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>Vendor: {product.vendorName.substring(0, 8)}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>{product.date.split('T')[0]}</span>
                          </div>
                        </div>
                        <div className="text-right whitespace-nowrap ml-6">
                          <p className="text-xl font-black text-primary">
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
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
