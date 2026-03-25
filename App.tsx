
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate, useSearchParams } from 'react-router-dom';
import Layout from './components/Layout';
import { getCurrentUser, getProfile, isAuthenticated as checkAuth } from './services/auth';


// Customer Pages
import CustomerHomePage from './pages/customer/HomePage';
import CustomerProductList from './pages/customer/ProductListPage';
import CustomerProductDetail from './pages/customer/ProductDetailPage';
import CustomerCheckout from './pages/customer/CheckoutPage';
import PaymentSuccessPage from './pages/customer/PaymentSuccessPage';
import CustomerProfile from './pages/customer/ProfilePage';
import CartPage from './pages/customer/CartPage';
import MyOrdersPage from './pages/customer/MyOrdersPage';
import OrderDetailsPage from './pages/customer/OrderDetailsPage';
import VendorProfilePage from './pages/vendor/VendorProfilePage';
import TransactionHistoryPage from './pages/customer/TransactionHistoryPage';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorShop from './pages/vendor/VendorShop';
import ProductManagement from './pages/vendor/ProductManagement';
import OrderManagement from './pages/vendor/OrderManagement';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import VendorSettings from './pages/vendor/VendorSettings';
import ShippingConfigPage from './pages/vendor/ShippingConfigPage';
import VendorTransactionPage from './pages/vendor/VendorTransactionPage';
import VendorWithdrawPage from './pages/vendor/VendorWithdrawPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import CustomerManagement from './pages/staff/CustomerManagement';
import StaffProductManagement from './pages/staff/StaffProductManagement';
import SystemSettings from './pages/staff/SystemSettings';
import RefundManagement from './pages/staff/RefundManagement';
import VendorVerificationPage from './pages/staff/VendorVerification';
import TransactionManagement from './pages/staff/TransactionManagement';

// Assistant
import Assistant from './components/Assistant';

import { UserRole } from './types';
import AuthPage from './pages/auth/AuthPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

const PROFILE_SETUP_REQUIRED_KEY = 'modern-ritual-profile-setup-required';

