import React, { useState } from 'react';
import { UserRole } from '../../types';

interface AuthPageProps {
  onNavigate: (path: string) => void;
  onLogin?: (role: UserRole) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
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

  const demoAccounts = [
    {
      role: 'customer' as UserRole,
      email: 'khachhang@demo.com',
      password: '123456',
      name: 'Khách Hàng Demo',
      label: 'Khách Hàng',
      description: 'Mua sắm mâm cúng chất lượng'
    },
    {
      role: 'vendor' as UserRole,
      email: 'nhacungcap@demo.com',
      password: '123456',
      name: 'Nhà Cung Cấp Demo',
      label: 'Nhà Cung Cấp',
      description: 'Bán mâm cúng trên nền tảng'
    },
    {
      role: 'admin' as UserRole,
      email: 'admin@demo.com',
      password: '123456',
      name: 'Admin Demo',
      label: 'Quản Trị Viên',
      description: 'Quản lý hệ thống nền tảng'
    }
  ];

  const handleDemoLogin = (account: typeof demoAccounts[0]) => {
    setFormData(prev => ({
      ...prev,
      email: account.email,
      password: account.password,
      userType: account.role
    }));
    if (onLogin) {
      onLogin(account.role);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      // Handle login
      console.log('Login:', { email: formData.email, password: formData.password });
      if (onLogin) {
        onLogin(formData.userType);
      }
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
      // Đăng ký với role mặc định là customer, admin sẽ phân quyền sau
      if (onLogin) {
        onLogin('customer');
      }
    }
  };

