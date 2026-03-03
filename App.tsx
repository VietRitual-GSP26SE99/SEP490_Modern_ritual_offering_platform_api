
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import Layout from './components/Layout';


// Customer Pages
import CustomerHomePage from './pages/customer/HomePage';
import CustomerProductList from './pages/customer/ProductListPage';
import CustomerProductDetail from './pages/customer/ProductDetailPage';
import CustomerCheckout from './pages/customer/CheckoutPage';
import CustomerTracking from './pages/customer/TrackingPage';
import CustomerProfile from './pages/customer/ProfilePage';
import CartPage from './pages/customer/CartPage';

// Vendor Pages
import VendorDashboard from './pages/vendor/VendorDashboard';
import VendorShop from './pages/vendor/VendorShop';
import ProductManagement from './pages/vendor/ProductManagement';
import OrderManagement from './pages/vendor/OrderManagement';
import VendorAnalytics from './pages/vendor/VendorAnalytics';
import VendorSettings from './pages/vendor/VendorSettings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Staff Pages
import StaffDashboard from './pages/staff/StaffDashboard';
import CustomerManagement from './pages/staff/CustomerManagement';
import PostManagement from './pages/staff/PostManagement';
import SystemSettings from './pages/staff/SystemSettings';

// Assistant
import Assistant from './components/Assistant';

import { UserRole } from './types';
import AuthPage from './pages/auth/AuthPage';

// Route Wrapper Component
const AppContent: React.FC<{
  userRole: UserRole;
  isAuthenticated: boolean;
  onLogout: () => void;
  onRoleChange: (role: UserRole) => void;
}> = ({ userRole, isAuthenticated, onLogout, onRoleChange }) => {
  const navigate = useNavigate();

  const handleLogin = (role: UserRole) => {
    onRoleChange(role);
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
    navigate(path);
  };

  return (
    <Routes>
      {/* Auth Route - không có Layout */}
      <Route path="/auth" element={<AuthPage onNavigate={() => {}} onLogin={handleLogin} />} />

      {/* Customer Routes */}
      <Route path="/" element={<Layout activeRoute="/" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><CustomerHomePage onNavigate={handleNavigate} /></Layout>} />
      <Route path="/shop" element={<Layout activeRoute="/shop" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><CustomerProductList onNavigate={handleNavigate} /></Layout>} />
      <Route path="/product/:id" element={<Layout activeRoute="/product/:id" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><CustomerProductDetail onNavigate={handleNavigate} /></Layout>} />
      <Route path="/cart" element={<Layout activeRoute="/cart" onNavigate={handleNavigate} userRole={userRole} onLogout={isAuthenticated ? onLogout : undefined}><CartPage onNavigate={handleNavigate} /></Layout>} />
      <Route path="/checkout" element={isAuthenticated && userRole === 'customer' ? <Layout activeRoute="/checkout" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><CustomerCheckout onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/tracking" element={isAuthenticated && userRole === 'customer' ? <Layout activeRoute="/tracking" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><CustomerTracking /></Layout> : <Navigate to="/auth" />} />
      <Route path="/profile" element={isAuthenticated && userRole === 'customer' ? <Layout activeRoute="/profile" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><CustomerProfile onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />

      {/* Vendor Routes */}
      <Route path="/vendor/dashboard" element={isAuthenticated && userRole === 'vendor' ? <Layout activeRoute="/vendor/dashboard" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><VendorDashboard onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/shop" element={isAuthenticated && userRole === 'vendor' ? <Layout activeRoute="/vendor/shop" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><VendorShop onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/products" element={isAuthenticated && userRole === 'vendor' ? <Layout activeRoute="/vendor/products" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><ProductManagement onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/orders" element={isAuthenticated && userRole === 'vendor' ? <Layout activeRoute="/vendor/orders" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><OrderManagement onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/analytics" element={isAuthenticated && userRole === 'vendor' ? <Layout activeRoute="/vendor/analytics" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><VendorAnalytics onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />
      <Route path="/vendor/settings" element={isAuthenticated && userRole === 'vendor' ? <Layout activeRoute="/vendor/settings" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><VendorSettings onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />

      {/* Staff Routes */}
      <Route path="/staff/dashboard" element={isAuthenticated && userRole === 'staff' ? <StaffDashboard onNavigate={handleNavigate} onLogout={onLogout} /> : <Navigate to="/auth" />} />
      <Route path="/staff-customers" element={isAuthenticated && userRole === 'staff' ? <CustomerManagement onNavigate={handleNavigate} onLogout={onLogout} /> : <Navigate to="/auth" />} />
      <Route path="/staff-posts" element={isAuthenticated && userRole === 'staff' ? <PostManagement onNavigate={handleNavigate} onLogout={onLogout} /> : <Navigate to="/auth" />} />
      <Route path="/staff-settings" element={isAuthenticated && userRole === 'staff' ? <SystemSettings onNavigate={handleNavigate} onLogout={onLogout} /> : <Navigate to="/auth" />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={isAuthenticated && userRole === 'admin' ? <Layout activeRoute="/admin/dashboard" onNavigate={handleNavigate} userRole={userRole} onLogout={onLogout}><AdminDashboard onNavigate={handleNavigate} /></Layout> : <Navigate to="/auth" />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole>('guest');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogout = () => {
    setUserRole('guest');
    setIsAuthenticated(false);
  };

  const handleRoleChange = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

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
