
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { UserRole, AppRoute, getPath } from '../types';
import { getCurrentUser } from '../services/auth';
import { cartService } from '../services/cartService';
import { createTopupLink, getMyWallet, WalletType } from '../services/walletService';
import CartDropdown from './CartDropdown';
import toast from '../services/toast';

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
  const [isWalletDropdownOpen, setIsWalletDropdownOpen] = useState<boolean>(false);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);
  const [topupLoading, setTopupLoading] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const cartDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const accountDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const walletDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTopupReturnHandled = useRef(false);
  const isCustomer = userRole === 'customer' || userRole === 'guest';
  const isVendor = userRole === 'vendor';
  const isAdmin = userRole === 'admin';
  const currentUser = getCurrentUser();
  const hasVendorRole =
    currentUser?.role === 'vendor' ||
    currentUser?.roles?.some((role) => typeof role === 'string' && role.toLowerCase() === 'vendor');

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

  // Detect PayOS return status from URL and notify user.
  useEffect(() => {
    if (isTopupReturnHandled.current) return;

    const params = new URLSearchParams(window.location.search);
    const status = (params.get('status') || '').toUpperCase();
    const isCancelled = params.get('cancel') === 'true' || status === 'CANCELLED';
    const isSuccess = status === 'PAID' || status === 'SUCCESS' || status === 'SUCCEEDED';
    const hasPaymentParams =
      params.has('code') ||
      params.has('id') ||
      params.has('cancel') ||
      params.has('status') ||
      params.has('orderCode');

    if (!hasPaymentParams) return;

    if (isCancelled) {
      toast.error('Nạp tiền đã thất bại.');
    } else if (isSuccess) {
      toast.success('Nạp tiền thành công.');
    }

    // Remove only payment callback params, keep other query params untouched.
    params.delete('code');
    params.delete('id');
    params.delete('cancel');
    params.delete('status');
    params.delete('orderCode');

    const nextQuery = params.toString();
    const nextUrl = `${window.location.pathname}${nextQuery ? `?${nextQuery}` : ''}${window.location.hash || ''}`;
    window.history.replaceState({}, document.title, nextUrl);

    isTopupReturnHandled.current = true;
  }, []);

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

  const handleLogoutClick = async () => {
    const result = await toast.confirm({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản không?',
      icon: 'warning',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    try {
      if (onLogout) {
        await onLogout();
      }
    } catch (error) {
      console.error('❌ Logout failed:', error);
      toast.error('Không thể đăng xuất. Vui lòng thử lại.');
    }
  };

  const resolveWalletType = (): WalletType => {
    if (userRole === 'vendor') return 'Vendor';
    if (userRole === 'admin') return 'System';
    if (userRole === 'customer') return 'Customer';
    if (activeRoute.startsWith('/vendor')) return 'Vendor';
    if (activeRoute.startsWith('/admin')) return 'System';
    return 'Customer';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const parseAmountInput = (value: string): number => {
    return Number(String(value || '').replace(/[^0-9]/g, ''));
  };

  const formatAmountInput = (value: string): string => {
    const amount = parseAmountInput(value);
    if (!Number.isFinite(amount) || amount <= 0) return '';
    return formatCurrency(amount);
  };

  const formatDateTime = (value?: string | null): string => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const mapWalletTypeLabel = (typeValue: WalletType | string | number | undefined): string => {
    if (typeValue === 0 || String(typeValue).toLowerCase() === 'customer') return 'Customer';
    if (typeValue === 1 || String(typeValue).toLowerCase() === 'vendor') return 'Vendor';
    if (typeValue === 2 || String(typeValue).toLowerCase() === 'system') return 'System';
    return String(typeValue ?? 'N/A');
  };

  const normalizeWalletType = (typeValue: WalletType | string | number | undefined): WalletType | null => {
    const normalized = mapWalletTypeLabel(typeValue).toLowerCase();
    if (normalized === 'customer') return 'Customer';
    if (normalized === 'vendor') return 'Vendor';
    if (normalized === 'system') return 'System';
    return null;
  };

  const handleWalletClick = async () => {
    try {
      setWalletLoading(true);
      const walletType = resolveWalletType();
      const wallet = await getMyWallet(walletType);

      const rawBalance = typeof wallet.balance === 'number' ? wallet.balance : 0;
      const heldBalance = typeof wallet.heldBalance === 'number' ? wallet.heldBalance : 0;
      const debt = typeof wallet.debt === 'number' ? wallet.debt : 0;
      const apiWalletType = normalizeWalletType(wallet.type);
      const showHeldBalance = walletType === 'Vendor';
      const showDebt = walletType !== 'Customer';

      if (apiWalletType && apiWalletType !== walletType) {
        toast.warning(`API đang trả về ví ${apiWalletType} trong khi màn hình hiện tại là ${walletType}.`);
      }

      await toast.message({
        title: 'Thông tin ví',
        html: `<div style="text-align:left;line-height:1.8">
          <div><b>Số dư:</b> ${formatCurrency(rawBalance)} VND</div>
          ${showHeldBalance ? `<div><b>Số dư giữ:</b> ${formatCurrency(heldBalance)} VND</div>` : ''}
          ${showDebt ? `<div><b>Công nợ:</b> ${formatCurrency(debt)} VND</div>` : ''}
        </div>`,
        icon: 'info',
        confirmButtonText: 'Đóng',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể lấy thông tin ví.';
      toast.error(message);
    } finally {
      setWalletLoading(false);
    }
  };

  const extractTopupUrl = (data: Record<string, unknown>): string | null => {
    const keys = ['checkoutUrl', 'paymentLink', 'payUrl', 'url', 'link'];
    for (const key of keys) {
      const value = data[key];
      if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
        return value;
      }
    }
    return null;
  };

  const handleTopupClick = async () => {
    const walletType = resolveWalletType();
    if (walletType !== 'Customer') {
      toast.warning('Chức năng nạp tiền hiện chỉ hỗ trợ cho ví khách hàng.');
      return;
    }

    const promptResult = await Swal.fire({
      title: 'Nạp tiền vào ví',
      text: 'Nhập số tiền cần nạp (VND)',
      input: 'text',
      inputValue: formatCurrency(100000),
      inputAttributes: {
        inputmode: 'numeric',
        autocomplete: 'off',
      },
      didOpen: () => {
        const input = Swal.getInput() as HTMLInputElement | null;
        if (!input) return;

        input.value = formatAmountInput(input.value) || input.value;
        input.addEventListener('input', () => {
          input.value = formatAmountInput(input.value);
        });
      },
      showCancelButton: true,
      confirmButtonText: 'Tạo link nạp tiền',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#8B4513',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3',
      },
      inputValidator: (value) => {
        const normalized = parseAmountInput(String(value || ''));
        if (!Number.isFinite(normalized) || normalized <= 0) {
          return 'Vui lòng nhập số tiền hợp lệ.';
        }
        return undefined;
      },
    });

    if (!promptResult.isConfirmed) return;

    const amount = parseAmountInput(String(promptResult.value || ''));
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Số tiền không hợp lệ.');
      return;
    }

    try {
      setTopupLoading(true);
      const result = await createTopupLink(amount, walletType);
      const resultData = result as Record<string, unknown>;
      const paymentUrl = extractTopupUrl(resultData);

      if (!paymentUrl) {
        toast.error('Không nhận được link thanh toán từ hệ thống.');
        return;
      }

      setIsWalletDropdownOpen(false);
      window.location.href = paymentUrl;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo link nạp tiền.';
      toast.error(message);
    } finally {
      setTopupLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {!hideHeader && isCustomer && activeRoute === '/' && hasVendorRole && (
        <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-b border-amber-100">
          <div className="max-w-7xl mx-auto px-6 md:px-10 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2 text-amber-800">
              <span className="text-sm font-semibold tracking-wide">Tài khoản của bạn có quyền Người Bán</span>
            </div>
            <button
              onClick={() => onNavigate('/vendor/dashboard')}
              className="inline-flex items-center justify-center rounded-full border border-amber-300 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 hover:bg-amber-100 transition-all"
            >
              Đi Đến Kênh Người Bán
            </button>
          </div>
        </div>
      )}

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
                      className={`text-sm font-semibold transition-colors border-b-2 py-1 flex items-center gap-1 ${item.path === activeRoute ? 'text-primary border-primary' : 'text-slate-600 border-transparent hover:text-primary hover:border-primary'
                        }`}
                    >
                      {item.label}
                      {item.submenu && <span className="text-xs">▼</span>}
                    </button>

                    {item.submenu && (
                      <div className={`absolute left-0 top-full mt-0 w-48 bg-white border border-gray-200 shadow-lg rounded-lg overflow-hidden transition-all duration-200 z-50 ${openDropdown === item.label ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
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

              {(userName || onLogout) && (
                <div
                  className="relative hidden md:block"
                  onMouseEnter={() => {
                    if (walletDropdownTimeout.current) {
                      clearTimeout(walletDropdownTimeout.current);
                    }
                    setIsWalletDropdownOpen(true);
                  }}
                  onMouseLeave={() => {
                    walletDropdownTimeout.current = setTimeout(() => {
                      setIsWalletDropdownOpen(false);
                    }, 200);
                  }}
                >
                  <button
                    onClick={handleWalletClick}
                    disabled={walletLoading || topupLoading}
                    className="flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 text-primary hover:border-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Ví của tôi"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 7C3 5.34315 4.34315 4 6 4H19C20.1046 4 21 4.89543 21 6V8H17.5C15.567 8 14 9.567 14 11.5C14 13.433 15.567 15 17.5 15H21V17C21 18.6569 19.6569 20 18 20H6C4.34315 20 3 18.6569 3 17V7ZM17.5 10C16.6716 10 16 10.6716 16 11.5C16 12.3284 16.6716 13 17.5 13H22V10H17.5ZM6 6C5.44772 6 5 6.44772 5 7V7.2C5.31304 7.07116 5.65584 7 6 7H19V6H6Z" />
                    </svg>
                  </button>

                  {isWalletDropdownOpen && (
                    <div
                      className="absolute top-full right-0 mt-0 w-44 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                      onMouseEnter={() => {
                        if (walletDropdownTimeout.current) {
                          clearTimeout(walletDropdownTimeout.current);
                        }
                      }}
                    >
                      {resolveWalletType() === 'Customer' && (
                        <button
                          onClick={async () => {
                            await handleTopupClick();
                          }}
                          disabled={topupLoading || walletLoading}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11 17h2v-5h3l-4-5-4 5h3v5zm-7 2v2h16v-2H4z" />
                          </svg>
                          {topupLoading ? 'Đang tạo link...' : 'Nạp tiền'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Account Dropdown */}
              {userName && (
                <div
                  className="relative hidden md:block"
                  onMouseEnter={() => {
                    if (accountDropdownTimeout.current) {
                      clearTimeout(accountDropdownTimeout.current);
                    }
                    setIsAccountDropdownOpen(true);
                  }}
                  onMouseLeave={() => {
                    accountDropdownTimeout.current = setTimeout(() => {
                      setIsAccountDropdownOpen(false);
                    }, 200);
                  }}
                >
                  <button
                    onClick={() => isCustomer ? onNavigate('/profile') : setIsAccountDropdownOpen(prev => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-primary font-bold text-sm hover:border-primary transition-all"
                    title={isCustomer ? 'Hồ sơ cá nhân' : userName}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    <span className="hidden lg:inline max-w-[120px] truncate">{userName}</span>
                  </button>

                  {/* Dropdown Menu */}
                  {isAccountDropdownOpen && (
                    <div
                      className="absolute top-full right-0 mt-0 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-slideDown"
                      onMouseEnter={() => {
                        if (accountDropdownTimeout.current) {
                          clearTimeout(accountDropdownTimeout.current);
                        }
                      }}
                    >
                      {!isVendor && (
                        <button
                          onClick={() => {
                            onNavigate('/profile');
                            setIsAccountDropdownOpen(false);
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                          Hồ sơ cá nhân
                        </button>
                      )}
                      {isCustomer && (
                        <>
                          <button
                            onClick={() => {
                              onNavigate('/profile/orders');
                              setIsAccountDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M13 12h7v1.5h-7zm0-2.5h7V11h-7zm0 5h7V16h-7zM21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15h-9V6h9v13z" />
                            </svg>
                            Đơn hàng của tôi
                          </button>
                          <button
                            onClick={() => {
                              onNavigate('/tracking');
                              setIsAccountDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                            Theo dõi đơn hàng
                          </button>
                        </>
                      )}
                      {onLogout && (
                        <button
                          onClick={async () => {
                            setIsAccountDropdownOpen(false);
                            await handleLogoutClick();
                          }}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3 border-t border-gray-100"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
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
                    onMouseEnter={() => {
                      if (cartDropdownTimeout.current) {
                        clearTimeout(cartDropdownTimeout.current);
                      }
                      setIsCartDropdownOpen(true);
                    }}
                    onMouseLeave={() => {
                      cartDropdownTimeout.current = setTimeout(() => {
                        setIsCartDropdownOpen(false);
                      }, 200);
                    }}
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
                        <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
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