  // Registration form
  if (!isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-yellow-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-red-300/20 to-pink-300/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-amber-300/10 to-rose-300/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-xl w-full relative z-10 animate-fade-in">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border-2 border-yellow-200/50">
            {/* Header */}
            <div className="text-center mb-8 animate-scale-in">
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-red-400/30 to-yellow-400/30 rounded-3xl blur-2xl animate-pulse"></div>
                {/* <div className="relative bg-gradient-to-br from-red-50 to-yellow-50 rounded-3xl p-6 border-2 border-red-200/50">
                  <div className="text-6xl transform hover:scale-110 hover:rotate-12 transition-all duration-300">
                  </div>
                </div> */}
              </div>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-br from-red-900 to-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-white font-playfair font-bold">M</span>
                </div>
                <h1 className="text-2xl font-playfair font-bold text-red-900 mb-1">Modern Ritual</h1>
                <p className="text-xs text-yellow-600 font-semibold">Nền tảng mâm cúng hiện đại</p>
              </div>
              <h2 className="text-3xl font-playfair font-bold text-red-900 mb-2">
                Tạo tài khoản mới
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Đăng ký để trải nghiệm nền tảng mâm cúng hiện đại
              </p>
              
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span>Tên đầy đủ</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nguyễn Văn A"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span>Email</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@email.com"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span>Số điện thoại</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0901 234 567"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span>Mật khẩu</span>
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <span>Xác nhận</span>
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-4 focus:ring-red-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <span>Mật khẩu tối thiểu 6 ký tự</span>
              </p>

              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl hover:bg-amber-50/50 transition-all border-2 border-transparent hover:border-amber-200 group">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  required
                  className="w-5 h-5 text-red-900 rounded-md mt-0.5 cursor-pointer"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  Tôi đồng ý với <a href="#" className="text-red-900 font-semibold hover:underline decoration-2">điều khoản sử dụng</a> và <a href="#" className="text-red-900 font-semibold hover:underline decoration-2">chính sách bảo mật</a> của Modern Ritual
                </span>
              </label>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-900 via-red-800 to-red-700 hover:from-red-800 hover:via-red-700 hover:to-red-600 text-white font-bold py-5 rounded-xl transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 mt-6 text-lg relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Tạo tài khoản</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-red-400/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </button>
            </form>

            {/* Trust Indicators */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-semibold">Bảo mật cao</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-semibold">SSL 256-bit</span>
                </div>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="font-semibold">Riêng tư 100%</span>
                </div>
              </div>
            </div>

            {/* Back to login */}
            <div className="text-center mt-6">
              <button
                onClick={() => setIsLogin(true)}
                className="text-gray-600 hover:text-red-900 font-semibold transition-colors text-sm"
              >
                ← Đã có tài khoản? Đăng nhập
              </button>
            </div>
          </div>

          <p className="text-center text-gray-700 text-sm mt-8 font-medium">
            © 2025 Modern Ritual. Thành tâm - Tín trực.
          </p>
        </div>

        <style>{`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(10px, -10px) rotate(5deg); }
            50% { transform: translate(-5px, 5px) rotate(-5deg); }
            75% { transform: translate(-10px, -5px) rotate(3deg); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-15px, 10px) rotate(-5deg); }
            50% { transform: translate(10px, -10px) rotate(5deg); }
            75% { transform: translate(5px, 15px) rotate(-3deg); }
          }
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-float {
            animation: float 20s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 25s ease-in-out infinite;
          }
          .animate-scale-in {
            animation: scale-in 0.5s ease-out;
          }
          .animate-fade-in {
            animation: fade-in 0.6s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // Login view
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-100 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
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
                  onClick={() => { setIsLogin(true); }}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    isLogin
                      ? 'bg-white text-red-900 shadow-md'
                      : 'text-gray-600 hover:text-red-900'
                  }`}
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => { setIsLogin(false); }}
                  className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-all ${
                    !isLogin
                      ? 'bg-white text-red-900 shadow-md'
                      : 'text-gray-600 hover:text-red-900'
                  }`}
                >
                  Đăng Ký
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    required
                    className="w-full px-4 py-3 border-2 border-yellow-200 rounded-lg focus:border-red-900 focus:outline-none bg-amber-50/50 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-3 border-2 border-yellow-200 rounded-lg focus:border-red-900 focus:outline-none bg-amber-50/50 transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-red-900 rounded" />
                    <span className="text-gray-600">Ghi nhớ đăng nhập</span>
                  </label>
                  <a href="#" className="text-red-900 font-semibold hover:underline">Quên mật khẩu?</a>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-red-900 to-red-700 hover:from-red-800 hover:to-red-600 text-white font-bold py-4 rounded-lg transition-all shadow-lg hover:shadow-xl mt-6"
                >
                  Đăng Nhập
                </button>
              </form>

              {/* Social Login */}
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
                className="w-full flex items-center justify-center gap-2 border-2 border-red-900 text-red-900 font-semibold py-3 rounded-lg hover:bg-red-50 transition-colors"
              >
                 Đăng nhập với Google
              </button>

              {/* Demo Accounts Section */}
              <div className="mt-8 pt-6 border-t border-yellow-200">
                <h3 className="text-base font-bold text-red-900 mb-2 text-center">Tài khoản Demo</h3>
                <p className="text-xs text-gray-600 text-center mb-4">Nhấn để đăng nhập nhanh</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {demoAccounts.map((account) => (
                    <button
                      key={account.role}
                      onClick={() => handleDemoLogin(account)}
                      className="bg-gradient-to-br from-amber-50 to-yellow-50 border-2 border-yellow-200 rounded-xl p-3 hover:border-red-900 hover:shadow-md transition-all text-center group"
                    >
                      {/* <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                        {account.icon}
                      </div> */}
                      <h4 className="font-bold text-red-900 text-xs mb-1">{account.label}</h4>
                      <div className="space-y-0.5">
                        <p className="text-xs text-gray-500 truncate">
                          {account.email}
                        </p>
                        <p className="text-xs text-gray-500">
                          Pass: {account.password}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-yellow-200">
                  <p className="text-xs text-gray-600 text-center">
                    <span className="font-semibold">Mẹo:</span> Click vào tài khoản để tự động điền thông tin đăng nhập
                  </p>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span>Bảo mật</span>
                </div>
                <div className="text-yellow-300">•</div>
                <div className="flex items-center gap-1">
                  <span>Mã hóa SSL</span>
                </div>
                <div className="text-yellow-300">•</div>
                <div className="flex items-center gap-1">
                  <span>Riêng tư</span>
                </div>
              </div>
            </div>

        <p className="text-center text-gray-700 text-sm mt-6">
          © 2025 Modern Ritual. Thành tâm - Tín trực.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
