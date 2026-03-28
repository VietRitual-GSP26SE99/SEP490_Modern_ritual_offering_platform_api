import { ApiResponse } from '../types';
import { getAuthToken } from './auth';

const API_BASE_URL = '/api';

// Cart API Types
export interface CartItemApi {
  cartItemId: number;
  cartId: number;
  packageId: number;
  variantId: number;
  quantity: number;
  price: number;
  packageName: string;
  variantName: string;
  imageUrl?: string;
}

export interface CartApi {
  cartId: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  cartItems: CartItemApi[];
  totalItems: number;
  subtotal: number;
}

export interface AddToCartRequest {
  variantId: number;
  quantity: number;
}

export interface UpdateCartItemRequest {
  cartItemId: number;
  quantity: number;
}

class CartService {
  private getHeaders(method: string = 'GET'): HeadersInit {
    const token = getAuthToken();
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
    
    // Only set Content-Type for methods that actually have a body
    if (method !== 'GET' && method !== 'DELETE') {
      headers['Content-Type'] = 'application/json';
    }
    
    return headers;
  }

  /**
   * Helper to extract cart data from various API response formats
   */
  private extractCartData(data: any): CartApi | null {
    if (!data) return null;

    let payload = data;
    
    // If the response is wrapped in ApiResponse { isSuccess, result, ... }
    if (data.isSuccess !== undefined || data.isSucceeded !== undefined || data.statusCode !== undefined) {
      if (data.isSuccess === false || data.isSucceeded === false) {
        // Some backends might return isSuccess: false for an empty cart instead of 404
        if (data.statusCode === 'NotFound' || data.errorMessages?.some((m: string) => m.toLowerCase().includes('not found'))) {
          return null;
        }
        console.error('❌ API Error in Cart Response:', data.errorMessages);
        return null;
      }
      payload = data.result || data;
    }

    // If the payload is an array, it's a list of items
    if (Array.isArray(payload)) {
      return {
        cartId: 0,
        userId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        cartItems: payload.map(item => this.mapCartItem(item)),
        totalItems: payload.reduce((sum, item) => sum + (item.quantity || 1), 0),
        subtotal: payload.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)
      };
    }

    // Handle nested cartItems or items
    const rawItems = payload.cartItems || payload.items || [];
    
    // If it's the specific format with 'vendors'
    let allItems = Array.isArray(rawItems) ? [...rawItems] : [];
    if (payload.vendors && Array.isArray(payload.vendors)) {
      payload.vendors.forEach((v: any) => {
        const nestedItems = v.items || v.cartItems || v.packageItems || v.products || v.packages || [];
        if (Array.isArray(nestedItems)) {
          allItems = [...allItems, ...nestedItems];
        }
      });
    }

