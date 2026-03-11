import { getAuthToken } from './auth';
const API_BASE_URL = '/api';

export interface OrderItem {
    itemId: string;
    variantId?: string | number;
    variantName: string;
    packageName: string;
    quantity: number;
    price: number;
    lineTotal: number;
    decorationNote?: string;
    // Fields from API response
    totalAmount?: number;
    subTotal?: number;
    shippingFee?: number;
}

export interface Order {
    orderId: string;
    orderStatus: string;
    customer: {
        profileId: string;
        fullName: string;
        email: string;
        phoneNumber: string;
    };
    vendor: {
        profileId: string | null;
        shopName: string;
        email: string;
        phoneNumber: string;
        address: string;
    };
    delivery: {
        deliveryDate: string;
        deliveryTime: string;
        deliveryAddress: string;
        shippingDistanceKm: number;
    };
    items: OrderItem[];
    pricing: {
        subTotal: number;
        shippingFee: number;
        totalAmount: number;
        commissionRate: number;
        platformFee: number;
        vendorNetAmount: number;
    };
    payment: {
        paymentMethod: string;
        paymentStatus: string;
        paidAt: string | null;
        transactionId: string;
        isPaidToVendor: boolean | null;
        paidToVendorDate: string | null;
    };
    createdAt: string;
    updatedAt: string | null;
    cancelReason: string | null;
    refundAmount: number;
}

export interface VendorOrderItem {
    itemId: string;
    variantId: number | string;
    variantName: string;
    packageName: string;
    quantity: number;
    price: number;
    lineTotal: number;
    decorationNote?: string;
}

export interface VendorOrder {
    orderId: string;
    orderStatus: string;
    customerProfileId: string;
    customerName: string;
    vendorProfileId: string;
    vendorName: string;
    deliveryDate: string;
    deliveryTime: string;
    deliveryAddress: string;
    items: VendorOrderItem[];
    subTotal: number;
    shippingDistanceKm: number;
    shippingFee: number;
    totalAmount: number;
    commissionRate: number;
    platformFee: number;
    vendorNetAmount: number;
    paymentMethod: string;
    createdAt: string;
}

class OrderService {
    private getHeaders(): HeadersInit {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    // Get all orders for the current customer
    async getMyOrders(): Promise<Order[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/customer`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.isSuccess && data.result) {
                return data.result;
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch My Orders:", error);
            throw error;
        }
    }

    // Get details for a specific order
    async getOrderDetails(orderId: string): Promise<Order | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.isSuccess && data.result) {
                return data.result;
            }
            return null;
        } catch (error) {
            console.error("Failed to get Order Details:", error);
            throw error;
        }
    }

    // Get all orders for the current vendor
    async getVendorOrders(): Promise<VendorOrder[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/vendor`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.isSuccess && data.result) {
                return data.result;
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch Vendor Orders:", error);
            throw error;
        }
    }

    // Update order status (vendor)
    async updateOrderStatus(orderId: string, newStatus: string, reason?: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ newStatus, reason: reason || '' }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.isSuccess || data.statusCode === 'OK';
        } catch (error) {
            console.error('Failed to update order status:', error);
            throw error;
        }
    }

    // Cancel an order
    async cancelOrder(orderId: string, reason?: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ reason: reason || 'Vendor hủy đơn' }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Error cancelling order:", errorData);
                throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.isSuccess || data.statusCode === 'OK';
        } catch (error) {
            console.error("Failed to cancel order:", error);
            throw error;
        }
    }
}

export const orderService = new OrderService();