// Route Wrapper Component
const AppContent: React.FC<{
  userRole: UserRole;
  isAuthenticated: boolean;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
}> = ({ userRole, isAuthenticated, onLogout, onRoleChange }) => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const normalizedRoles = (currentUser?.roles || [])
    .filter((role): role is string => typeof role === 'string')
    .map((role) => role.toLowerCase());
  const hasVendorRole = userRole === 'vendor' || normalizedRoles.includes('vendor');
  const hasCustomerRole = userRole === 'customer' || normalizedRoles.includes('customer');
  const isProfileSetupRequired =
    isAuthenticated &&
    hasCustomerRole &&
    localStorage.getItem(PROFILE_SETUP_REQUIRED_KEY) === 'true';

  const handleLogin = (role: UserRole, firstTimeLogin?: boolean) => {
    onRoleChange(role);

    if (role === 'customer') {
      localStorage.setItem(PROFILE_SETUP_REQUIRED_KEY, firstTimeLogin ? 'true' : 'false');
    } else {
      localStorage.setItem(PROFILE_SETUP_REQUIRED_KEY, 'false');
    }

    // If first-time login for customer, redirect to profile setup
    if (firstTimeLogin && role === 'customer') {
      navigate('/profile?firstTime=true');
      return;
    }

    // Normal login flow
    if (role === 'customer') {
      navigate('/');
    } else if (role === 'vendor') {
      navigate('/vendor/dashboard');
    } else if (role === 'staff') {
      navigate('/staff/dashboard');
    } else if (role === 'admin') {
      navigate('/admin/dashboard');
    }
  };

  const handleNavigate = (path: string) => {
    if (isProfileSetupRequired && path !== '/profile') {
      navigate('/profile?firstTime=true');
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    navigate(path);
  };

  // ProfilePageWrapper to detect firstTime query param
  const ProfilePageWrapper: React.FC = () => {
    const [searchParams] = useSearchParams();
    const isFirstTime = isProfileSetupRequired || searchParams.get('firstTime') === 'true';

    return (
      <Layout
        activeRoute="/profile"
        onNavigate={handleNavigate}
        userRole={userRole}
        onLogout={onLogout}
        hideHeader={isFirstTime}
      >
        <CustomerProfile onNavigate={handleNavigate} />
      </Layout>
    );
  };

  return (
    <Routes>
      {/* Auth Route - không có Layout */}
      <Route path="/auth" element={<AuthPage onNavigate={handleNavigate} onLogin={handleLogin} />} />
      <Route path="/confirm-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />
      <Route path="/reset-password" element={<ForgotPasswordPage onNavigate={handleNavigate} />} />

      {/* Customer Routes */}
      <Route path="/" element={isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <Layout activeRoute="/" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><CustomerHomePage onNavigate={handleNavigate} /></Layout>} />
      <Route path="/shop" element={isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <Layout activeRoute="/shop" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><CustomerProductList onNavigate={handleNavigate} /></Layout>} />
      <Route path="/product/:id" element={isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <Layout activeRoute="/product/:id" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><CustomerProductDetail onNavigate={handleNavigate} /></Layout>} />
      <Route path="/vendor/:id" element={isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <Layout activeRoute="/vendor/:id" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><VendorProfilePage onNavigate={handleNavigate} /></Layout>} />
      <Route path="/cart" element={isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <Layout activeRoute="/cart" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><CartPage onNavigate={handleNavigate} /></Layout>} />
      <Route path="/checkout" element={isAuthenticated && hasCustomerRole ? (isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <Layout activeRoute="/checkout" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><CustomerCheckout onNavigate={handleNavigate} /></Layout>) : <Navigate to="/auth" />} />
      <Route path="/payment-success" element={isAuthenticated && hasCustomerRole ? (isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <PaymentSuccessPage onNavigate={handleNavigate} />) : <Navigate to="/auth" />} />
      <Route path="/profile" element={isAuthenticated && hasCustomerRole ? <ProfilePageWrapper /> : <Navigate to="/auth" />} />
      <Route path="/profile/orders" element={isAuthenticated && hasCustomerRole ? (isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <Layout activeRoute="/profile/orders" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><MyOrdersPage /></Layout>) : <Navigate to="/auth" />} />
      <Route path="/profile/orders/:id" element={isAuthenticated && hasCustomerRole ? (isProfileSetupRequired ? <Navigate to="/profile?firstTime=true" replace /> : <Layout activeRoute="/profile/orders/:id" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><OrderDetailsPage /></Layout>) : <Navigate to="/auth" />} />
      <Route path="/wallet/transactions" element={isAuthenticated ? <Layout activeRoute="/wallet/transactions" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><TransactionHistoryPage onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />

      {/* Vendor Routes */}
      <Route path="/vendor/dashboard" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/dashboard" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><VendorDashboard onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/shop" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/shop" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><VendorShop onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/products" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/products" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><ProductManagement onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/orders" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/orders" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><OrderManagement onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/analytics" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/analytics" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><VendorAnalytics onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/settings" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/settings" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><VendorSettings onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/shipping" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/shipping" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><ShippingConfigPage onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/transactions" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/transactions" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><VendorTransactionPage onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/withdraw" element={isAuthenticated && hasVendorRole ? <Layout activeRoute="/vendor/withdraw" onNavigate={handleNavigate} userRole={'vendor'} onLogout={onLogout}><VendorWithdrawPage onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />

      {/* Staff Routes */}
      <Route path="/staff/dashboard" element={isAuthenticated && userRole === 'staff' ? <Layout activeRoute="/staff/dashboard" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><StaffDashboard onNavigate={handleNavigate} onLogout={onLogout} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/staff-customers" element={isAuthenticated && userRole === 'staff' ? <Layout activeRoute="/staff-customers" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><CustomerManagement onNavigate={handleNavigate} onLogout={onLogout} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/staff-product" element={isAuthenticated && userRole === 'staff' ? <Layout activeRoute="/staff-product" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><StaffProductManagement onNavigate={handleNavigate} onLogout={onLogout} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/staff-settings" element={isAuthenticated && userRole === 'staff' ? <Layout activeRoute="/staff-settings" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><SystemSettings onNavigate={handleNavigate} onLogout={onLogout} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/staff-refunds" element={isAuthenticated && userRole === 'staff' ? <Layout activeRoute="/staff-refunds" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><RefundManagement onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/staff-vendors" element={isAuthenticated && userRole === 'staff' ? <Layout activeRoute="/staff-vendors" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><VendorVerificationPage onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/staff-transactions" element={isAuthenticated && userRole === 'staff' ? <Layout activeRoute="/staff-transactions" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><TransactionManagement onNavigate={handleNavigate} userRole="staff" /></Layout> : <Navigate to="/auth" />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={isAuthenticated && userRole === 'admin' ? <Layout activeRoute="/admin/dashboard" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><AdminDashboard onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/admin/transactions" element={isAuthenticated && userRole === 'admin' ? <Layout activeRoute="/admin/transactions" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><TransactionManagement onNavigate={handleNavigate} userRole="admin" /></Layout> : <Navigate to="/auth" />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Restore authentication state from localStorage on mount
  useEffect(() => {
    console.log('🔄 Checking authentication state on app mount...');

    const restoreAuth = async () => {
      // Check if user is authenticated
      const authenticated = checkAuth();

      if (authenticated) {
        // Get user data from localStorage
        const currentUser = getCurrentUser();

        if (currentUser && currentUser.role) {
          console.log('✅ User found in localStorage:', currentUser);
          setUserRole(currentUser.role as UserRole);
          setIsAuthenticated(true);

          if (currentUser.role === 'customer') {
            try {
              const profile = await getProfile();
              const hasFullName = !!profile.fullName?.trim();
              const hasPhoneNumber = !!profile.phoneNumber?.trim();
              const hasDateOfBirth = !!profile.dateOfBirth;

              let hasAddress = !!profile.addressText?.trim();
              if (!hasAddress) {
                const token = localStorage.getItem('smart-child-token');
                if (token) {
                  const addressResponse = await fetch('/api/addresses', {
                    method: 'GET',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                  });

                  if (addressResponse.ok) {
                    const addressData = await addressResponse.json().catch(() => null);
                    const addressList = Array.isArray(addressData)
                      ? addressData
                      : (addressData?.isSuccess && Array.isArray(addressData.result) ? addressData.result : []);
                    hasAddress = addressList.some((addr: any) => !!(addr?.addressText || addr?.fullAddress || '').trim());
                  }
                }
              }

              const isIncomplete = !(hasFullName && hasPhoneNumber && hasDateOfBirth && hasAddress);
              localStorage.setItem(PROFILE_SETUP_REQUIRED_KEY, isIncomplete ? 'true' : 'false');
            } catch (profileError) {
              console.warn('⚠️ Failed to verify profile completeness on restore:', profileError);
            }
          } else {
            localStorage.setItem(PROFILE_SETUP_REQUIRED_KEY, 'false');
          }

          console.log('✅ Authentication state restored');
        } else {
          console.log('⚠️ Token found but no user data');
        }
      } else {
        console.log('ℹ️ No authentication token found');
        localStorage.setItem(PROFILE_SETUP_REQUIRED_KEY, 'false');
      }

      // Mark auth check as complete
      setIsAuthChecking(false);
    };

    void restoreAuth();
  }, []);

  const handleLogout = async () => {
    console.log('🔄 App logout initiated...');

    // Import and call complete logout with API
    const { logoutComplete } = await import('./services/auth');
    await logoutComplete();

    // Update React state
    setUserRole('guest');
    setIsAuthenticated(false);
  };

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  // Show loading screen while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
          <p className="text-slate-500 font-semibold">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppContent
        userRole={userRole}
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        onRoleChange={handleRoleChange}
      />
      <Assistant />
    </BrowserRouter>
  );
};

export default App;