    return {
      cartId: payload.cartId || payload.id || 0,
      userId: payload.userId || payload.customerId || '',
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: payload.updatedAt || new Date().toISOString(),
      cartItems: allItems.map(item => this.mapCartItem(item)),
      totalItems: payload.totalItems || payload.totalItem || allItems.reduce((sum, item) => sum + (item.quantity || 1), 0),
      subtotal: payload.subtotal || payload.subTotal || allItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0)
    };
  }

  private mapCartItem(item: any): CartItemApi {
    return {
      cartItemId: item.cartItemId || item.id || 0,
      cartId: item.cartId || 0,
      packageId: item.packageId || 0,
      variantId: item.variantId || 0,
      quantity: item.quantity || 0,
      price: item.price || 0,
      packageName: item.packageName || item.name || 'Sản phẩm',
      variantName: item.variantName || 'Mặc định',
      imageUrl: item.imageUrl || item.packageAvatarUrl || item.packageImageUrl || null
    };
  }

  /**
   * Lấy giỏ hàng của người dùng hiện tại
   * GET /api/cart
   */
  async getCart(): Promise<CartApi | null> {
    try {
      console.log('🛒 Fetching cart from API...');
      
      // Try GET /api/cart first as it is the most standard endpoint
      let response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'GET',
        headers: this.getHeaders('GET'),
      });

      // If /api/cart fails with 405 or 404, try /api/cart/items
      if (response.status === 405 || response.status === 404) {
        console.log(`⚠️ /api/cart returned ${response.status}, trying /api/cart/items...`);
        response = await fetch(`${API_BASE_URL}/cart/items`, {
          method: 'GET',
          headers: this.getHeaders('GET'),
        });
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`❌ Fetch Cart API Error (Status: ${response.status}):`, errorText);
        
        if (response.status === 404) return null;
        if (response.status === 500) {
          console.warn('💡 Tip: A 500 error on GET /api/cart might mean a backend bug or missing user profile data.');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.extractCartData(data);
    } catch (error) {
      console.error('❌ Failed to fetch cart:', error);
      throw error;
    }
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   */
  async addToCart(request: AddToCartRequest): Promise<boolean> {
    try {
      console.log('➕ Adding to cart:', request);
      
      // Try POST /api/cart first
      let response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'POST',
        headers: this.getHeaders('POST'),
        body: JSON.stringify(request),
      });

      // If 405 or 404, try /api/cart/items
      if (response.status === 405 || response.status === 404) {
        console.log(`⚠️ /api/cart (POST) returned ${response.status}, trying /api/cart/items...`);
        response = await fetch(`${API_BASE_URL}/cart/items`, {
          method: 'POST',
          headers: this.getHeaders('POST'),
          body: JSON.stringify(request),
        });
      }

      // Final fallback to /api/cart/add
      if (response.status === 405 || response.status === 404) {
        console.log(`⚠️ /api/cart/items (POST) returned ${response.status}, trying /api/cart/add...`);
        response = await fetch(`${API_BASE_URL}/cart/add`, {
          method: 'POST',
          headers: this.getHeaders('POST'),
          body: JSON.stringify(request),
        });
      }

      if (!response.ok) {
        let errorData: any = {};
        const errorText = await response.text().catch(() => '');
        try {
          if (errorText) errorData = JSON.parse(errorText);
        } catch {
          // ignore parsing error
        }
        console.error(`❌ Add to Cart API Error (Status: ${response.status}):`, errorText);
        throw new Error(errorData?.errorMessages?.[0] || `Thêm vào giỏ hàng thất bại (Lỗi ${response.status})`);
      }

      const data = await response.json().catch(() => ({}));
      return !!(data.isSuccess || data.isSucceeded || data.statusCode === 'OK' || response.ok);
    } catch (error) {
      console.error('❌ Failed to add to cart:', error);
      throw error;
    }
  }

  /**
   * Cập nhật số lượng item
   */
  async updateCartItem(request: UpdateCartItemRequest): Promise<boolean> {
    try {
      console.log('📝 Updating cart item:', request);
      
      // Try PUT /api/cart first
      let response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'PUT',
        headers: this.getHeaders('PUT'),
        body: JSON.stringify({
          itemId: request.cartItemId,
          quantity: request.quantity
        }),
      });

      if (response.status === 405 || response.status === 404) {
        response = await fetch(`${API_BASE_URL}/cart/items`, {
          method: 'PUT',
          headers: this.getHeaders('PUT'),
          body: JSON.stringify({
            itemId: request.cartItemId,
            quantity: request.quantity
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return !!(data.isSuccess || data.isSucceeded || data.statusCode === 'OK' || response.ok);
    } catch (error) {
      console.error('❌ Failed to update cart item:', error);
      throw error;
    }
  }

  /**
   * Xóa item khỏi giỏ hàng
   */
  async removeCartItem(cartItemId: number): Promise<boolean> {
    try {
      console.log('🗑️ Removing cart item:', cartItemId);
      
      // Try DELETE /api/cart?itemId=
      let response = await fetch(`${API_BASE_URL}/cart?itemId=${cartItemId}`, {
        method: 'DELETE',
        headers: this.getHeaders('DELETE'),
      });

      if (response.status === 405 || response.status === 404) {
        response = await fetch(`${API_BASE_URL}/cart/items?itemId=${cartItemId}`, {
          method: 'DELETE',
          headers: this.getHeaders('DELETE'),
        });
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json().catch(() => ({}));
      return !!(data.isSuccess || data.isSucceeded || data.statusCode === 'OK' || response.ok);
    } catch (error) {
      console.error('❌ Failed to remove cart item:', error);
      throw error;
    }
  }

  /**
   * Xóa toàn bộ giỏ hàng
   */
  async clearCart(): Promise<boolean> {
    try {
      console.log('🧹 Clearing cart...');
      
      let response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'DELETE',
        headers: this.getHeaders('DELETE'),
      });

      if (response.status === 405 || response.status === 404) {
        response = await fetch(`${API_BASE_URL}/cart/items`, {
          method: 'DELETE',
          headers: this.getHeaders('DELETE'),
        });
      }

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to clear cart:', error);
      return false;
    }
  }

  /**
   * Tính tổng giá trị giỏ hàng (dùng subtotal từ API)
   */
  calculateTotal(cart: CartApi | null): { subtotal: number; shipping: number; tax: number; total: number } {
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return { subtotal: 0, shipping: 0, tax: 0, total: 0 };
    }

    const subtotal = cart.subtotal || cart.cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 0 ? 50000 : 0;
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + shipping + tax;

    return { subtotal, shipping, tax, total };
  }
}

// Export singleton instance
export const cartService = new CartService();
export default cartService;
