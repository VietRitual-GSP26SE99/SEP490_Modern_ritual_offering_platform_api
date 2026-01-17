
export type Occasion = 'Full Moon' | 'House Warming' | 'Grand Opening' | 'Ancestral' | 'Year End';

export type UserRole = 'customer' | 'vendor' | 'admin' | 'guest';

export interface Product {
  id: string;
  name: string;
  category: Occasion;
  price: number;
  originalPrice?: number;
  image: string;
  description: string;
  rating: number;
  reviews: number;
  tag?: string;
}

export interface CartItem extends Product {
  quantity: number;
  tier: 'Standard' | 'Special' | 'Premium';
  style: 'Classic' | 'Modern';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export enum AppRoute {
  // Shared Routes
  Home = 'home',
  Auth = 'auth',
  
  // Customer Routes
  Shop = 'shop',
  Detail = 'detail',
  Checkout = 'checkout',
  Tracking = 'tracking',
  Profile = 'profile',
  Cart = 'cart',
  
  // Vendor Routes
  VendorDashboard = 'vendor-dashboard',
  VendorShop = 'vendor-shop',
  VendorProducts = 'vendor-products',
  VendorOrders = 'vendor-orders',
  VendorAnalytics = 'vendor-analytics',
  VendorSettings = 'vendor-settings',
  
  // Admin Routes
  AdminDashboard = 'admin-dashboard',
  AdminVendors = 'admin-vendors',
  AdminUsers = 'admin-users',
  AdminOrders = 'admin-orders',
  AdminDisputes = 'admin-disputes',
  AdminContent = 'admin-content',
  AdminFinance = 'admin-finance',
}

// Utility function to convert AppRoute enum to URL path
export const getPath = (route: AppRoute | string): string => {
  const pathMap: Record<string, string> = {
    [AppRoute.Home]: '/',
    [AppRoute.Auth]: '/auth',
    [AppRoute.Shop]: '/shop',
    [AppRoute.Detail]: '/product',
    [AppRoute.Checkout]: '/checkout',
    [AppRoute.Tracking]: '/tracking',
    [AppRoute.Profile]: '/profile',
    [AppRoute.Cart]: '/checkout',
    [AppRoute.VendorDashboard]: '/vendor/dashboard',
    [AppRoute.VendorShop]: '/vendor/shop',
    [AppRoute.VendorProducts]: '/vendor/products',
    [AppRoute.VendorOrders]: '/vendor/orders',
    [AppRoute.VendorAnalytics]: '/vendor/analytics',
    [AppRoute.VendorSettings]: '/vendor/settings',
    [AppRoute.AdminDashboard]: '/admin/dashboard',
    [AppRoute.AdminVendors]: '/admin/dashboard',
    [AppRoute.AdminUsers]: '/admin/dashboard',
    [AppRoute.AdminOrders]: '/admin/dashboard',
    [AppRoute.AdminDisputes]: '/admin/dashboard',
    [AppRoute.AdminContent]: '/admin/dashboard',
    [AppRoute.AdminFinance]: '/admin/dashboard',
  };
  return pathMap[route] || '/';
};
