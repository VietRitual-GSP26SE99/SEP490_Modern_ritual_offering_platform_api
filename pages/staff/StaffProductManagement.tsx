import React, { useEffect, useState } from 'react';
import toast from '../../services/toast';
import { packageService } from '../../services/packageService';
import { CeremonyCategory } from '../../types';

interface StaffProductManagementProps {
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

interface StaffProduct {
  id: string;
  name: string;
  categoryId: number;
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
  const [viewProductDetails, setViewProductDetails] = useState<any | null>(null);
  const [viewDisplayImageIndex, setViewDisplayImageIndex] = useState<number>(0);
  const [rawPackages, setRawPackages] = useState<any[]>([]);
  const [categories, setCategories] = useState<CeremonyCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await packageService.getCeremonyCategories();
        setCategories(data.filter(c => c.isActive));
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

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

  const mapCategory = (categoryId: number): string => {
    const found = categories.find(c => c.categoryId === categoryId);
    if (found) return found.name;
    return categoryLabelMap[categoryId] || 'Khác';
  };

  const loadPackages = async () => {
    setLoadingProducts(true);
    setProductsError(null);
    setCurrentPage(1);

    try {
      const packages = await packageService.getPackagesByStatus(selectedStatus);
      setRawPackages(packages);

      const mapped: StaffProduct[] = packages.map((item) => {
        const variants = Array.isArray((item as any).packageVariants) ? (item as any).packageVariants : [];
        const activeVariants = variants.filter((variant: any) => Boolean(variant?.isActive));
        const selectedVariant = activeVariants[0] || variants[0];
        const price = Number(selectedVariant?.price || 0);

        return {
          id: String((item as any).packageId ?? (item as any).id ?? ''),
          name: String((item as any).packageName || (item as any).name || 'Sản phẩm'),
          categoryId: Number((item as any).categoryId || 0),
          category: mapCategory(Number((item as any).categoryId || 0)),
          price: Number.isFinite(price) ? price : 0,
          stock: activeVariants.length,
          image: Array.isArray((item as any).imageUrls) && (item as any).imageUrls.length > 0
            ? ((item as any).imageUrls[(item as any).primaryImageIndex || 0] || (item as any).imageUrls[0])
            : String((item as any).imageUrl || ''),
          rating: Number((item as any).ratingAvg || 0),
          orders: Number((item as any).totalSold || 0),
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
  const categoryOptions = Array.from(new Set(products.map((product) => mapCategory(product.categoryId)))).sort((a, b) => a.localeCompare(b));

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter((product) => mapCategory(product.categoryId) === selectedCategory);

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

  const handleApprove = async (id: string) => {
    try {
      const confirmResult = await toast.confirm({
        title: 'Xác nhận phê duyệt',
        text: 'Bạn có chắc chắn muốn duyệt mâm cúng này?',
        icon: 'question',
        confirmButtonText: 'Phê duyệt',
        cancelButtonText: 'Hủy',
      });
      if (!confirmResult.isConfirmed) return;

      const success = await packageService.approvePackage(id);
      if (success) {
        toast.success('Đã duyệt sản phẩm thành công!');
        setViewProductDetails(null);
        loadPackages();
      } else {
        toast.error('Có lỗi xảy ra khi phê duyệt sản phẩm!');
      }
    } catch (e) {
      toast.error('Lỗi khi phê duyệt.');
    }
  };

  const handleReject = async (id: string) => {
    const promptResult = await toast.prompt({
      title: 'Từ chối mâm cúng',
      text: 'Vui lòng nhập lý do từ chối (bắt buộc):',
      inputPlaceholder: 'Nhập lý do tại đây...',
      confirmButtonText: 'Từ chối',
      cancelButtonText: 'Hủy'
    });

    if (!promptResult.isConfirmed) return;

    const reason = promptResult.value;
    if (!reason || !reason.trim()) {
      toast.error('Vui lòng nhập lý do hợp lệ.');
      return;
    }

    try {
      const success = await packageService.rejectPackage(id, reason.trim());
      if (success) {
        toast.success('Đã từ chối sản phẩm.');
        setViewProductDetails(null);
        loadPackages();
      } else {
        toast.error('Có lỗi xảy ra khi từ chối sản phẩm!');
      }
    } catch (e) {
      toast.error('Lỗi khi từ chối.');
    }
  };

  const handleViewDetails = async (id: string) => {
    try {
      let details = await packageService.getPackageById(id);

      if (details) {
        setViewDisplayImageIndex((details as any).primaryImageIndex || 0);
        setViewProductDetails(details);
      } else {
        toast.error('Không tìm thấy thông tin chi tiết sản phẩm');
      }
    } catch (error) {
      toast.error('Có lỗi khi lấy thông tin chi tiết sản phẩm từ API');
    }
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
                    <th className="p-4 font-semibold text-sm text-center">Đơn Hàng</th>
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
                          {mapCategory(product.categoryId)}
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900">
                        {product.price.toLocaleString('vi-VN')}₫
                      </td>
                      <td className="p-4 text-center font-semibold text-gray-800">
                        {product.orders}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${product.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                          {product.status === 'active' ? 'Hoạt động' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleViewDetails(product.id)}
                            className="text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Chi tiết
                          </button>
                          {/* <button
                            onClick={() => handleApprove(product.id)}
                            className="bg-gray-900 hover:bg-gray-800 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Duyệt
                          </button> */}
                          {/* <button
                            onClick={() => handleReject(product.id)}
                            className="border border-red-200 text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                          >
                            Từ chối
                          </button> */}
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

      {/* Product Details Modal */}
      {viewProductDetails && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm"
          onClick={() => setViewProductDetails(null)}
        >
          <div
            className="bg-gray-50 w-full max-w-5xl my-4 rounded-[2rem] shadow-2xl overflow-hidden max-h-[calc(100vh-2rem)] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-white px-6 md:px-8 py-5 flex flex-wrap items-center gap-4 border-b border-gray-100">
              <button
                onClick={() => setViewProductDetails(null)}
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 hover:bg-gray-50 transition flex-shrink-0"
                title="Đóng"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex gap-2 items-center flex-1">
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex-shrink-0 ${viewProductDetails.approvalStatus === 'Approved' ? 'bg-green-100 text-green-700 border border-green-200' :
                  viewProductDetails.approvalStatus === 'Rejected' ? 'bg-red-100 text-red-700 border border-red-200' :
                    'bg-yellow-100 text-yellow-700 border border-yellow-200'
                  }`}>
                  {viewProductDetails.approvalStatus === 'Approved' ? 'Đã Duyệt' : viewProductDetails.approvalStatus === 'Rejected' ? 'Từ Chối' : 'Chờ Duyệt'}
                </span>
                <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex-shrink-0 ${viewProductDetails.isActive ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                  {viewProductDetails.isActive ? 'Đang Bán' : 'Tạm Ngừng'}
                </span>
              </div>
              {/* Actions for Staff */}
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => handleApprove(String(viewProductDetails.packageId || viewProductDetails.id))}
                  className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest text-white bg-green-600 hover:bg-green-700 transition-all shadow-sm flex-shrink-0"
                >
                  Phê Duyệt
                </button>
                <button
                  onClick={() => handleReject(String(viewProductDetails.packageId || viewProductDetails.id))}
                  className="px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-all shadow-sm flex-shrink-0"
                >
                  Từ Chối
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 overflow-y-auto custom-scrollbar">

              {/* Left column */}
              <div className="lg:col-span-7 space-y-6">
                {/* Main Info Card */}
                <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-sm group">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Thông tin cơ bản
                  </h3>
                  <h4 className="text-xl font-bold text-gray-900 mb-2 leading-tight">{viewProductDetails.packageName}</h4>
                  <div className="inline-block px-4 py-1.5 bg-sky-50 text-sky-700 font-bold text-xs rounded-xl mb-4 border border-sky-100">
                    {mapCategory(viewProductDetails.categoryId)}
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-2">Mô tả sản phẩm</p>
                    <p className="text-sm text-gray-700 leading-relaxed bg-gray-50/80 p-4 rounded-[1.25rem] border border-gray-100">
                      {viewProductDetails.description || 'Không có mô tả chi tiết cho sản phẩm này.'}
                    </p>
                  </div>
                </div>

                {/* Variants Card */}
                <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <i className="fas fa-layer-group text-primary"></i>
                    Danh sách gói biến thể ({(viewProductDetails.packageVariants || []).length})
                  </h3>
                  <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {(viewProductDetails.packageVariants && viewProductDetails.packageVariants.length > 0) ? (
                      viewProductDetails.packageVariants.map((v: any, idx: number) => (
                        <div key={v.variantId || v.id || idx} className="rounded-[1.5rem] border p-5 transition-all border-gray-100 bg-gray-50 hover:bg-white hover:shadow-md hover:border-gray-200">
                          <div className="flex items-start justify-between gap-4 mb-3 border-b border-gray-100 pb-3">
                            <div className="flex-1">
                              <p className="font-bold text-gray-800 text-base group-hover:text-primary transition-colors">{v.variantName}</p>
                            </div>
                            <div className="text-right flex flex-col items-end shrink-0">
                              <p className="font-black text-primary text-lg">{Number(v.price).toLocaleString('vi-VN')}đ</p>
                              <span className={`inline-block mt-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${v.isActive ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-200 text-gray-600 border border-gray-300'}`}>
                                {v.isActive ? 'Hoạt động' : 'Tạm ngừng'}
                              </span>
                            </div>
                          </div>
                          {v.description && (
                            <p className="text-sm text-slate-600 bg-white p-3.5 rounded-xl border border-gray-100 italic leading-relaxed shadow-sm">{v.description}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-gray-50 rounded-[1.5rem] border border-dashed border-gray-200">
                        <p className="text-xl mb-2 opacity-30">📦</p>
                        <p className="text-slate-500 text-sm font-medium">Sản phẩm này chưa có biến thể nào.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="lg:col-span-5 space-y-6">
                {/* Product Image Card */}
                <div className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden shadow-sm">
                  {/* Primary image display */}
                  <div className="w-full aspect-square relative rounded-t-[2rem] overflow-hidden">
                    {(() => {
                      const primarySrc = viewProductDetails.imageUrls && viewProductDetails.imageUrls.length > 0
                        ? (viewProductDetails.imageUrls[viewDisplayImageIndex] || viewProductDetails.imageUrls[0])
                        : (viewProductDetails.imageUrl || (viewProductDetails.packageImages && viewProductDetails.packageImages.length > 0 ? (viewProductDetails.packageImages.find((img: any) => img.isPrimary)?.imageUrl || viewProductDetails.packageImages[0].imageUrl) : ''));
                      return primarySrc ? (
                        <img
                          src={primarySrc}
                          alt={viewProductDetails.packageName}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).onerror = null; (e.target as HTMLImageElement).src = fallbackProductImage; }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                          <i className="fas fa-image text-5xl mb-3 opacity-40"></i>
                          <span className="text-sm font-medium text-gray-400">Chưa có ảnh sản phẩm</span>
                        </div>
                      );
                    })()}
                    {viewProductDetails.imageUrls && viewProductDetails.imageUrls.length > 0 && viewDisplayImageIndex === (viewProductDetails.primaryImageIndex || 0) && (
                      <div className="absolute top-4 left-4 bg-yellow-400 text-white text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest shadow-md">
                        ★ Ảnh đại diện
                      </div>
                    )}
                  </div>

                  {/* View mode: multi-image thumbnail list */}
                  {viewProductDetails.imageUrls && viewProductDetails.imageUrls.length > 1 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 overflow-x-auto custom-scrollbar">
                      {viewProductDetails.imageUrls.map((url: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => setViewDisplayImageIndex(idx)}
                          className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${viewDisplayImageIndex === idx ? 'border-primary shadow-md scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                            }`}
                        >
                          <img src={url} alt={`thumb-${idx}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = fallbackProductImage; }} />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Summary Details */}
                <div className="bg-white rounded-[2rem] border border-gray-200 p-6 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-5 pb-3 border-b border-gray-100 flex items-center gap-2">
                    <i className="fas fa-info-circle text-primary"></i> Tóm tắt thông tin
                  </h3>
                  <div className="space-y-4 text-sm relative z-10">
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <span className="text-gray-500 font-semibold">Ngày Đăng Hàng</span>
                      <span className="font-bold text-gray-800 bg-gray-50 px-3 py-1.5 rounded-xl">{viewProductDetails.createdAt ? new Date(viewProductDetails.createdAt).toLocaleString('vi-VN') : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                      <span className="text-gray-500 font-semibold">Số lượng đã bán</span>
                      <span className="font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-xl">{viewProductDetails.totalSold || 0} đơn hàng</span>
                    </div>
                    <div className="flex justify-between items-center pb-1">
                      <span className="text-gray-500 font-semibold">Vendor ID</span>
                      <span className="font-bold text-gray-800">{viewProductDetails.vendorProfileId || viewProductDetails.vendorId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StaffProductManagement;
