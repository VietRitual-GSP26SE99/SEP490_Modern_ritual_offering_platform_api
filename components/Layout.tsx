
import React, { useState } from 'react';
import { UserRole, AppRoute, getPath } from '../types';
import { logoutAndRedirect } from '../services/auth';

interface NavItem {
  path?: string;
  label: string;
  submenu?: { path: string; label: string }[];
}

interface LayoutProps {
  children: React.ReactNode;
  activeRoute: string;
  onNavigate: (path: string) => void;
  userRole?: UserRole;
  onLogout?: () => void;
  hideHeader?: boolean; // Hide header for first-time setup
}

const Layout: React.FC<LayoutProps> = ({ children, activeRoute, onNavigate, userRole = 'customer', onLogout, hideHeader = false }) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const isCustomer = userRole === 'customer' || userRole === 'guest';
  const isVendor = userRole === 'vendor';
  const isAdmin = userRole === 'admin';

  const getNavItems = (): NavItem[] => {
    if (isCustomer) {
      return [
        { path: '/', label: 'Trang chủ' },
        { 
          label: 'Sản phẩm',
          submenu: [
            { path: '/shop', label: 'Tất cả sản phẩm' },
            { path: '/shop?category=Full Moon', label: 'Cúng Đầy Tháng' },
            { path: '/shop?category=House Warming', label: 'Cúng Tân Gia' },
            { path: '/shop?category=Grand Opening', label: 'Cúng Khai Trương' },
            { path: '/shop?category=Ancestral', label: 'Cúng Giỗ' },
            { path: '/shop?category=Year End', label: 'Cúng Tết' }
          ]
        },
        { 
          label: 'Dịch vụ',
          submenu: [
            { path: '/services/packages', label: 'Mâm cúng trọn gói' },
            { path: '/services/consultation', label: 'Tư vấn lịch tốt' },
            { path: '/services/delivery', label: 'Giao hàng nhanh' }
          ]
        },
        { path: '/tracking', label: 'Theo dõi' },
      ];
    } else if (isVendor) {
      return [
        { path: '/vendor/dashboard', label: 'Bảng điều khiển' },
        { path: '/vendor/shop', label: 'Cửa hàng' },
      ];
    } else if (isAdmin) {
      return [
        { path: '/admin/dashboard', label: 'Quản lý hệ thống' },
      ];
    }
    return [];
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header - Hidden during first-time setup */}
      {!hideHeader && (
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="cursor-pointer" onClick={() => onNavigate('/')}>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-widest text-primary uppercase leading-none">Modern</span>
                <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase">Ritual</span>
              </div>
            </div>
            <nav className="hidden lg:flex items-center gap-8">
              {getNavItems().map((item) => (
                <div
                  key={item.label}
                  className="relative group"
                  onMouseEnter={() => item.submenu && setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => item.path && onNavigate(item.path)}
                    className={`text-sm font-semibold transition-colors border-b-2 py-1 flex items-center gap-1 ${
                      item.path === activeRoute ? 'text-primary border-primary' : 'text-slate-600 border-transparent hover:text-primary hover:border-primary'
                    }`}
                  >
                    {item.label}
                    {item.submenu && <span className="text-xs">▼</span>}
                  </button>

                  {item.submenu && (
                    <div className={`absolute left-0 top-full mt-0 w-48 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden transition-all duration-200 z-50 ${
                      openDropdown === item.label ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
                    }`}>
                      {item.submenu.map((submenuItem, idx) => (
                        <button
                          key={`${submenuItem.path}-${idx}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate(submenuItem.path);
                            setOpenDropdown(null);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-slate-600 hover:bg-gray-50 hover:text-primary transition-colors border-b border-gray-100 last:border-0"
                        >
                          {submenuItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-primary font-bold">
              <span className="text-sm">1900 8888</span>
            </div>
            <button 
                onClick={() => onNavigate('/profile')}
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-primary font-bold text-sm hover:border-primary transition-all"
                title="Hồ sơ cá nhân"
            >
              <span className="hidden lg:inline">Tài khoản</span>
            </button>
            {isCustomer && (
              <>
                <button 
                    onClick={() => onNavigate('/cart')}
                    className="relative hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-primary font-bold text-sm hover:border-primary transition-all"
                    title="Giỏ hàng"
                >
                  <span className="hidden lg:inline">Giỏ hàng</span>
                  <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">2</span>
                </button>
                <button 
                    onClick={() => onNavigate('/shop')}
                    className="border-2 border-primary text-primary hover:bg-primary/5 rounded-lg px-6 py-2 text-sm font-bold transition-all"
                >
                  Đặt mâm ngay
                </button>
              </>
            )}
            {isVendor && (
              <button 
                  onClick={() => onNavigate('/vendor/dashboard')}
                  className="border-2 border-primary text-primary hover:bg-primary/5 rounded-lg px-6 py-2 text-sm font-bold transition-all"
              >
                Bảng điều khiển
              </button>
            )}
            {isAdmin && (
              <button 
                  onClick={() => onNavigate('/admin/dashboard')}
                  className="border-2 border-primary text-primary hover:bg-primary/5 rounded-lg px-6 py-2 text-sm font-bold transition-all"
              >
                Quản lý
              </button>
            )}
            {onLogout && (
              <button 
                  onClick={() => {
                    console.log('🚪 Logging out...');
                    logoutAndRedirect();
                  }}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all"
                  title="Đăng xuất"
              >
                <span className="hidden lg:inline">Đăng xuất</span>
              </button>
            )}
            {!onLogout && !isCustomer && !isVendor && !isAdmin && (
              <button 
                  onClick={() => onNavigate('/auth')}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-primary text-primary font-bold text-sm hover:bg-primary/5 transition-all"
                  title="Đăng nhập"
              >
                <span className="hidden lg:inline">Đăng nhập</span>
              </button>
            )}
          </div>
        </div>
      </header>
      )}

      <main className={hideHeader ? "flex-grow" : "flex-grow"}>
        {children}
      </main>

      {/* Footer - Hidden during first-time setup */}
      {!hideHeader && (
      <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col">
                <span className="text-base font-black tracking-widest text-primary uppercase leading-none">Modern</span>
                <span className="text-[8px] font-bold tracking-[0.3em] text-gray-400 uppercase">Ritual</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Dịch vụ cung cấp mâm cúng trọn gói. Chúng tôi gìn giữ nét văn hóa tâm linh Việt qua sự tinh tế và chuyên nghiệp.
              </p>
            </div>
            <div>
              <h4 className="text-primary font-black uppercase text-xs mb-6">Dịch vụ</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li className="hover:text-primary cursor-pointer">Cúng Đầy Tháng</li>
                <li className="hover:text-primary cursor-pointer">Cúng Tân Gia</li>
                <li className="hover:text-primary cursor-pointer">Cúng Khai Trương</li>
              </ul>
            </div>
            <div>
              <h4 className="text-primary font-black uppercase text-xs mb-6">Liên hệ</h4>
              <div className="space-y-3 text-sm text-gray-500">
                <p>Quận 1, TP. HCM</p>
                <p>contact@ritual.vn</p>
              </div>
            </div>
            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h5 className="font-bold text-primary mb-2 text-sm uppercase">Tư vấn miễn phí</h5>
                <p className="text-xs text-gray-600 mb-4">Để lại số điện thoại để chuyên gia gọi lại ngay.</p>
                <div className="flex gap-2">
                    <input type="text" placeholder="Số điện thoại" className="flex-1 bg-white border border-gray-300 rounded-lg text-xs px-2 py-1" />
                    <button className="bg-primary text-white px-3 py-1 rounded-lg text-xs font-bold">Gửi</button>
                </div>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© 2024 Modern Ritual Service. Thành tâm - Tín trực.</p>
          </div>
        </div>
      </footer>
      )}
    </div>
  );
};

export default Layout;
