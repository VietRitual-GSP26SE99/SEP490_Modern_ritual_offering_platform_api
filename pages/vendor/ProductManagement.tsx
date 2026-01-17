import React, { useState } from 'react';

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

const ProductManagement: React.FC<ProductManagementProps> = ({ onNavigate }) => {
  const [products] = useState<Product[]>([
    {
      id: '1',
      name: 'Mâm Cúng Đầy Tháng 5 Món',
      category: 'Đầy Tháng',
      price: 1200000,
      stock: 25,
      image: '',
      rating: 4.8,
      orders: 156,
      status: 'active',
      created: '2025-01-01',
    },
    {
      id: '2',
      name: 'Mâm Cúng Tân Gia 8 Món',
      category: 'Tân Gia',
      price: 1800000,
      stock: 12,
      image: '',
      rating: 4.6,
      orders: 89,
      status: 'active',
      created: '2025-01-05',
    },
    {
      id: '3',
      name: 'Mâm Cúng Khai Trương Premium',
      category: 'Khai Trương',
      price: 2500000,
      stock: 5,
      image: '',
      rating: 5.0,
      orders: 34,
      status: 'active',
      created: '2025-01-08',
    },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Đầy Tháng',
    price: '',
    stock: '',
    description: '',
  });

  const handleAddProduct = () => {
    if (newProduct.name && newProduct.price && newProduct.stock) {
      console.log('Add product:', newProduct);
      setNewProduct({ name: '', category: 'Đầy Tháng', price: '', stock: '', description: '' });
      setShowAddForm(false);
      alert('Sản phẩm thêm thành công!');
    } else {
      alert('Vui lòng điền đầy đủ thông tin');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-yellow-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-primary mb-2">Quản Lý Sản Phẩm</h1>
            <p className="text-gray-600">Quản lý danh mục sản phẩm mâm cúng của bạn</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-6 py-2 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5"
          >
            <span className="material-symbols-outlined">add</span>
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

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-gold/20">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-primary/10 to-gold/10 border-b-2 border-gold/20">
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Sản Phẩm</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Danh Mục</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Giá</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Tồn Kho</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Đơn Hàng</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Đánh Giá</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Trạng Thái</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-primary">Hành Động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/10">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-amber-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{product.image}</span>
                        <div>
                          <p className="font-semibold text-gray-800">{product.name}</p>
                          <p className="text-xs text-gray-500">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {product.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-primary">
                      {product.price.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${product.stock > 10 ? 'text-green-600' : 'text-orange-600'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-800">{product.orders}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-yellow-500">star</span>
                        <span className="font-bold text-gray-800">{product.rating}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : product.status === 'inactive'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {product.status === 'active' ? '✓ Hoạt Động' : product.status === 'inactive' ? 'Ngừng' : 'Nháp'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(product.id)}
                          className="p-2 text-slate-600 border-2 border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined">edit</span>
                        </button>
                        <button
                          className="p-2 text-red-600 border-2 border-red-300 hover:bg-red-100 rounded-lg transition-colors"
                          title="Xóa"
                          onClick={() => alert('Xóa sản phẩm: ' + product.name)}
                        >
                          <span className="material-symbols-outlined">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
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
            <p className="text-3xl font-black text-yellow-600">4.8 ⭐</p>
            <p className="text-xs text-gray-500 mt-2">Từ khách hàng</p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm font-semibold mb-2">Tồn Kho Tổng</p>
            <p className="text-3xl font-black text-orange-600">{products.reduce((sum, p) => sum + p.stock, 0)}</p>
            <p className="text-xs text-gray-500 mt-2">Sản phẩm có sẵn</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductManagement;
