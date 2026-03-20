import React, { useEffect, useState } from 'react';
import toast from '../../services/toast';
import { packageService } from '../../services/packageService';

interface StaffProductManagementProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

interface StaffProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  image: string;
  rating: number;
  orders: number;
  status: 'active' | 'inactive' | 'draft';
  created: string;
  vendorName?: string;
}

type PackageStatusFilter = '' | 'Draft' | 'Pending' | 'Approved' | 'Rejected';

const StaffProductManagement: React.FC<StaffProductManagementProps> = ({ onNavigate }) => {
  const PRODUCTS_PER_PAGE = 10;

  const [products, setProducts] = useState<StaffProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<PackageStatusFilter>('');

  const fallbackProductImage = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="88" height="88" viewBox="0 0 88 88">
      <rect width="88" height="88" rx="14" fill="#F1F5F9"/>
      <rect x="18" y="18" width="52" height="52" rx="10" fill="#E2E8F0"/>
      <text x="44" y="52" text-anchor="middle" font-size="20" font-family="Arial, sans-serif" fill="#64748B">SP</text>
    </svg>`
  )}`;

  const toImageSrc = (value: string): string => {
    const normalized = String(value || '').trim();
    if (!normalized) return fallbackProductImage;
    if (/^https?:\/\//i.test(normalized)) return normalized;
    return fallbackProductImage;
  };

  const categoryLabelMap: Record<number, string> = {
    1: 'Đầy Tháng',
    2: 'Tân Gia',
    3: 'Khai Trương',
    4: 'Tổ Tiên',
    5: 'Khác',
  };

  const mapCategory = (categoryId: number): string => categoryLabelMap[categoryId] || 'Khác';

  const loadPackages = async () => {
    setLoadingProducts(true);
    setProductsError(null);
    setCurrentPage(1);

    try {
      const packages = await packageService.getPackagesByStatus(selectedStatus);

      const mapped: StaffProduct[] = packages.map((item) => {
        const variants = Array.isArray((item as any).packageVariants) ? (item as any).packageVariants : [];
        const activeVariants = variants.filter((variant: any) => Boolean(variant?.isActive));
        const selectedVariant = activeVariants[0] || variants[0];
        const price = Number(selectedVariant?.price || 0);

        return {
          id: String((item as any).packageId ?? (item as any).id ?? ''),
          name: String((item as any).packageName || (item as any).name || 'Sản phẩm'),
          category: mapCategory(Number((item as any).categoryId || 0)),
          price: Number.isFinite(price) ? price : 0,
          stock: activeVariants.length,
          image: String((item as any).imageUrl || ''),
          rating: 0,
          orders: 0,
          status: Boolean((item as any).isActive) ? 'active' : 'inactive',
          created: String((item as any).createdAt || ''),
          vendorName: String((item as any).vendorProfileId || (item as any).vendorId || ''),
        };
      });

      setProducts(mapped);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải danh sách sản phẩm.';
      setProductsError(message);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, [selectedStatus]);

  const totalPages = Math.max(1, Math.ceil(products.length / PRODUCTS_PER_PAGE));
  const categoryOptions = Array.from(new Set(products.map((product) => product.category))).sort((a, b) => a.localeCompare(b));

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((product) => product.category === selectedCategory);

  const filteredTotalPages = Math.max(1, Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, filteredTotalPages);
  const paginatedProducts = filteredProducts.slice(
    (safeCurrentPage - 1) * PRODUCTS_PER_PAGE,
    safeCurrentPage * PRODUCTS_PER_PAGE,
  );

  useEffect(() => {
    if (currentPage > filteredTotalPages) {
      setCurrentPage(filteredTotalPages);
    }
  }, [currentPage, filteredTotalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedStatus]);

  const handleApprove = (id: string) => {
    toast.success('Đã duyệt sản phẩm thành công!');
  };

  const handleReject = (id: string) => {
    toast.error('Đã từ chối sản phẩm.');
  };

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">Quản Lý Sản Phẩm</h1>
            <p className="text-gray-600">Kiểm duyệt và quản lý các mâm cúng trên nền tảng</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 border border-gray-200 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="status" className="font-semibold text-gray-700 text-sm">Trạng thái:</label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as PackageStatusFilter)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="">Tất cả</option>
                <option value="Pending">Chờ duyệt</option>
                <option value="Approved">Đã duyệt</option>
                <option value="Rejected">Bị từ chối</option>
                <option value="Draft">Bản nháp</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="category" className="font-semibold text-gray-700 text-sm">Danh mục:</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              >
                <option value="all">Tất cả</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
          {loadingProducts ? (
            <div className="p-8 text-center text-gray-500">Đang tải danh sách sản phẩm...</div>
          ) : productsError ? (
            <div className="p-8 text-center text-red-500">{productsError}</div>
          ) : paginatedProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Không tìm thấy sản phẩm nào.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-700">
                    <th className="p-4 font-semibold text-sm">Sản Phẩm</th>
                    <th className="p-4 font-semibold text-sm">Danh Mục</th>
                    <th className="p-4 font-semibold text-sm text-right">Giá (VNĐ)</th>
                    <th className="p-4 font-semibold text-sm text-center">Trạng Thái</th>
                    <th className="p-4 font-semibold text-sm text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={toImageSrc(product.image)}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover bg-gray-100 border border-gray-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = fallbackProductImage;
                            }}
                          />
                          <div>
                            <p className="font-bold text-gray-900 text-sm line-clamp-1">{product.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">Mã: {product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium">
                          {product.category}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        {product.price.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(product.id)}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(product.id)}
                            className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Từ chối
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          {!loadingProducts && !productsError && filteredTotalPages > 1 && (
            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                Hiển thị trang {safeCurrentPage} / {filteredTotalPages} ({filteredProducts.length} sản phẩm)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Trước
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(filteredTotalPages, prev + 1))}
                  disabled={safeCurrentPage === filteredTotalPages}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffProductManagement;
