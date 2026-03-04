import { getAuthToken } from './auth';
const API_BASE_URL = '/api';

export interface OrderItem {
    id: string;
    packageName: string;
    variantName: string;
    quantity: number;
    price: number;
    lineTotal: number;
}

export interface Order {
    orderId: string;
    orderCode: string;
    vendorName: string;
    totalAmount: number;
    shippingFee: number;
    orderStatus: string;
    createdAt: string;
    deliveryDate: string;
    deliveryTime: string;
    deliveryAddress: string;
    items: OrderItem[];
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

    // Cancel an order
    async cancelOrder(orderId: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: this.getHeaders(),
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
