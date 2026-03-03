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
  itemId: number;  // API endpoint expects 'itemId' even though response has 'cartItemId'
  quantity: number;
}

class CartService {
  private getHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  /**
   * Lấy giỏ hàng hiện tại
   * GET /api/cart
   */
  async getCart(): Promise<CartApi | null> {
    try {
      console.log(' Fetching cart...');
      const response = await fetch(`${API_BASE_URL}/cart`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log(' Cart is empty or not found');
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<CartApi> = await response.json();
      console.log(' Cart data:', data);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error(' API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error(' Failed to fetch cart:', error);
      return null;
    }
  }

  /**
   * Thêm sản phẩm vào giỏ hàng
   * POST /api/cart/add
   */
  async addToCart(request: AddToCartRequest): Promise<boolean> {
    try {
      console.log(' Adding to cart:', request);
      const response = await fetch(`${API_BASE_URL}/cart/add`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      console.log(' Add to cart response:', data);
      
      return data.isSuccess;
    } catch (error) {
      console.error(' Failed to add to cart:', error);
      return false;
    }
  }

  /**
   * Cập nhật số lượng item trong giỏ
   * PUT /api/cart/items
   */
  async updateCartItem(request: UpdateCartItemRequest): Promise<boolean> {
    try {
      console.log(' Updating cart item:', request);
      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      console.log(' Update cart response:', data);
      
      return data.isSuccess;
    } catch (error) {
      console.error(' Failed to update cart item:', error);
      return false;
    }
  }

  /**
   * Xóa item khỏi giỏ hàng
   * DELETE /api/cart/items?itemId={id}
   * Note: Response has 'cartItemId' but endpoint expects 'itemId' parameter
   */
  async removeCartItem(cartItemId: number): Promise<boolean> {
    try {
      console.log('🗑️ Removing cart item:', cartItemId);
      const response = await fetch(`${API_BASE_URL}/cart/items?itemId=${cartItemId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        // Don't log 404 as error - item might already be deleted
        if (response.status === 404) {
          console.log('⚠️ Cart item not found (404)');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      console.log('✅ Remove item response:', data);
      
      return data.isSuccess;
    } catch (error) {
      // Only log non-404 errors
      if (!(error instanceof Error && error.message.includes('404'))) {
        console.error('💥 Failed to remove cart item:', error);
      }
      throw error; // Re-throw to let component handle it
    }
  }

  /**
   * Xóa toàn bộ giỏ hàng
   * DELETE /api/cart/clear
   */
  async clearCart(): Promise<boolean> {
    try {
      console.log(' Clearing cart...');
      const response = await fetch(`${API_BASE_URL}/cart/clear`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      console.log(' Clear cart response:', data);
      
      return data.isSuccess;
    } catch (error) {
      console.error(' Failed to clear cart:', error);
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

    // Dùng subtotal từ API thay vì tính lại
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
