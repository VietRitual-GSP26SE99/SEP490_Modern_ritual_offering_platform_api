import React, { useState } from 'react';
import { UserRole } from '../../types';

interface AuthPageProps {
  onNavigate: (path: string) => void;
  onLogin?: (role: UserRole) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
    userType: 'customer' as UserRole,
    agreeTerms: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    // Gọi onLogin để cập nhật state trong App.tsx
    if (onLogin) {
      onLogin(role);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      // Handle login
      console.log('Login:', { email: formData.email, password: formData.password });
      handleRoleSelect(formData.userType);
    } else {
      // Handle registration
      if (formData.password !== formData.confirmPassword) {
        alert('Mật khẩu không khớp');
        return;
      }
      if (!formData.agreeTerms) {
        alert('Vui lòng đồng ý với điều khoản sử dụng');
        return;
      }
      console.log('Register:', formData);
      handleRoleSelect(formData.userType);
    }
  };

  // Role selection view
  if (!selectedRole && !isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-amber-50 to-yellow-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-playfair font-bold text-red-900 mb-2">Chọn loại tài khoản</h1>
            <p className="text-gray-600">Bạn muốn đăng ký tài khoản gì?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer */}
            <button
              onClick={() => handleRoleSelect('customer')}
              className="border-2 border-primary rounded-2xl p-8 shadow-sm hover:shadow-lg hover:bg-primary/5 transition-all group"
            >
              <div className="text-5xl mb-4 text-center group-hover:scale-110 transition-transform">
                🛍️
              </div>
              <h3 className="font-bold text-xl text-primary mb-2">Khách Hàng</h3>
              <p className="text-sm text-gray-600">Mua sắm mâm cúng chất lượng</p>
            </button>

            {/* Vendor */}
            <button
              onClick={() => handleRoleSelect('vendor')}
              className="border-2 border-primary rounded-2xl p-8 shadow-sm hover:shadow-lg hover:bg-primary/5 transition-all group"
            >
              <div className="text-5xl mb-4 text-center group-hover:scale-110 transition-transform">
                🏪
              </div>
              <h3 className="font-bold text-xl text-primary mb-2">Nhà Cung Cấp</h3>
              <p className="text-sm text-gray-600">Bán mâm cúng trên nền tảng</p>
            </button>

            {/* Admin */}
            <button
              onClick={() => handleRoleSelect('admin')}
              className="border-2 border-primary rounded-2xl p-8 shadow-sm hover:shadow-lg hover:bg-primary/5 transition-all group"
            >
              <div className="text-5xl mb-4 text-center group-hover:scale-110 transition-transform">
                ⚙️
              </div>
              <h3 className="font-bold text-xl text-primary mb-2">Quản Trị Viên</h3>
              <p className="text-sm text-gray-600">Quản lý hệ thống nền tảng</p>
            </button>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={() => setIsLogin(true)}
              className="text-red-900 font-semibold hover:text-red-700 transition-colors"
            >
              Đã có tài khoản? Đăng nhập
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-amber-50 to-yellow-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 border-2 border-yellow-200">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-red-900 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl text-white font-playfair font-bold">M</span>
            </div>
            <h1 className="text-2xl font-playfair font-bold text-red-900 mb-1">Modern Ritual</h1>
            <p className="text-xs text-yellow-600 font-semibold">Nền tảng mâm cúng hiện đại</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-4 mb-8 bg-amber-50 p-1 rounded-xl">
            <button
              onClick={() => { setIsLogin(true); setSelectedRole(null); }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                isLogin
                  ? 'bg-white text-red-900 shadow-md'
                  : 'text-gray-600 hover:text-red-900'
              }`}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => { setIsLogin(false); setSelectedRole(null); }}
              className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                !isLogin
                  ? 'bg-white text-red-900 shadow-md'
                  : 'text-gray-600 hover:text-red-900'
              }`}
            >
              Đăng Ký
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tên đầy đủ</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Nhập tên của bạn"
                    required
                    className="w-full px-4 py-3 border-2 border-yellow-200 rounded-lg focus:border-red-900 focus:outline-none bg-amber-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                    required
                    className="w-full px-4 py-3 border-2 border-yellow-200 rounded-lg focus:border-red-900 focus:outline-none bg-amber-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Loại tài khoản</label>
                  <select
                    name="userType"
                    value={formData.userType}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-yellow-200 rounded-lg focus:border-red-900 focus:outline-none bg-amber-50"
                  >
                    <option value="customer">Khách hàng</option>
                    <option value="vendor">Nhà cung cấp</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email"
                required
                className="w-full px-4 py-3 border-2 border-yellow-200 rounded-lg focus:border-red-900 focus:outline-none bg-amber-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu"
                required
                className="w-full px-4 py-3 border-2 border-yellow-200 rounded-lg focus:border-red-900 focus:outline-none bg-amber-50"
              />
            </div>

            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Nhập lại mật khẩu"
                    required
                    className="w-full px-4 py-3 border-2 border-yellow-200 rounded-lg focus:border-red-900 focus:outline-none bg-amber-50"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-red-900 rounded"
                  />
                  <span className="text-sm text-gray-600">
                    Tôi đồng ý với <a href="#" className="text-red-900 font-semibold hover:underline">điều khoản sử dụng</a>
                  </span>
                </label>
              </>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white font-bold py-3 rounded-lg transition-all shadow-lg mt-6"
            >
              {isLogin ? 'Đăng Nhập' : 'Đăng Ký'}
            </button>
          </form>

          {/* Social Login */}
          {isLogin && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-yellow-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">hoặc</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-lg hover:bg-primary/5 transition-colors"
              >
                🔐 Đăng nhập với Google
              </button>
            </>
          )}

          {/* Trust Indicators */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span>✓</span>
              <span>Bảo mật</span>
            </div>
            <div className="text-yellow-300">•</div>
            <div className="flex items-center gap-1">
              <span>🔒</span>
              <span>SSL</span>
            </div>
            <div className="text-yellow-300">•</div>
            <div className="flex items-center gap-1">
              <span>🛡️</span>
              <span>Riêng tư</span>
            </div>
          </div>
        </div>

        <p className="text-center text-white text-sm mt-6">
          © 2025 Modern Ritual. Thành tâm - Tín trực.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
