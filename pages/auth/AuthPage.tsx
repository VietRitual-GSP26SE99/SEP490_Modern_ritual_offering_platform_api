import React, { useState } from 'react';
import { UserRole } from '../../types';
import { login, register, LoginRequest, RegisterRequest } from '../../services/auth';

interface AuthPageProps {
  onNavigate: (path: string) => void;
  onLogin?: (role: UserRole, firstTimeLogin?: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    // Clear error when user starts typing
    if (error) setError(null);
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
      role: 'staff' as UserRole,
      email: 'nhanvien@demo.com',
      password: '123456',
      name: 'Nhân Viên Demo',
      label: 'Nhân Viên',
      description: 'Hỗ trợ và quản lý đơn hàng'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      // Handle login
      try {
        setError(null);
        const credentials: LoginRequest = {
          usernameOrEmail: formData.email,
          password: formData.password,
        };

        console.log('🔐 Logging in with:', credentials);
        const response = await login(credentials);
        console.log('✅ Login successful:', response);

        // Prepare user data to save
        const userData = {
          id: response.userId,
          name: response.name,
          email: response.email,
          role: response.role
        };

        // Lưu token và user info vào localStorage
        localStorage.setItem('smart-child-token', response.token);
        localStorage.setItem('smart-child-refresh-token', response.refreshToken);
        localStorage.setItem('smart-child-user', JSON.stringify(userData));
        
        console.log('💾 Saved to localStorage:', {
          token: response.token.substring(0, 20) + '...',
          refreshToken: response.refreshToken.substring(0, 20) + '...',
          user: userData
        });

        // Check if profile is complete (for first-time login)
        try {
          console.log('🔍 Checking if profile is complete...');
          const { getProfile } = await import('../../services/auth');
          const profile = await getProfile();
          
          // Check if required fields are filled
          const isProfileIncomplete = !profile.fullName || 
                                      !profile.phoneNumber || 
                                      !profile.dateOfBirth || 
                                      !profile.addressText;
          
          console.log('📋 Profile status:', {
            fullName: profile.fullName,
            phoneNumber: profile.phoneNumber,
            dateOfBirth: profile.dateOfBirth,
            addressText: profile.addressText,
            isIncomplete: isProfileIncomplete
          });

          if (isProfileIncomplete) {
            // First-time login - redirect to profile page
            console.log('⚠️ Profile incomplete - redirecting to profile setup');
            alert('Chào mừng bạn đến với Modern Ritual!\n\nĐể tiếp tục, vui lòng hoàn thành thông tin cá nhân của bạn.');
            
            if (onLogin) {
              onLogin(response.role as UserRole, true); // Pass true for first-time login
            }
            return;
          }
        } catch (profileError) {
          console.error('⚠️ Could not check profile completeness:', profileError);
          // Continue with normal login flow if profile check fails
        }

        // Thông báo thành công
        alert('Đăng nhập thành công!');

        if (onLogin) {
          onLogin(response.role as UserRole);
        }
      } catch (error) {
        console.error('❌ Login failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        setError(errorMessage);
      }
    } else {
      // Handle registration
      if (formData.password !== formData.confirmPassword) {
        setError('Mật khẩu không khớp');
        return;
      }
      if (!formData.agreeTerms) {
        setError('Vui lòng đồng ý với điều khoản sử dụng');
        return;
      }

      try {
        setError(null);
        const registerData: RegisterRequest = {
          username: formData.name,
          email: formData.email,
          password: formData.password,
        };

        console.log('📝 Registering:', registerData);
        const response = await register(registerData);
        console.log('✅ Registration successful:', response);

        // Show success message with better instructions
        const successMessage = `✅ Đăng ký thành công!\n\n📧 Chúng tôi đã gửi email xác nhận đến:\n${formData.email}\n\nVui lòng kiểm tra hộp thư (và cả thư mục Spam) để xác nhận tài khoản.\n\n⏱️ Link xác nhận sẽ hết hạn sau 24 giờ.`;
        alert(successMessage);

        // Chuyển về form đăng nhập
        setIsLogin(true);
        setError(null);
      } catch (error) {
        console.error('❌ Registration failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        setError(errorMessage);
      }
    }
  };

  // Registration form
  if (!isLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-gray-900/5 via-gray-700/5 to-gray-500/5 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gradient-to-br from-black/5 via-gray-800/5 to-gray-600/5 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-gradient-to-br from-gray-400/5 to-gray-600/5 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
          <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-gradient-to-br from-slate-900/5 to-zinc-900/5 rounded-full blur-3xl animate-float-delayed" style={{animationDelay: '2s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-br from-gray-200/10 to-gray-400/10 rounded-full blur-3xl animate-pulse"></div>
        </div>

        <div className="max-w-xl w-full relative z-10 animate-fade-in">
          <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] p-10 border border-gray-200/60 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] transition-all duration-500">
            {/* Header */}
            <div className="text-center mb-8 animate-scale-in">
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 via-gray-700/20 to-gray-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-full flex items-center justify-center mx-auto shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-110 group">
                  <span className="text-3xl text-white font-playfair font-bold group-hover:scale-110 transition-transform duration-300">M</span>
                  <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
                </div>
              </div>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-playfair font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">Modern Ritual</h1>
                <p className="text-sm text-gray-600 font-semibold tracking-wide">Nền tảng mâm cúng hiện đại</p>
              </div>
              <h2 className="text-3xl font-playfair font-bold text-gray-900 mb-2">
                Tạo tài khoản mới
              </h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto">
                Đăng ký để trải nghiệm nền tảng mâm cúng hiện đại
              </p>
              
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-800">Đăng ký thất bại</p>
                    <p className="text-sm text-red-700 mt-1">{error}</p>
                  </div>
                </div>
              )}

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
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-4 focus:ring-gray-900/10 focus:outline-none bg-white/50 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:bg-white"
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
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-4 focus:ring-gray-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
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
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-4 focus:ring-gray-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
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
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-4 focus:ring-gray-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
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
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:ring-4 focus:ring-gray-100 focus:outline-none bg-white transition-all shadow-sm hover:shadow-md"
                  />
                </div>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">Yêu cầu mật khẩu:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Tối thiểu 6 ký tự</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Ít nhất 1 chữ cái viết HOA (A-Z)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Ít nhất 1 chữ cái viết thường (a-z)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Ít nhất 1 ký tự đặc biệt (!@#$%^&*)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-gray-400">•</span>
                    <span>Ít nhất 1 chữ số (0-9)</span>
                  </li>
                </ul>
                <div className="mt-3 pt-3 border-t border-gray-300">
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-600">Ví dụ:</span> <span className="font-mono bg-white px-2 py-1 rounded border border-gray-300">Modern@123</span>
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer p-4 rounded-xl hover:bg-gray-50 transition-all duration-300 border-2 border-transparent hover:border-gray-300 hover:shadow-sm group">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                  required
                  className="w-5 h-5 text-gray-900 rounded-md mt-0.5 cursor-pointer accent-gray-900"
                />
                <span className="text-sm text-gray-600 leading-relaxed">
                  Tôi đồng ý với <a href="#" className="text-gray-900 font-semibold hover:underline decoration-2">điều khoản sử dụng</a> và <a href="#" className="text-gray-900 font-semibold hover:underline decoration-2">chính sách bảo mật</a> của Modern Ritual
                </span>
              </label>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-black hover:via-gray-900 hover:to-black text-white font-bold py-5 rounded-xl transition-all duration-300 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4)] transform hover:-translate-y-1 hover:scale-[1.02] mt-6 text-lg relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <span>Tạo tài khoản</span>
                  <span className="group-hover:translate-x-2 transition-transform duration-300">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
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
                onClick={() => { setIsLogin(true); setError(null); }}
                className="text-gray-600 hover:text-gray-900 font-semibold transition-colors text-sm"
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
            25% { transform: translate(20px, -20px) rotate(3deg); }
            50% { transform: translate(-10px, 10px) rotate(-3deg); }
            75% { transform: translate(-20px, -10px) rotate(2deg); }
          }
          @keyframes float-delayed {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(-25px, 15px) rotate(-4deg); }
            50% { transform: translate(15px, -15px) rotate(4deg); }
            75% { transform: translate(10px, 20px) rotate(-2deg); }
          }
          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-float {
            animation: float 25s ease-in-out infinite;
          }
          .animate-float-delayed {
            animation: float-delayed 30s ease-in-out infinite;
          }
          .animate-scale-in {
            animation: scale-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
          .animate-fade-in {
            animation: fade-in 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
          }
        `}</style>
      </div>
    );
  }

  // Login view
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-slate-50 to-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background for login */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-gray-900/5 to-gray-700/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-[32rem] h-[32rem] bg-gradient-to-br from-black/5 to-gray-800/5 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-gradient-to-br from-gray-400/5 to-gray-600/5 rounded-full blur-3xl animate-pulse"></div>
      </div>
      <div className="max-w-2xl w-full relative z-10 animate-fade-in">
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] p-8 border border-gray-200/60 hover:shadow-[0_25px_70px_-15px_rgba(0,0,0,0.2)] transition-all duration-500">
              {/* Logo */}
              <div className="text-center mb-8">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-900/20 to-gray-700/20 rounded-full blur-2xl animate-pulse"></div>
                  <div className="relative w-20 h-20 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-full flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.4)] hover:shadow-[0_15px_50px_-10px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-110 group cursor-pointer">
                    <span className="text-3xl text-white font-playfair font-bold group-hover:scale-110 transition-transform duration-300">M</span>
                    <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:border-white/40 transition-colors duration-300"></div>
                  </div>
                </div>
                <h1 className="text-3xl font-playfair font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">Modern Ritual</h1>
                <p className="text-sm text-gray-600 font-semibold tracking-wide">Nền tảng mâm cúng hiện đại</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-8 bg-gray-100/80 backdrop-blur-sm p-1.5 rounded-xl shadow-inner">
                <button
                  onClick={() => { setIsLogin(true); setError(null); }}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    isLogin
                      ? 'bg-white text-gray-900 shadow-lg scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Đăng Nhập
                </button>
                <button
                  onClick={() => { setIsLogin(false); setError(null); }}
                  className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                    !isLogin
                      ? 'bg-white text-gray-900 shadow-lg scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  Đăng Ký
                </button>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800">Đăng nhập thất bại</p>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    required
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-4 focus:ring-gray-900/10 focus:outline-none bg-white/50 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:bg-white"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-gray-900 focus:ring-4 focus:ring-gray-900/10 focus:outline-none bg-white/50 backdrop-blur-sm transition-all duration-300 shadow-sm hover:shadow-md hover:border-gray-400 hover:bg-white"
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 text-gray-900 rounded" />
                    <span className="text-gray-600">Ghi nhớ đăng nhập</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onNavigate('/forgot-password')}
                    className="text-gray-900 font-semibold hover:underline"
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-black hover:via-gray-900 hover:to-black text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)] hover:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.4)] transform hover:-translate-y-1 hover:scale-[1.02] mt-6 relative overflow-hidden group"
                >
                  <span className="relative z-10">Đăng Nhập</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>
              </form>

              {/* Social Login */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">hoặc</span>
                </div>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-900 font-semibold py-3 rounded-xl hover:border-gray-900 hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md group"
              >
                <span className="group-hover:scale-110 transition-transform duration-300"></span>
                <span>Đăng nhập với Google</span>
              </button>

              {/* Trust Indicators */}
              <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <span>Bảo mật</span>
                </div>
                <div className="text-gray-300">•</div>
                <div className="flex items-center gap-1">
                  <span>Mã hóa SSL</span>
                </div>
                <div className="text-gray-300">•</div>
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
