import React, { useEffect, useState } from 'react';
import toast from '../../services/toast';
import { packageService } from '../../services/packageService';
import { getCurrentUser } from '../../services/auth';

interface ProductManagementProps {
  onNavigate: (path: string) => void;
}

interface Product {
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
}

type PackageStatusFilter = '' | 'Draft' | 'Pending' | 'Approved' | 'Rejected';

const ProductManagement: React.FC<ProductManagementProps> = ({ onNavigate }) => {
  const PRODUCTS_PER_PAGE = 10;

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<PackageStatusFilter>('Approved');

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Đầy Tháng',
    price: '',
    stock: '',
    description: '',
  });

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
      const currentUser = getCurrentUser();
      const currentVendorId = String((currentUser as { profileId?: string } | null)?.profileId || '').trim();

      const packages = await packageService.getPackagesByStatus(selectedStatus);

      // On vendor management page, prioritize showing current vendor packages.
      const ownedPackages = currentVendorId
        ? packages.filter((item) => {
          const vendorId = String((item as any).vendorProfileId || (item as any).vendorId || '').trim();
          return vendorId === currentVendorId;
        })
        : [];

      const source = ownedPackages.length > 0 ? ownedPackages : packages;

      const mapped: Product[] = source.map((item) => {
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

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.stock) {
      console.log('Add product:', newProduct);
      setNewProduct({ name: '', category: 'Đầy Tháng', price: '', stock: '', description: '' });
      setShowAddForm(false);
      toast.success('Sản phẩm thêm thành công!');
    } else {
      toast.warning('Vui lòng điền đầy đủ thông tin');
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 font-sans text-slate-800">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-primary mb-2">Quản Lý Sản Phẩm</h1>
            <p className="text-gray-600">Quản lý danh mục sản phẩm mâm cúng của bạn</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-6 py-2 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5"
          >
            Thêm Sản Phẩm
          </button>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-2 border-gold/20">
            <h2 className="text-xl font-bold text-primary mb-6">Thêm Sản Phẩm Mới</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tên Sản Phẩm</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="Ví dụ: Mâm Cúng Đầy Tháng..."
                  className="w-full px-4 py-2 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Danh Mục</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  className="w-full px-4 py-2 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none"
                >
                  <option>Đầy Tháng</option>
                  <option>Tân Gia</option>
                  <option>Khai Trương</option>
                  <option>Tổ Tiên</option>
                  <option>Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Giá (VNĐ)</label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  placeholder="1000000"
                  className="w-full px-4 py-2 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tồn Kho</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  placeholder="10"
                  className="w-full px-4 py-2 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mô Tả Chi Tiết</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                  placeholder="Mô tả sản phẩm..."
                  rows={4}
                  className="w-full px-4 py-2 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleAddProduct}
                className="flex-1 px-6 py-2 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5"
              >
                Thêm Sản Phẩm
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-6 py-2 border-2 border-slate-300 text-slate-600 rounded-lg font-bold hover:bg-slate-50 transition-all"
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-primary">
            <p className="text-gray-600 text-sm font-semibold mb-2">Tổng Sản Phẩm</p>
            <p className="text-3xl font-black text-primary">{products.length}</p>
            <p className="text-xs text-gray-500 mt-2">Đang bán: {products.filter(p => p.status === 'active').length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Tổng Đơn Hàng</p>
            <p className="text-3xl font-black text-blue-600">{products.reduce((sum, p) => sum + p.orders, 0)}</p>
            <p className="text-xs text-gray-500 mt-2">Từ tất cả sản phẩm</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Đánh Giá Trung Bình</p>
            <p className="text-3xl font-black text-yellow-600">{products.length > 0 ? (products.reduce((sum, p) => sum + p.rating, 0) / products.length).toFixed(1) : '0.0'} ⭐</p>
            <p className="text-xs text-gray-500 mt-2">Dựa trên dữ liệu hiện có</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Tồn Kho Tổng</p>
            <p className="text-3xl font-black text-orange-600">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
            <p className="text-xs text-gray-500 mt-2">Sản phẩm có sẵn</p>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gold/20">
          <div className="px-4 md:px-6 py-4 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm font-semibold text-slate-700">Lọc danh sách sản phẩm</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <label htmlFor="product-status-filter" className="text-sm text-slate-600 font-medium">Trạng thái</label>
              <select
                id="product-status-filter"
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value as PackageStatusFilter)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="">--</option>
                <option value="Draft">Nháp</option>
                <option value="Pending">Chờ</option>
                <option value="Approved">Duyệt</option>
                <option value="Rejected">Bị từ chối</option>
              </select>

              <label htmlFor="product-category-filter" className="text-sm text-slate-600 font-medium">Danh mục</label>
              <select
                id="product-category-filter"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                <option value="all">Tất cả</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingProducts && (
            <div className="px-6 py-8 text-center text-slate-500 font-semibold">Đang tải danh sách sản phẩm...</div>
          )}

          {!loadingProducts && productsError && (
            <div className="px-6 py-8 text-center">
              <p className="text-red-600 font-semibold mb-4">{productsError}</p>
              <button
                onClick={loadPackages}
                className="px-6 py-2 border-2 border-primary text-primary rounded-lg font-bold text-sm uppercase hover:bg-primary/5 transition-all"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loadingProducts && !productsError && filteredProducts.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500 font-semibold">
              {products.length === 0 ? 'Không có sản phẩm cho trạng thái đã chọn.' : 'Không có sản phẩm thuộc danh mục đã chọn.'}
            </div>
          )}

          {!loadingProducts && !productsError && filteredProducts.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300">
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">Sản Phẩm</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">Danh Mục</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">Giá</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">Tồn Kho</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">Đơn Hàng</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">Đánh Giá</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">Trạng Thái</th>
                      <th className="px-6 py-4 text-left text-sm font-bold text-slate-800 whitespace-nowrap">Hành Động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {paginatedProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={toImageSrc(product.image)}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100"
                              loading="lazy"
                            />
                            <div>
                              <p className="font-semibold text-gray-800">{product.name}</p>
                              <p className="text-xs text-gray-500">ID: {product.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold whitespace-nowrap">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-primary">
                          {product.price.toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${product.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-800">{product.orders}</td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-800">{product.rating > 0 ? product.rating.toFixed(1) : 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${product.status === 'active'
                              ? 'bg-green-100 text-green-700'
                              : product.status === 'inactive'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {product.status === 'active' ? 'Hoạt Động' : product.status === 'inactive' ? 'Ngừng' : 'Nháp'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingId(product.id)}
                              className="px-3 py-2 text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors text-sm font-semibold"
                              title="Chỉnh sửa"
                            >
                              Sửa
                            </button>
                            <button
                              className="px-3 py-2 text-red-600 border border-red-300 hover:bg-red-100 rounded-lg transition-colors text-sm font-semibold"
                              title="Xóa"
                              onClick={async () => {
                                const result = await toast.confirm({
                                  title: 'Xóa sản phẩm?',
                                  text: `Bạn có chắc chắn muốn xóa "${product.name}"?`,
                                  icon: 'warning',
                                  confirmButtonText: 'Xóa',
                                  cancelButtonText: 'Hủy'
                                });
                                if (result.isConfirmed) {
                                  toast.success('Xóa sản phẩm thành công!');
                                }
                              }}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredProducts.length > PRODUCTS_PER_PAGE && (
                <div className="flex flex-col md:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 md:px-6 py-4 bg-white">
                  <p className="text-sm text-slate-600">
                    Hiển thị{' '}
                    <span className="font-semibold">{(safeCurrentPage - 1) * PRODUCTS_PER_PAGE + 1}</span>
                    {' - '}
                    <span className="font-semibold">{Math.min(safeCurrentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}</span>
                    {' / '}
                    <span className="font-semibold">{filteredProducts.length}</span>
                    {' sản phẩm'}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={safeCurrentPage === 1}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Trước
                    </button>

                    {Array.from({ length: filteredTotalPages }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`min-w-9 h-9 px-2 rounded-lg text-sm font-bold transition-all ${safeCurrentPage === page
                            ? 'bg-primary text-white'
                            : 'border border-slate-300 text-slate-700 hover:bg-slate-100'
                          }`}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(filteredTotalPages, prev + 1))}
                      disabled={safeCurrentPage === filteredTotalPages}
                      className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>


      </div>
    </div>
  );
};

export default ProductManagement;
