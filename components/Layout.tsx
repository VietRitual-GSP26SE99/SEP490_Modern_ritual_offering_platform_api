
import React, { useState, useEffect } from 'react';
import { UserRole, AppRoute, getPath } from '../types';
import { logoutAndRedirect, getCurrentUser } from '../services/auth';
import { cartService } from '../services/cartService';
import CartDropdown from './CartDropdown';

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
  const [cartCount, setCartCount] = useState<number>(0);
  const [isCartDropdownOpen, setIsCartDropdownOpen] = useState<boolean>(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const isCustomer = userRole === 'customer' || userRole === 'guest';
  const isVendor = userRole === 'vendor';
  const isAdmin = userRole === 'admin';

  // Fetch user info
  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserName(user.name || user.email?.split('@')[0] || 'Người dùng');
    }
  }, [activeRoute]);

  // Fetch cart count
  useEffect(() => {
    const fetchCartCount = async () => {
      if (!isCustomer) return;
      
      const user = getCurrentUser();
      if (!user) return;

      try {
        const cart = await cartService.getCart();
        if (cart && cart.cartItems) {
          const totalItems = cart.cartItems.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(totalItems);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error('❌ Failed to fetch cart count:', error);
      }
    };

    fetchCartCount();

    // Listen for cart update events
    const handleCartUpdate = () => {
      console.log('🔄 Cart updated, refreshing count...');
      fetchCartCount();
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);

    // Refresh cart count every 30 seconds
    const interval = setInterval(fetchCartCount, 30000);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      clearInterval(interval);
    };
  }, [isCustomer, activeRoute]); // Re-fetch when route changes

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
            
            {/* Account Dropdown */}
            {userName && (
              <div 
                className="relative hidden md:block"
                onMouseEnter={() => setIsAccountDropdownOpen(true)}
                onMouseLeave={() => setIsAccountDropdownOpen(false)}
              >
                <button 
                    onClick={() => onNavigate('/profile')}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-primary font-bold text-sm hover:border-primary transition-all"
                    title="Hồ sơ cá nhân"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                  <span className="hidden lg:inline max-w-[120px] truncate">{userName}</span>
                </button>
                
                {/* Dropdown Menu */}
                {isAccountDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slideDown">
                    <button
                      onClick={() => {
                        onNavigate('/profile');
                        setIsAccountDropdownOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                      Hồ sơ cá nhân
                    </button>
                    {isCustomer && (
                      <button
                        onClick={() => {
                          onNavigate('/tracking');
                          setIsAccountDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                        </svg>
                        Theo dõi đơn hàng
                      </button>
                    )}
                    {onLogout && (
                      <button
                        onClick={() => {
                          logoutAndRedirect();
                          setIsAccountDropdownOpen(false);
                        }}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 border-t border-gray-100"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
                        </svg>
                        Đăng xuất
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            {isCustomer && (
              <>
                {/* Cart with Dropdown */}
                <div 
                  className="relative hidden md:block"
                  onMouseEnter={() => setIsCartDropdownOpen(true)}
                  onMouseLeave={() => setIsCartDropdownOpen(false)}
                >
                  <button 
                      onClick={() => onNavigate('/cart')}
                      className="relative flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-primary font-bold text-sm hover:border-primary transition-all"
                      title="Giỏ hàng"
                  >
                    <svg 
                      className="w-5 h-5" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/>
                    </svg>
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount > 99 ? '99+' : cartCount}
                      </span>
                    )}
                  </button>
                  <CartDropdown 
                    isOpen={isCartDropdownOpen}
                    onClose={() => setIsCartDropdownOpen(false)}
                    onNavigateToCart={() => onNavigate('/cart')}
                    onNavigateToShop={() => onNavigate('/shop')}
                  />
                </div>
                {/* Call to Action Button */}
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
            {!onLogout && !userName && (
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
