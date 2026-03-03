import { ApiResponse } from '../types';
import { getAuthToken } from './auth';

const API_BASE_URL = '/api';

// Checkout API Types
export interface CheckoutItem {
  cartItemId: number;
  variantId: number;
  variantName: string;
  packageName: string;
  quantity: number;
  price: number;
  lineTotal: number;
  vendorProfileId: string;
  vendorName: string;
}

export interface VendorOrder {
  vendorProfileId: string;
  shopName: string;
  items: CheckoutItem[];
  subTotal: number;
  shippingDistanceKm: number;
  shippingFee: number;
  commissionRate: number;
  platformFee: number;
  vendorNetAmount: number;
}

export interface CheckoutSummary {
  totalItems: number;
  items: CheckoutItem[];
  subTotal: number;
  shippingFee: number;
  totalAmount: number;
  vendorOrders: VendorOrder[];
  deliveryAddress?: string;
}

export interface CheckoutRequestItem {
  cartItemId: number;
}

export interface ProcessCheckoutItem {
  cartItemId: number;
  decorationNote?: string;
}

export interface ProcessCheckoutRequest {
  deliveryDate: string;
  deliveryTime: string;
  paymentMethod: string;
  items: ProcessCheckoutItem[];
}

export interface ProcessCheckoutResponse {
  orderId: string;
  totalAmount: number;
  paymentUrl?: string;
  message: string;
}

class CheckoutService {
  private getHeaders(): HeadersInit {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  /**
   * Lấy thông tin tóm tắt checkout
   * POST /api/checkout/summary
   * Request body: Array of { cartItemId: number }
   */
  async getSummary(cartItemIds: number[]): Promise<CheckoutSummary | null> {
    try {
      const requestBody = cartItemIds.map(id => ({ cartItemId: id }));
      console.log('📋 Fetching checkout summary:', requestBody);
      const response = await fetch(`${API_BASE_URL}/checkout/summary`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<CheckoutSummary> = await response.json();
      console.log('✅ Checkout summary:', data);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error('❌ API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error('💥 Failed to fetch checkout summary:', error);
      return null;
    }
  }

  /**
   * Xử lý thanh toán đơn hàng
   * POST /api/checkout/process
   */
  async processCheckout(request: ProcessCheckoutRequest): Promise<ProcessCheckoutResponse | null> {
    try {
      console.log('💳 Processing checkout:', request);
      console.log('📤 Request body:', JSON.stringify(request, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/checkout/process`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        // Log response body for debugging
        const errorText = await response.text();
        console.error('❌ Response error:', response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Error details:', errorData);
        } catch (e) {
          // Not JSON
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<ProcessCheckoutResponse> = await response.json();
      console.log('✅ Checkout processed:', data);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error('❌ API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error('💥 Failed to process checkout:', error);
      return null;
    }
  }
}

export const checkoutService = new CheckoutService();
