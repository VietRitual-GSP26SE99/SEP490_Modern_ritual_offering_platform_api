
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Swal from 'sweetalert2';
import { UserRole, AppRoute, getPath } from '../types';
import { getCurrentUser } from '../services/auth';
import { cartService } from '../services/cartService';
import { fetchNotifications, fetchUnreadNotificationCount, NotificationItem, markAllNotificationsAsReadApi, markNotificationAsRead } from '../services/notificationService';
import { createTopupLink, createWithdrawal, getMyWallet, getMyWithdrawalRequests, WalletInfo, WalletType } from '../services/walletService';
import { packageService } from '../services/packageService';
import { CeremonyCategory } from '../types';
import CartDropdown from './CartDropdown';
import toast from '../services/toast';
import headerLogo from '../assets/logo1.png';

const PENDING_CHECKOUT_KEY = 'pendingCheckoutRequest';
const TOPUP_SUCCESS_TOAST_KEY = 'checkoutTopupSuccessToast';
const TOPUP_CANCEL_TOAST_KEY = 'checkoutTopupCancelToast';

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
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [notificationLoading, setNotificationLoading] = useState<boolean>(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [walletLoading, setWalletLoading] = useState<boolean>(false);
  const [topupLoading, setTopupLoading] = useState<boolean>(false);
  const [withdrawLoading, setWithdrawLoading] = useState<boolean>(false);
  const [withdrawalHistoryLoading, setWithdrawalHistoryLoading] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [categories, setCategories] = useState<CeremonyCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await packageService.getCeremonyCategories();
        setCategories(data.filter(c => c.isActive));
      } catch (error) {
        console.error('❌ Failed to fetch categories for menu:', error);
      }
    };
    fetchCategories();
  }, []);
  const cartDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const accountDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const walletDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const notificationDropdownTimeout = useRef<NodeJS.Timeout | null>(null);
  const isTopupReturnHandled = useRef(false);
  const isCustomer = userRole === 'customer' || userRole === 'guest';
  const isVendor = userRole === 'vendor';
  const isAdmin = userRole === 'admin';
  const isStaff = userRole === 'staff';
  const hideWalletAndProfileOnAdminDashboard = false;
  const currentUser = getCurrentUser();
  const hasVendorRole =
    currentUser?.role === 'vendor' ||
    currentUser?.roles?.some((role) => typeof role === 'string' && role.toLowerCase() === 'vendor');
  const hasStaffRole =
    currentUser?.role === 'staff' ||
    currentUser?.roles?.some((role) => typeof role === 'string' && role.toLowerCase() === 'staff');
  const hasAdminRole =
    currentUser?.role === 'admin' ||
    currentUser?.roles?.some((role) => typeof role === 'string' && role.toLowerCase() === 'admin');

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadNotificationCount(0);
  };

  const loadNotifications = async () => {
    try {
      setNotificationLoading(true);
      const data = await fetchNotifications(1, 20);
      setNotifications(data.items);
      setUnreadNotificationCount(data.items.filter((item) => !item.isRead).length);
    } catch (error) {
      console.error('❌ Failed to fetch notifications:', error);
    } finally {
      setNotificationLoading(false);
    }
  };

  const resolveNotificationRedirectPath = (item: NotificationItem): string => {
    const rawUrl = item.redirectUrl;
    const title = (item.title || '').toLowerCase();
    const message = (item.message || '').toLowerCase();

    // 1. Đăng ký Vendor -> chuyển hướng về tab tương ứng trong profile (cho User) hoặc trang Duyệt Vendor (cho Staff)
    if (title.includes('đăng ký vendor') || message.includes('đăng ký vendor') || (rawUrl && rawUrl.includes('vendor/registration'))) {
      if (isStaff || hasStaffRole) return '/staff-vendors';
      return '/profile?tab=vendor-register';
    }

    // 2. Logic dành riêng cho Staff
    if (isStaff || hasStaffRole) {
      if (title.includes('sản phẩm') && (title.includes('duyệt') || message.includes('duyệt'))) {
        return '/staff-product';
      }
      if (title.includes('vendor') && (title.includes('duyệt') || message.includes('duyệt'))) {
        return '/staff-vendors';
      }
    }

    // 3. Logic dành riêng cho Admin
    if (isAdmin || hasAdminRole) {
      // Rút tiền -> tab withdrawals
      if (title.includes('rút tiền') || message.includes('rút tiền')) {
        return '/admin/dashboard?tab=withdrawals';
      }
      // Hoàn tiền hoặc Hủy đơn -> tab disputes (trong AdminDashboard tab disputes xử lý refund)
      if (title.includes('hoàn tiền') || message.includes('hoàn tiền') || title.includes('hủy đơn') || message.includes('hủy đơn')) {
        return '/admin/dashboard?tab=disputes';
      }
      // Duyệt Vendor cho Admin
      if (title.includes('vendor') && (title.includes('duyệt') || message.includes('duyệt'))) {
        return '/admin/dashboard?tab=vendors';
      }
    }

    // 2. Logic dành riêng cho Vendor
    if (hasVendorRole) {
      // Hoàn tiền hoặc Hủy đơn -> tab refunds
      if (title.includes('hoàn tiền') || message.includes('hoàn tiền') || title.includes('hủy đơn') || message.includes('hủy đơn')) {
        return '/vendor/orders?tab=refunds';
      }

      // Nạp rút / Giao dịch ví -> trang giao dịch
      if (title.includes('quyết toán') || title.includes('ví') || title.includes('rút tiền') || title.includes('nạp tiền') || message.includes('rút tiền') || message.includes('nạp tiền')) {
        return '/vendor/transactions';
      }

      // 4. Sản phẩm -> trang sản phẩm
      if (title.includes('sản phẩm')) {
        return '/vendor/products';
      }

      // 5. Đơn hàng mới (Vendor) - Cố gắng trích xuất OrderID từ nội dung (ví dụ: #abc123)
      if (title.includes('đơn hàng')) {
        const orderIdMatch = message.match(/#([a-zA-Z0-9]+)/);
        if (orderIdMatch) {
          return `/vendor/orders?orderId=${encodeURIComponent(orderIdMatch[1])}`;
        }
        return '/vendor/orders';
      }
    }

    // 3. Fallback cho các trường hợp khác (Customer/Admin/Staff)
    if (title.includes('quyết toán') || title.includes('ví') || message.includes('quyết toán')) {
      return '/wallet/transactions';
    }

    // 4. Các trường hợp khác nếu có redirectUrl (như backend gửi)
    if (!rawUrl) return '';

    const trimmed = rawUrl.trim();
    if (!trimmed) return '';

    // External link: keep nguyên
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // Backend trả /orders/{id} => map sang route thực của app
    const orderMatch = trimmed.match(/^\/orders\/([^/?#]+)/i);
    if (orderMatch) {
      const orderId = orderMatch[1];
      if (isCustomer) {
        return `/profile/orders/${orderId}`;
      }
      if (isVendor) {
        // Vendor hiện tại có route danh sách /vendor/orders, truyền orderId qua query để page xử lý nếu cần
        return `/vendor/orders?orderId=${encodeURIComponent(orderId)}`;
      }
    }

    // Các path nội bộ khác: trả về như backend gửi
    return trimmed;
  };

  useEffect(() => {
    const loadUnreadCount = async () => {
      try {
        const count = await fetchUnreadNotificationCount();
        setUnreadNotificationCount(count);
      } catch (error) {
        console.error('❌ Failed to fetch unread notification count:', error);
      }
    };

    if (userName && !hideWalletAndProfileOnAdminDashboard) {
      loadUnreadCount();
    }
  }, [userName, hideWalletAndProfileOnAdminDashboard]);

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
  useLayoutEffect(() => {
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

    const pendingRaw = sessionStorage.getItem(PENDING_CHECKOUT_KEY);
    let pendingCheckoutReturnPath: string | null = null;
    if (pendingRaw) {
      try {
        const pendingData = JSON.parse(pendingRaw) as { returnPath?: string };
        if (typeof pendingData?.returnPath === 'string' && pendingData.returnPath.length > 0) {
          pendingCheckoutReturnPath = pendingData.returnPath;
        }
      } catch (error) {
      }
    }

    if (isCancelled) {
      if (pendingCheckoutReturnPath) {
        sessionStorage.setItem(TOPUP_CANCEL_TOAST_KEY, '1');
        sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
        isTopupReturnHandled.current = true;
        window.location.replace(pendingCheckoutReturnPath);
        return;
      }
      toast.error('Nạp tiền đã thất bại.');
    } else if (isSuccess) {
      if (pendingCheckoutReturnPath) {
        sessionStorage.setItem(TOPUP_SUCCESS_TOAST_KEY, '1');
        sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
        isTopupReturnHandled.current = true;
        window.location.replace(pendingCheckoutReturnPath);
        return;
      }
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

  useEffect(() => {
    const styleId = 'vendor-withdrawal-history-swal-style';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .vendor-withdrawal-history-popup { border-radius: 16px; }
      .vendor-withdrawal-history-container { margin: 0; padding-top: 8px; }
      .vendor-withdrawal-history-container .wdh-wrap { text-align:left; }
      .vendor-withdrawal-history-container .wdh-summary { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:10px; margin-bottom:12px; }
      .vendor-withdrawal-history-container .wdh-summary-item { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px; }
      .vendor-withdrawal-history-container .wdh-summary-label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.05em; font-weight:700; margin-bottom:4px; }
      .vendor-withdrawal-history-container .wdh-summary-value { font-size:16px; color:#0f172a; font-weight:800; }
      .vendor-withdrawal-history-container .wdh-list { max-height:58vh; overflow:auto; padding-right:4px; }
      .vendor-withdrawal-history-container .wdh-card { border:1px solid #e2e8f0; background:#fff; border-radius:14px; padding:12px; margin-bottom:10px; }
      .vendor-withdrawal-history-container .wdh-top-row { display:flex; justify-content:space-between; gap:12px; align-items:flex-start; }
      .vendor-withdrawal-history-container .wdh-left-meta { display:flex; gap:10px; align-items:flex-start; min-width:0; }
      .vendor-withdrawal-history-container .wdh-index { min-width:30px; height:30px; border-radius:999px; background:#f1f5f9; color:#334155; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:12px; }
      .vendor-withdrawal-history-container .wdh-holder { font-size:13px; font-weight:800; color:#0f172a; word-break:break-word; }
      .vendor-withdrawal-history-container .wdh-bank { margin-top:3px; font-size:12px; color:#475569; }
      .vendor-withdrawal-history-container .wdh-amount { font-size:20px; font-weight:900; color:#0f172a; white-space:nowrap; }
      .vendor-withdrawal-history-container .wdh-status-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:10px; }
      .vendor-withdrawal-history-container .wdh-chip { display:inline-block; padding:5px 10px; border-radius:999px; font-size:12px; font-weight:700; }
      .vendor-withdrawal-history-container .wdh-grid { margin-top:10px; display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; }
      .vendor-withdrawal-history-container .wdh-label { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:.04em; font-weight:700; margin-bottom:3px; }
      .vendor-withdrawal-history-container .wdh-value { font-size:13px; color:#334155; font-weight:600; word-break:break-word; }
      @media (max-width: 860px) {
        .vendor-withdrawal-history-container .wdh-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .vendor-withdrawal-history-container .wdh-grid { grid-template-columns: 1fr; }
        .vendor-withdrawal-history-container .wdh-amount { font-size:18px; }
      }
    `;

    document.head.appendChild(style);
  }, []);

  const getNavItems = (): NavItem[] => {
    if (isCustomer) {
      return [
        { path: '/', label: 'Trang chủ' },
        {
          label: 'Sản phẩm',
          submenu: [
            { path: '/shop', label: 'Tất cả sản phẩm' },
            ...(categories.length > 0
              ? categories.map(cat => ({
                path: `/shop?category=${encodeURIComponent(cat.name)}`,
                label: cat.name
              }))
              : [
                { path: '/shop?category=Full Moon', label: 'Cúng Đầy Tháng' },
                { path: '/shop?category=House Warming', label: 'Cúng Tân Gia' },
                { path: '/shop?category=Grand Opening', label: 'Cúng Khai Trương' },
                { path: '/shop?category=Ancestral', label: 'Cúng Giỗ' },
                { path: '/shop?category=Year End', label: 'Cúng Tết' }
              ])
          ]
        },

        // { path: '/tracking', label: 'Theo dõi' },
      ];
    } else if (isVendor) {
      return [
        { path: '/vendor/dashboard', label: 'Bảng điều khiển' },
        { path: '/vendor/transactions', label: 'Giao dịch' },
        { path: '/vendor/shop', label: 'Cửa hàng' },
      ];
    } else if (isAdmin) {
      return [
        { path: '/admin/dashboard', label: 'Quản lý hệ thống' },

      ];
    } else if (isStaff) {
      return [
        { path: '/staff/dashboard', label: 'Bảng điều khiển' },
      ];
    }
    return [];
  };

  const getSidebarItems = (): { id: string; label: string; icon: string; path: string }[] => {
    if (isStaff) {
      return [
        { id: 'overview', label: 'Tổng quan', icon: 'dashboard', path: '/staff/dashboard' },
        { id: 'customers', label: 'Khách hàng', icon: 'group', path: '/staff-customers' },
        { id: 'vendors', label: 'Duyệt Vendor', icon: 'verified_user', path: '/staff-vendors' },
        { id: 'products', label: 'Quản lý Sản phẩm', icon: 'inventory_2', path: '/staff-product' },
        { id: 'transactions', label: 'Giao dịch', icon: 'account_balance_wallet', path: '/staff-transactions' },
        { id: 'refunds', label: 'Hoàn tiền', icon: 'assignment_return', path: '/staff-refunds' },
        { id: 'banners', label: 'Quản lý Banner', icon: 'view_carousel', path: '/staff-banners' },
        { id: 'audit', label: 'Nhật ký hệ thống', icon: 'history_edu', path: '/staff-audit-logs' },
        { id: 'settings', label: 'Cài đặt hệ thống', icon: 'settings_suggest', path: '/staff-settings' },
      ];
    }
    if (isVendor) {
      return [
        { id: 'overview', label: 'Bảng điều khiển', icon: 'dashboard', path: '/vendor/dashboard' },
        { id: 'orders', label: 'Đơn hàng', icon: 'shopping_cart', path: '/vendor/orders' },
        { id: 'products', label: 'Sản phẩm', icon: 'inventory_2', path: '/vendor/products' },
        { id: 'analytics', label: 'Phân tích', icon: 'analytics', path: '/vendor/analytics' },
        { id: 'shipping', label: 'Vận chuyển', icon: 'local_shipping', path: '/vendor/shipping' },
        { id: 'transactions', label: 'Giao dịch', icon: 'receipt_long', path: '/vendor/transactions' },
        { id: 'shop', label: 'Cửa hàng', icon: 'store', path: '/vendor/shop' },
        { id: 'settings', label: 'Cài đặt', icon: 'settings', path: '/vendor/settings' },
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

  const handleNavigateToCart = () => {
    const user = getCurrentUser();
    if (!user) {
      toast.warning('Vui lòng đăng nhập để vào giỏ hàng');
      return;
    }

    onNavigate('/cart');
  };

  const handleNavigateToTracking = () => {
    const user = getCurrentUser();
    if (!user) {
      toast.warning('Vui lòng đăng nhập để theo dõi đơn hàng');
      return;
    }

    onNavigate('/tracking');
  };

  const handleMainNavClick = (path: string) => {
    if (path === '/tracking') {
      handleNavigateToTracking();
      return;
    }

    onNavigate(path);
  };

  const resolveWalletType = (): WalletType => {
    if (activeRoute.startsWith('/vendor')) return 'Vendor';
    if (activeRoute.startsWith('/admin')) return 'System';
    if (activeRoute.startsWith('/staff')) return 'System';
    if (userRole === 'vendor') return 'Vendor';
    if (userRole === 'customer' || userRole === 'guest') return 'Customer';
    if (userRole === 'admin') return 'System';

    const normalizedRoles = (currentUser?.roles || []).map((role) => String(role).toLowerCase());
    if (normalizedRoles.includes('vendor')) return 'Vendor';
    if (normalizedRoles.includes('customer')) return 'Customer';

    return 'Customer';
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const toSafeNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') {
      const normalized = value.replace(/,/g, '').trim();
      const parsed = Number(normalized);
      if (Number.isFinite(parsed)) return parsed;
    }
    return 0;
  };

  const getWalletAmount = (
    wallet: WalletInfo | null,
    field: 'balance' | 'heldBalance' | 'debt'
  ): number => {
    if (!wallet) return 0;

    const keyMap: Record<'balance' | 'heldBalance' | 'debt', string[]> = {
      balance: ['Balance', 'balance', 'availableBalance', 'AvailableBalance'],
      heldBalance: ['HeldBalance', 'heldBalance'],
      debt: ['Debt', 'debt'],
    };

    for (const key of keyMap[field]) {
      if (Object.prototype.hasOwnProperty.call(wallet, key)) {
        const candidate = wallet[key as keyof WalletInfo];
        return toSafeNumber(candidate);
      }
    }

    return 0;
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

  const escapeHtml = (value: unknown): string => {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  };

  const getDisplayWithdrawalStatus = (status: string): string => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized.includes('approved') || normalized.includes('đã duyệt') || normalized.includes('completed')) return 'Đã duyệt';
    if (normalized.includes('pending') || normalized.includes('chờ duyệt')) return 'Chờ duyệt';
    if (normalized.includes('rejected') || normalized.includes('từ chối')) return 'Đã từ chối';
    if (normalized.includes('processing') || normalized.includes('đang xử lý')) return 'Đang xử lý';
    return status || 'Không xác định';
  };

  const getWithdrawalStatusStyle = (status: string): string => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized.includes('approved') || normalized.includes('đã duyệt') || normalized.includes('completed')) return 'background:#dcfce7;color:#166534;';
    if (normalized.includes('rejected') || normalized.includes('từ chối')) return 'background:#fee2e2;color:#b91c1c;';
    if (normalized.includes('processing') || normalized.includes('đang xử lý')) return 'background:#dbeafe;color:#1d4ed8;';
    return 'background:#fef3c7;color:#a16207;';
  };

  const getTransactionStatusStyle = (status: string): string => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized.includes('success') || normalized.includes('thành công')) return 'background:#dcfce7;color:#166534;';
    if (normalized.includes('fail') || normalized.includes('error') || normalized.includes('thất bại')) return 'background:#fee2e2;color:#b91c1c;';
    if (normalized.includes('pending') || normalized.includes('processing')) return 'background:#fef3c7;color:#a16207;';
    return 'background:#e2e8f0;color:#334155;';
  };

  const getDisplayTransactionStatus = (status: string): string => {
    const normalized = String(status || '').trim().toLowerCase();
    if (normalized.includes('success')) return 'Thành công';
    if (normalized.includes('fail') || normalized.includes('error')) return 'Thất bại';
    if (normalized.includes('pending')) return 'Chờ xử lý';
    if (normalized.includes('processing')) return 'Đang xử lý';
    if (!normalized || normalized === 'n/a' || normalized === 'không có') return 'Không có';
    return status;
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

  const fetchWalletBalance = async () => {
    const buildCandidateTypes = (primary: WalletType): WalletType[] => {
      if (primary === 'System') return ['System', 'Vendor', 'Customer'];
      return [primary];
    };

    const isNotFoundWalletError = (error: unknown): boolean => {
      if (!(error instanceof Error)) return false;
      const message = error.message.toLowerCase();
      return message.includes('không tìm thấy ví') || message.includes('404');
    };

    try {
      setWalletLoading(true);
      const primaryType = resolveWalletType();
      const candidateTypes = buildCandidateTypes(primaryType);

      let lastError: unknown = null;
      for (let index = 0; index < candidateTypes.length; index += 1) {
        const candidate = candidateTypes[index];
        try {
          const wallet = await getMyWallet(candidate);
          setWalletInfo(wallet);
          return;
        } catch (error) {
          lastError = error;
          const shouldTryNext = isNotFoundWalletError(error) && index < candidateTypes.length - 1;
          if (!shouldTryNext) {
            throw error;
          }
        }
      }

      if (lastError) {
        throw lastError;
      }
    } catch (error) {
      console.error('❌ Failed to fetch wallet:', error);
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (isWalletDropdownOpen && !walletInfo) {
      fetchWalletBalance();
    }
  }, [isWalletDropdownOpen, walletInfo]);

  const handleWalletClick = async () => {
    await fetchWalletBalance();
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

  const handleWithdrawClick = async () => {
    if (currentWalletType !== 'Vendor') {
      toast.warning('Chức năng rút tiền chỉ áp dụng cho ví người bán.');
      return;
    }

    const modalResult = await Swal.fire({
      title: 'Yêu cầu rút tiền',
      html: `
        <div style="display:flex;flex-direction:column;gap:12px;text-align:left;">
          <div>
            <label for="withdraw-amount" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Số tiền rút (VND)</label>
            <input id="withdraw-amount" class="swal2-input" style="margin:0;width:100%;" placeholder="Ví dụ: 100,000" inputmode="numeric" autocomplete="off" />
          </div>
          <div>
            <label for="withdraw-bank-name" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Tên ngân hàng</label>
            <input id="withdraw-bank-name" class="swal2-input" style="margin:0;width:100%;" placeholder="Ví dụ: Vietcombank" autocomplete="off" />
          </div>
          <div>
            <label for="withdraw-account-number" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Số tài khoản</label>
            <input id="withdraw-account-number" class="swal2-input" style="margin:0;width:100%;" placeholder="Nhập số tài khoản" autocomplete="off" />
          </div>
          <div>
            <label for="withdraw-account-holder" style="display:block;font-size:13px;font-weight:600;margin-bottom:6px;">Chủ tài khoản</label>
            <input id="withdraw-account-holder" class="swal2-input" style="margin:0;width:100%;" placeholder="Họ tên chủ tài khoản" autocomplete="off" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Gửi yêu cầu',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#b45309',
      cancelButtonColor: '#64748b',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'rounded-lg font-bold px-6 py-3',
        cancelButton: 'rounded-lg font-bold px-6 py-3',
      },
      didOpen: () => {
        const amountInput = document.getElementById('withdraw-amount') as HTMLInputElement | null;
        if (!amountInput) return;

        amountInput.addEventListener('input', () => {
          amountInput.value = formatAmountInput(amountInput.value);
        });
      },
      preConfirm: () => {
        const amountInput = (document.getElementById('withdraw-amount') as HTMLInputElement | null)?.value || '';
        const bankName = (document.getElementById('withdraw-bank-name') as HTMLInputElement | null)?.value?.trim() || '';
        const accountNumberRaw = (document.getElementById('withdraw-account-number') as HTMLInputElement | null)?.value?.trim() || '';
        const accountHolderRaw = (document.getElementById('withdraw-account-holder') as HTMLInputElement | null)?.value?.trim() || '';

        const amount = parseAmountInput(amountInput);
        const accountNumber = accountNumberRaw.replace(/\s+/g, '');
        const accountHolder = accountHolderRaw.replace(/\s+/g, ' ').trim();

        if (!Number.isFinite(amount) || amount <= 0) {
          Swal.showValidationMessage('Vui lòng nhập số tiền rút hợp lệ.');
          return null;
        }

        if (amount > availableBalance) {
          Swal.showValidationMessage('Số tiền rút vượt quá số dư khả dụng.');
          return null;
        }

        if (!bankName) {
          Swal.showValidationMessage('Vui lòng nhập tên ngân hàng.');
          return null;
        }

        if (!accountNumber) {
          Swal.showValidationMessage('Vui lòng nhập số tài khoản.');
          return null;
        }

        if (!accountHolder) {
          Swal.showValidationMessage('Vui lòng nhập tên chủ tài khoản.');
          return null;
        }

        return { amount, bankName, accountNumber, accountHolder };
      },
    });

    if (!modalResult.isConfirmed || !modalResult.value) return;

    try {
      setWithdrawLoading(true);
      await createWithdrawal({ ...modalResult.value, type: currentWalletType });
      toast.success('Đã gửi yêu cầu rút tiền thành công.');
      await fetchWalletBalance();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể gửi yêu cầu rút tiền.';
      toast.error(message);
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handleWithdrawalHistoryClick = async () => {
    if (currentWalletType !== 'Vendor') {
      toast.warning('Chức năng lịch sử rút tiền chỉ áp dụng cho ví người bán.');
      return;
    }

    try {
      setWithdrawalHistoryLoading(true);
      const historyItems = await getMyWithdrawalRequests();

      const toTimestamp = (value: string): number => {
        const timestamp = new Date(value).getTime();
        return Number.isNaN(timestamp) ? 0 : timestamp;
      };

      const sortedItems = [...historyItems].sort(
        (a, b) => toTimestamp(b.requestedAt) - toTimestamp(a.requestedAt),
      );

      const summary = sortedItems.reduce(
        (acc, item) => {
          const status = String(item.status || '').toLowerCase();
          acc.total += 1;
          acc.amount += Number(item.amount || 0);

          if (status.includes('approved') || status.includes('đã duyệt') || status.includes('completed')) {
            acc.approved += 1;
          } else if (status.includes('rejected') || status.includes('từ chối')) {
            acc.rejected += 1;
          } else {
            acc.pending += 1;
          }

          return acc;
        },
        { total: 0, amount: 0, approved: 0, rejected: 0, pending: 0 },
      );

      const cardsHtml = sortedItems.map((item, index) => {
        const raw = (item.raw || {}) as Record<string, unknown>;
        const transaction = (raw.transaction || raw.Transaction || {}) as Record<string, unknown>;
        const txId = String(transaction.transactionId || transaction.TransactionId || 'N/A');
        const txStatusRaw = String(transaction.status || transaction.Status || 'N/A');
        const txStatus = txStatusRaw === 'N/A' ? 'Không có' : txStatusRaw;
        const txStatusDisplay = getDisplayTransactionStatus(txStatus);
        const accountHolder = String(raw.accountHolder || raw.AccountHolder || 'Không có').trim();
        const rejectionReason = String(raw.rejectionReason || raw.RejectionReason || '').trim();

        const requestedAtText = formatDateTime(item.requestedAt);
        const processedAtText = formatDateTime(String(raw.processedDate || raw.ProcessedDate || ''));

        return `
          <div class="wdh-card">
            <div class="wdh-top-row">
              <div class="wdh-left-meta">
                <div class="wdh-index">#${index + 1}</div>
                <div>
                  <div class="wdh-holder">${escapeHtml(accountHolder || 'Không có')}</div>
                  <div class="wdh-bank">${escapeHtml(item.bank)}</div>
                </div>
              </div>
              <div class="wdh-amount">${escapeHtml(formatCurrency(item.amount))}đ</div>
            </div>

            <div class="wdh-status-row">
              <span class="wdh-chip" style="${getWithdrawalStatusStyle(item.status)}">${escapeHtml(getDisplayWithdrawalStatus(item.status))}</span>
              <span class="wdh-chip" style="${getTransactionStatusStyle(txStatusDisplay)}">GD: ${escapeHtml(txStatusDisplay)}</span>
            </div>

            <div class="wdh-grid">
              <div>
                <div class="wdh-label">Thời gian yêu cầu</div>
                <div class="wdh-value">${escapeHtml(requestedAtText)}</div>
              </div>
              <div>
                <div class="wdh-label">Thời gian xử lý</div>
                <div class="wdh-value">${escapeHtml(processedAtText)}</div>
              </div>
              <div>
                <div class="wdh-label">Mã giao dịch</div>
                <div class="wdh-value">${escapeHtml(txId)}</div>
              </div>
              <div>
                <div class="wdh-label">Lý do từ chối</div>
                <div class="wdh-value">${escapeHtml(rejectionReason || 'Không có')}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      await Swal.fire({
        title: 'Lịch sử rút tiền',
        width: 980,
        confirmButtonText: 'Đóng',
        buttonsStyling: false,
        customClass: {
          popup: 'vendor-withdrawal-history-popup',
          htmlContainer: 'vendor-withdrawal-history-container',
          confirmButton: 'rounded-lg font-bold px-6 py-3 text-white bg-primary hover:opacity-90 transition-all',
        },
        html: sortedItems.length === 0
          ? '<div style="padding:20px 8px;color:#64748b;font-weight:600;">Chưa có yêu cầu rút tiền nào.</div>'
          : `
            <div class="wdh-wrap">
              <div class="wdh-summary">
                <div class="wdh-summary-item">
                  <div class="wdh-summary-label">Tổng yêu cầu</div>
                  <div class="wdh-summary-value">${summary.total}</div>
                </div>
                <div class="wdh-summary-item">
                  <div class="wdh-summary-label">Tổng tiền rút</div>
                  <div class="wdh-summary-value">${escapeHtml(formatCurrency(summary.amount))}đ</div>
                </div>
                <div class="wdh-summary-item">
                  <div class="wdh-summary-label">Đã duyệt</div>
                  <div class="wdh-summary-value">${summary.approved}</div>
                </div>
                <div class="wdh-summary-item">
                  <div class="wdh-summary-label">Chờ xử lý/Từ chối</div>
                  <div class="wdh-summary-value">${summary.pending + summary.rejected}</div>
                </div>
              </div>
              <div class="wdh-list">${cardsHtml}</div>
            </div>
          `,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tải lịch sử rút tiền.';
      toast.error(message);
    } finally {
      setWithdrawalHistoryLoading(false);
    }
  };

  const currentWalletType = resolveWalletType();
  const availableBalance = getWalletAmount(walletInfo, 'balance');
  const heldBalance = getWalletAmount(walletInfo, 'heldBalance');
  const debtBalance = getWalletAmount(walletInfo, 'debt');

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {!hideHeader && isCustomer && activeRoute === '/' && hasVendorRole && (
        <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 border-b border-amber-100">
          <div className={`${(isStaff || isVendor) ? 'max-w-full' : 'max-w-7xl'} mx-auto px-6 md:px-10 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2`}>
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
          <div className="max-w-[92rem] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
            <div className="flex items-center gap-12">
              <div
                className="cursor-pointer"
                onClick={() => {
                  if (isAdmin) onNavigate('/admin/dashboard');
                  else if (isStaff) onNavigate('/staff/dashboard');
                  else if (isVendor) onNavigate('/vendor/dashboard');
                  else onNavigate('/');
                }}
              >
                <div className="w-[240px] h-[72px] md:w-[288px] md:h-[84px] lg:w-[312px] lg:h-[96px] -ml-16">
                  <img
                    src={headerLogo}
                    alt="Modern Ritual Offering"
                    className="w-full h-full object-contain object-left origin-left scale-[1.34]"
                  />
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
                      onClick={() => item.path && handleMainNavClick(item.path)}
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

              {/* Notification Bell */}
              {userName && !hideWalletAndProfileOnAdminDashboard && (
                <div
                  className="relative hidden md:block"
                  onMouseEnter={() => {
                    if (notificationDropdownTimeout.current) {
                      clearTimeout(notificationDropdownTimeout.current);
                    }
                    setIsNotificationDropdownOpen(true);
                    if (notifications.length === 0 && !notificationLoading) {
                      loadNotifications();
                    }
                  }}
                  onMouseLeave={() => {
                    notificationDropdownTimeout.current = setTimeout(() => {
                      setIsNotificationDropdownOpen(false);
                    }, 200);
                  }}
                >
                  <button
                    onClick={() => {
                      const next = !isNotificationDropdownOpen;
                      setIsNotificationDropdownOpen(next);
                      if (next && notifications.length === 0 && !notificationLoading) {
                        loadNotifications();
                      }
                    }}
                    className="relative flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-slate-600 hover:border-primary hover:text-primary transition-all bg-white shadow-sm"
                    title="Thông báo"
                  >
                    <svg
                      className="w-5 h-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M12 2C10.3431 2 9 3.34315 9 5V5.34196C6.71873 6.16519 5.125 8.33675 5.125 10.75V15L4 16.75V17.5H20V16.75L18.875 15V10.75C18.875 8.33675 17.2813 6.16519 15 5.34196V5C15 3.34315 13.6569 2 12 2ZM10.75 19C10.75 20.2426 11.7574 21.25 13 21.25C14.2426 21.25 15.25 20.2426 15.25 19H10.75Z" />
                    </svg>

                    {unreadNotificationCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-0.5">
                        {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  {isNotificationDropdownOpen && (
                    <div
                      className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden"
                      onMouseEnter={() => {
                        if (notificationDropdownTimeout.current) {
                          clearTimeout(notificationDropdownTimeout.current);
                        }
                      }}
                    >
                      <div className="px-5 pt-4 pb-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 via-white to-amber-50">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-amber-700">Thông báo</p>
                          <p className="text-xs text-slate-500 mt-0.5">Cập nhật mới nhất về đơn hàng và đánh giá</p>
                        </div>
                        <button
                          onClick={() => {
                            markAllNotificationsAsRead();
                            markAllNotificationsAsReadApi();
                          }}
                          className="text-[11px] font-semibold text-primary hover:text-primary/80 underline-offset-2 hover:underline"
                        >
                          Đánh dấu đã đọc
                        </button>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {notificationLoading && notifications.length === 0 && (
                          <div className="px-5 py-6 text-sm text-slate-500">Đang tải thông báo...</div>
                        )}

                        {!notificationLoading && notifications.length === 0 && (
                          <div className="px-5 py-6 text-sm text-slate-500">Hiện chưa có thông báo nào.</div>
                        )}

                        {notifications.map((item) => (
                          <div
                            key={String(item.notificationId)}
                            className={`px-5 py-4 flex gap-3 hover:bg-slate-50 transition-colors cursor-pointer ${!item.isRead ? 'bg-amber-50/60' : ''}`}
                            onClick={async () => {
                              if (!item.isRead) {
                                setNotifications((prev) => prev.map((n) => n.notificationId === item.notificationId ? { ...n, isRead: true } : n));
                                setUnreadNotificationCount((prev) => Math.max(0, prev - 1));
                                markNotificationAsRead(item.notificationId);
                              }

                              const targetUrl = resolveNotificationRedirectPath(item);
                              if (targetUrl) {
                                if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
                                  window.location.href = targetUrl;
                                } else {
                                  onNavigate(targetUrl);
                                }
                              }
                            }}
                          >
                            <div
                              className={`mt-1 size-2.5 rounded-full flex-shrink-0 ${item.type === 'orderplaced' || item.type === 'order'
                                ? 'bg-emerald-500'
                                : item.type === 'review' || item.type === 'rating'
                                  ? 'bg-sky-500'
                                  : 'bg-amber-500'
                                }`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 mb-1 truncate">
                                {item.title}
                              </p>
                              <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                                {item.message}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{new Date(item.createdAt).toLocaleString('vi-VN')}</span>
                                {(item.type === 'orderplaced' || item.type === 'order') && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                                    Đơn hàng
                                  </span>
                                )}
                                {(item.type === 'review' || item.type === 'rating') && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-semibold">
                                    Đánh giá
                                  </span>
                                )}
                                {item.type === 'system' && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold">
                                    Hệ thống
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {(userName || onLogout) && !hideWalletAndProfileOnAdminDashboard && (
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
                    disabled={walletLoading || topupLoading || withdrawLoading || withdrawalHistoryLoading}
                    className="flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 text-primary hover:border-primary transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Ví của tôi"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 7C3 5.34315 4.34315 4 6 4H19C20.1046 4 21 4.89543 21 6V8H17.5C15.567 8 14 9.567 14 11.5C14 13.433 15.567 15 17.5 15H21V17C21 18.6569 19.6569 20 18 20H6C4.34315 20 3 18.6569 3 17V7ZM17.5 10C16.6716 10 16 10.6716 16 11.5C16 12.3284 16.6716 13 17.5 13H22V10H17.5ZM6 6C5.44772 6 5 6.44772 5 7V7.2C5.31304 7.07116 5.65584 7 6 7H19V6H6Z" />
                    </svg>
                  </button>

                  {isWalletDropdownOpen && (
                    <div
                      className="absolute top-full right-0 mt-3 w-72 bg-white rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
                      onMouseEnter={() => {
                        if (walletDropdownTimeout.current) {
                          clearTimeout(walletDropdownTimeout.current);
                        }
                      }}
                    >
                      <div className="p-5">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-green-500"></div>
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Số dư khả dụng</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); fetchWalletBalance(); }}
                            className={`p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-primary transition-all duration-500 ${walletLoading ? 'animate-spin text-primary' : ''}`}
                            title="Làm mới"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>

                        <div className="mb-6">
                          {walletLoading && !walletInfo ? (
                            <div className="h-10 w-full bg-slate-100 animate-pulse rounded-xl"></div>
                          ) : (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-primary tracking-tight">
                                {formatCurrency(availableBalance)}
                              </span>
                              <span className="text-xs font-bold text-slate-400 mb-1">VND</span>
                            </div>
                          )}

                          {/* Extra info for Vendor/Admin */}
                          {currentWalletType === 'Vendor' || (currentWalletType !== 'Customer' && debtBalance > 0) ? (
                            <div className="mt-4 space-y-2 pt-4 border-t border-dashed border-slate-100">
                              {currentWalletType === 'Vendor' && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500">Số dư đang giữ:</span>
                                  <span className="font-bold text-amber-600">{formatCurrency(heldBalance)}đ</span>
                                </div>
                              )}
                              {debtBalance > 0 && (
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-slate-500">Công nợ:</span>
                                  <span className="font-bold text-red-500">-{formatCurrency(debtBalance)}đ</span>
                                </div>
                              )}
                            </div>
                          ) : null}
                        </div>

                        {currentWalletType === 'Customer' && (
                          <button
                            onClick={async () => {
                              await handleTopupClick();
                            }}
                            disabled={topupLoading || walletLoading}
                            className="w-full bg-primary hover:bg-primary/95 text-white p-3 rounded-xl transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                          >
                            <div className="size-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                            <span className="font-bold text-sm tracking-wide">Nạp thêm tiền</span>
                          </button>
                        )}

                        {currentWalletType === 'Vendor' && (
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={handleWithdrawalHistoryClick}
                              disabled={walletLoading || withdrawLoading || withdrawalHistoryLoading}
                              className="w-full border-2 border-amber-600 text-amber-700 p-3 rounded-xl transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span className="font-bold text-sm tracking-wide">{withdrawalHistoryLoading ? 'Đang tải...' : 'Lịch sử'}</span>
                            </button>

                            <button
                              onClick={handleWithdrawClick}
                              disabled={walletLoading || withdrawLoading || withdrawalHistoryLoading}
                              className="w-full bg-amber-600 hover:bg-amber-700 text-white p-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-60 disabled:pointer-events-none"
                            >
                              <div className="size-7 rounded-lg bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 9l-5 5-5-5" />
                                </svg>
                              </div>
                              <span className="font-bold text-sm tracking-wide">{withdrawLoading ? 'Đang gửi...' : 'Rút tiền'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Dropdown */}
              {userName && !hideWalletAndProfileOnAdminDashboard && (
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
                              onNavigate('/wallet/transactions');
                              setIsAccountDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M5 4h14a2 2 0 012 2v2H3V6a2 2 0 012-2zm-2 7h18v7a2 2 0 01-2 2H5a2 2 0 01-2-2v-7zm9 2a3 3 0 100 6 3 3 0 000-6z" />
                            </svg>
                            Lịch sử giao dịch
                          </button>
                          {/* <button
                            onClick={() => {
                              handleNavigateToTracking();
                              setIsAccountDropdownOpen(false);
                            }}
                            className="w-full px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                            Theo dõi đơn hàng
                          </button> */}
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
              {hideWalletAndProfileOnAdminDashboard && onLogout && (
                <button
                  onClick={handleLogoutClick}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-all"
                  title="Đăng xuất"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
                  </svg>
                  <span className="hidden lg:inline">Đăng xuất</span>
                </button>
              )}
              {isCustomer && (
                <>
                  {/* Cart with Dropdown */}
                  <div
                    className="relative hidden md:block"
                    onMouseEnter={() => {
                      if (!getCurrentUser()) {
                        return;
                      }
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
                      onClick={handleNavigateToCart}
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
                      onNavigateToCart={handleNavigateToCart}
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
              {/* {isVendor && (
                <button
                  onClick={() => onNavigate('/vendor/dashboard')}
                  className="border-2 border-primary text-primary hover:bg-primary/5 rounded-lg px-6 py-2 text-sm font-bold transition-all"
                >
                  Bảng điều khiển
                </button>
              )} */}
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

      <main className="flex-grow">
        {(isStaff || isVendor) ? (
          <div className="bg-ritual-bg/20 py-12">
            <div className="w-full mx-auto px-6 md:px-10 lg:px-12 xl:px-16">
              <div className="flex flex-col lg:flex-row gap-10 items-start">
                <aside className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-[120px] z-30">
                  <div className="bg-white rounded-[2.5rem] p-4 border border-gold/10 shadow-xl backdrop-blur-sm bg-white/90">
                    <div className="px-6 py-8 mb-4 border-b border-gold/5 text-center lg:text-left">
                      <h1 className="text-2xl font-display font-black text-primary tracking-tight">
                        {isStaff ? 'Nhân Viên' : 'Nhà Cung Cấp'}
                      </h1>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">
                        {isStaff ? 'Hệ thống nhân viên' : 'Kênh người bán'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      {getSidebarItems().map((item) => (
                        <button
                          key={item.id}
                          onClick={() => onNavigate(item.path)}
                          className={`flex items-center w-full px-6 py-4 rounded-3xl font-bold text-sm uppercase transition-all tracking-wider ${activeRoute === item.path || (item.path === '/staff/dashboard' && activeRoute === '/staff-dashboard')
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]'
                            : 'text-slate-500 hover:bg-ritual-bg hover:text-primary'
                            }`}
                        >
                          <span className="material-symbols-outlined mr-4 text-xl">{item.icon}</span>
                          {item.label}
                        </button>
                      ))}
                      
                      <div className="mt-4 pt-4 border-t border-gold/5">
                        <button
                          onClick={() => onNavigate('/')}
                          className="flex items-center w-full px-6 py-4 rounded-3xl font-bold text-sm uppercase transition-all tracking-wider text-slate-500 hover:bg-primary/5 hover:text-primary"
                        >
                          <span className="material-symbols-outlined mr-4 text-xl">home</span>
                          Về trang khách hàng
                        </button>
                      </div>
                    </div>

                    <div className="mt-8 p-6 bg-ritual-bg/50 rounded-[2rem] border border-gold/5">
                      <p className="text-[10px] font-black text-gold uppercase tracking-[0.2em] mb-2">Trạng thái làm việc</p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {isStaff
                          ? 'Đảm bảo quy trình phê duyệt đúng quy định của nền tảng.'
                          : 'Cung cấp sản phẩm và dịch vụ mâm cúng tinh tế nhất.'}
                      </p>
                    </div>
                  </div>
                </aside>
                <div className="flex-1 w-full overflow-hidden">
                  {children}
                </div>
              </div>
            </div>
          </div>
        ) : (
          children
        )}
      </main>

      {/* Footer - Hidden during first-time setup */}
      {!hideHeader && (
        <footer className="bg-white border-t border-gray-200 pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="flex flex-col gap-6">
                <div className="w-[312px] h-[96px] md:w-[360px] md:h-[120px]">
                  <img
                    src={headerLogo}
                    alt="Modern Ritual Offering"
                    className="w-full h-full object-contain object-left"
                  />
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
              {/* <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h5 className="font-bold text-primary mb-2 text-sm uppercase">Tư vấn miễn phí</h5>
                <p className="text-xs text-gray-600 mb-4">Để lại số điện thoại để chuyên gia gọi lại ngay.</p>
                <div className="flex gap-2">
                  <input type="text" placeholder="Số điện thoại" className="flex-1 bg-white border border-gray-300 rounded-lg text-xs px-2 py-1" />
                  <button className="bg-primary text-white px-3 py-1 rounded-lg text-xs font-bold">Gửi</button>
                </div>
              </div> */}
            </div>
            <div className="pt-8 border-t border-gray-200 text-center">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">© 2026 Modern Ritual Offering  Service. Thành tâm - Tín trực.</p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;
