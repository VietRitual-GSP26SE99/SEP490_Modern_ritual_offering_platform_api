import { ApiResponse } from '../types';
import { getAuthToken } from './auth';

const API_BASE_URL = '/api';

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
      console.log(' Fetching checkout summary:', requestBody);
      const response = await fetch(`${API_BASE_URL}/checkout/summary`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<CheckoutSummary> = await response.json();
      console.log(' Checkout summary:', data);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error(' API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error(' Failed to fetch checkout summary:', error);
      return null;
    }
  }

  /**
   * Xử lý thanh toán đơn hàng
   * POST /api/checkout/process
   */
  async processCheckout(request: ProcessCheckoutRequest): Promise<ProcessCheckoutResponse | null> {
    try {
      console.log(' Processing checkout:', request);
      console.log(' Request body:', JSON.stringify(request, null, 2));
      
      const response = await fetch(`${API_BASE_URL}/checkout/process`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', response.status, errorText);
        try {
          const errorData = JSON.parse(errorText);
          console.error('❌ Error details:', errorData);
        } catch (e) {
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<ProcessCheckoutResponse> = await response.json();
      console.log(' Checkout processed:', data);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error(' API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error(' Failed to process checkout:', error);
      return null;
    }
  }

  /**
   * Lấy URL trả về sau thanh toán
   * GET /api/payments/payment-return
   */
  async getPaymentReturnUrl(): Promise<string | null> {
    try {
      console.log(' Fetching payment return URL');
      const response = await fetch(`${API_BASE_URL}/payments/payment-return`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(' Payment return URL:', data);
      
      return data.result || data;
    } catch (error) {
      console.error(' Failed to fetch payment return URL:', error);
      return null;
    }
  }

  /**
   * Khởi tạo thanh toán VNPay
   * POST /api/payments/vnpay-ipn
   */
  async initiateVnpayPayment(): Promise<{ paymentUrl?: string } | null> {
    try {
      console.log(' Initiating VNPay payment');
      const response = await fetch(`${API_BASE_URL}/payments/vnpay-ipn`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(' VNPay initiation error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<{ paymentUrl?: string }> = await response.json();
      console.log(' VNPay payment initiated:', data);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error(' API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error(' Failed to initiate VNPay payment:', error);
      return null;
    }
  }

  /**
   * Lấy thông tin giao dịch
   * GET /api/payments/{transactionId}
   */
  async getTransaction(transactionId: string): Promise<any | null> {
    try {
      console.log(' Getting transaction:', transactionId);
      const response = await fetch(`${API_BASE_URL}/payments/${transactionId}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(' Get transaction error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      console.log(' Transaction retrieved:', data);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error(' API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error(' Failed to get transaction:', error);
      return null;
    }
  }

  /**
   * Xử lý giao dịch
   * POST /api/payments/{transactionId}
   */
  async processTransaction(transactionId: string): Promise<any | null> {
    try {
      console.log(' Processing transaction:', transactionId);
      const response = await fetch(`${API_BASE_URL}/payments/${transactionId}`, {
        method: 'POST',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(' Transaction processing error:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<any> = await response.json();
      console.log(' Transaction processed:', data);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error(' API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error(' Failed to process transaction:', error);
      return null;
    }
  }
}

export const checkoutService = new CheckoutService();
