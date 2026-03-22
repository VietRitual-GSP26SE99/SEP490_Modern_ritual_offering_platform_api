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
    packageId?: string | number;
    imageUrl?: string | null;
    // Fields from API response
    totalAmount?: number;
    subTotal?: number;
    shippingFee?: number;
}

export interface Order {
    orderId: string;
    orderStatus: string;
    trackingLists: Array<{
        trackingId: string;
        title: string;
        status: string;
        description: string;
        createdAt: string;
    }>;
    customer: {
        profileId: string;
        customerId?: string;
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
        deliveryProofImageUrl?: string | null;
        deliveryProofImages?: string[] | null;
        preparationProofImages?: string[] | null;
    };
    items: OrderItem[];
    pricing: {
        totalQuantity?: number;
        subTotal: number;
        shippingFee: number;
        totalAmount: number;
        finalAmount?: number;
        discountAmount?: number;
        discountBreakdown?: unknown;
        commissionRate: number;
        platformFee: number;
        vendorNetAmount: number;
    };
    payment: {
        paymentMethod: string;
        paymentStatus: string;
        paidAt: string | null;
        transactionId: string | null;
        isPaidToVendor: boolean | null;
        paidToVendorDate: string | null;
    };
    vendorPricingDetails: {
        commissionRate: number;
        platformFee: number;
        vendorNetAmount: number;
        isPaidToVendor: boolean | null;
        paidToVendorDate: string | null;
        transactionId: string | null;
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
    customerPhone?: string;
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

interface VendorOrdersApiItem {
    orderId?: string;
    orderStatus?: string;
    vendorId?: string;
    shopName?: string;
    customerProfileId?: string;
    CustomerProfileId?: string;
    customerName?: string;
    CustomerName?: string;
    customerPhone?: string;
    CustomerPhone?: string;
    customer?: {
        profileId?: string;
        customerId?: string;
        fullName?: string;
        customerName?: string;
        phoneNumber?: string;
        customerPhone?: string;
    };
    deliveryDate?: string;
    deliveryTime?: string;
    deliveryAddress?: string;
    createdAt?: string;
    finalAmount?: number;
    subTotal?: number;
    shippingFee?: number;
    shippingDistanceKm?: number;
    commissionRate?: number;
    platformFee?: number;
    vendorNetAmount?: number;
    paymentMethod?: string;
    items?: Array<{
        itemId?: string;
        variantId?: number | string;
        variantName?: string;
        packageName?: string;
        quantity?: number;
        unitPrice?: number;
        price?: number;
        lineTotal?: number;
        decorationNote?: string;
        packageId?: string | number;
        productId?: string | number;
        imageUrl?: string | null;
    }>;
}

interface OrderDetailsApiItem {
    orderId?: string;
    orderStatus?: string;
    trackingLists?: Array<{
        trackingId?: string;
        title?: string;
        status?: string;
        description?: string;
        createdAt?: string;
    }>;
    customer?: {
        profileId?: string;
        customerId?: string;
        fullName?: string;
        customerName?: string;
        email?: string;
        phoneNumber?: string;
        customerPhone?: string;
    };
    vendor?: {
        profileId?: string;
        vendorId?: string;
        shopName?: string;
        email?: string;
        phoneNumber?: string;
        address?: string;
    };
    delivery?: {
        deliveryDate?: string;
        deliveryTime?: string;
        deliveryAddress?: string;
        shippingDistanceKm?: number;
        deliveryProofImageUrl?: string | string[] | null;
        imageUrl?: string | null;
        deliveryProofImages?: string[] | null;
        preparationProofImages?: string[] | null;
    };
    items?: Array<{
        itemId?: string;
        variantId?: number | string;
        variantName?: string;
        packageName?: string;
        quantity?: number;
        unitPrice?: number;
        price?: number;
        lineTotal?: number;
        decorationNote?: string;
        packageId?: string | number;
        productId?: string | number;
        imageUrl?: string | null;
    }>;
    pricing?: {
        totalQuantity?: number;
        subTotal?: number;
        shippingFee?: number;
        totalAmount?: number;
        finalAmount?: number;
        discountAmount?: number;
        discountBreakdown?: unknown;
        commissionRate?: number;
        platformFee?: number;
        vendorNetAmount?: number;
    };
    payment?: {
        paymentMethod?: string;
        paymentStatus?: string;
        paidAt?: string | null;
        transactionId?: string | null;
        isPaidToVendor?: boolean;
        paidToVendorDate?: string | null;
    };
    vendorPricingDetails?: {
        commissionRate?: number;
        platformFee?: number;
        vendorNetAmount?: number;
        isPaidToVendor?: boolean;
        paidToVendorDate?: string | null;
        transactionId?: string | null;
    };
    createdAt?: string;
    updatedAt?: string | null;
    cancelReason?: string | null;
    refundAmount?: number;
}

class OrderService {
    private normalizeCommissionRate(value: unknown): number {
        const raw = Number(value);
        if (!Number.isFinite(raw) || raw <= 0) return 0;
        return raw > 1 ? raw / 100 : raw;
    }

    private derivePaymentStatus(raw: OrderDetailsApiItem): string {
        const explicitStatus = String(raw.payment?.paymentStatus || '').trim();
        if (explicitStatus) return explicitStatus;

        const paidByOrderStatus = ['Paid', 'Delivering', 'Completed', 'Delivered', 'Refunded']
            .includes(String(raw.orderStatus || ''));

        const paidByTracking = Array.isArray(raw.trackingLists)
            && raw.trackingLists.some((item) => String(item?.status || '').toLowerCase() === 'paid');

        if (paidByOrderStatus || paidByTracking || raw.payment?.paidAt) {
            return 'Paid';
        }

        return 'Pending';
    }

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
            if (data.isSuccess && Array.isArray(data.result)) {
                return data.result.map((raw: any) => {
                    const items = Array.isArray(raw.items)
                        ? raw.items.map((item: any) => {
                            const quantity = Number(item.quantity) || 0;
                            const lineTotal = Number(item.lineTotal) || 0;
                            const unitPrice = Number(item.unitPrice ?? item.price) || (quantity > 0 ? lineTotal / quantity : 0);
                            return {
                                itemId: item.itemId || item.orderItemId || item.id || `item-${Math.random().toString(36).slice(2, 10)}`,
                                variantId: item.variantId ?? '',
                                variantName: item.variantName || 'N/A',
                                packageName: item.packageName || 'N/A',
                                quantity,
                                price: unitPrice,
                                lineTotal,
                                decorationNote: item.decorationNote || '',
                                packageId: 
                                    item.packageId || 
                                    (item as any).PackageId || 
                                    (item as any).package?.packageId || 
                                    (item as any).package?.id || 
                                    (item as any).productId || 
                                    (item as any).ProductId || 
                                    (item as any).package_id || 
                                    (item as any).product_id || '',
                                imageUrl:
                                    item.imageUrl ||
                                    item.imageURL ||
                                    item.packageImageUrl ||
                                    item.packageImageURL ||
                                    item.productImageUrl ||
                                    item.productImageURL ||
                                    null,
                            };
                        })
                        : [];

                    return {
                        ...raw,
                        items,
                        // Ensure pricing is accessible
                        pricing: raw.pricing || {
                            subTotal: raw.subTotal || 0,
                            shippingFee: raw.shippingFee || 0,
                            totalAmount: raw.totalAmount || raw.finalAmount || 0,
                        }
                    } as Order;
                });
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
                const raw: OrderDetailsApiItem = data.result;

                const items: OrderItem[] = Array.isArray(raw.items)
                    ? raw.items.map((item) => {
                        console.log('🔍 Raw Order Item from API:', item);
                        const quantity = Number(item.quantity) || 0;
                        const lineTotal = Number(item.lineTotal) || 0;
                        const unitPrice = Number(item.unitPrice ?? item.price) || (quantity > 0 ? lineTotal / quantity : 0);

                        return {
                            itemId: item.itemId || (item as any).orderItemId || (item as any).id || `item-${Math.random().toString(36).slice(2, 10)}`,
                            variantId: item.variantId ?? '',
                            variantName: item.variantName || 'N/A',
                            packageName: item.packageName || 'N/A',
                            quantity,
                            price: unitPrice,
                            lineTotal,
                            decorationNote: item.decorationNote || '',
                            packageId: 
                                item.packageId || 
                                (item as any).PackageId || 
                                (item as any).package?.packageId || 
                                (item as any).package?.id || 
                                (item as any).packageID || 
                                (item as any).productId || 
                                (item as any).ProductId || 
                                (item as any).productID || 
                                (item as any).package_id || 
                                (item as any).product_id || '',
                            imageUrl: 
                                item.imageUrl || 
                                (item as any).imageURL || 
                                (item as any).packageImageUrl || 
                                (item as any).packageImageURL || 
                                (item as any).productImageUrl || 
                                (item as any).productImageURL || 
                                null,
                        };
                    })
                    : [];

                const subTotal = Number(raw.pricing?.subTotal) || items.reduce((sum, item) => sum + item.lineTotal, 0);
                const shippingFee = Number(raw.pricing?.shippingFee) || 0;
                const totalAmount = Number(raw.pricing?.totalAmount ?? raw.pricing?.finalAmount) || (subTotal + shippingFee);
                const commissionRate = this.normalizeCommissionRate(
                    raw.vendorPricingDetails?.commissionRate ?? raw.pricing?.commissionRate,
                );
                const platformFee = Number(raw.vendorPricingDetails?.platformFee ?? raw.pricing?.platformFee) || (subTotal * commissionRate);
                const vendorNetAmount = Number(raw.vendorPricingDetails?.vendorNetAmount ?? raw.pricing?.vendorNetAmount) || Math.max(subTotal - platformFee, 0);

                const rawDeliveryProof = (
                    raw.delivery?.deliveryProofImageUrl
                    || raw.delivery?.imageUrl
                    || (raw as any).deliveryProofImageUrl
                    || (raw as any).imageUrl
                    || null
                );

                let deliveryProofImageUrl: string | null = null;
                let deliveryProofImages: string[] | null = null;

                if (Array.isArray(rawDeliveryProof)) {
                    const cleaned = (rawDeliveryProof as unknown[])
                        .filter((url) => typeof url === 'string' && (url as string).trim()) as string[];
                    deliveryProofImages = cleaned.length ? cleaned : null;
                    deliveryProofImageUrl = cleaned[0] || null;
                } else if (typeof rawDeliveryProof === 'string' && rawDeliveryProof.trim()) {
                    deliveryProofImageUrl = rawDeliveryProof;
                    deliveryProofImages = [rawDeliveryProof];
                }

                const preparationProofImages = Array.isArray(raw.delivery?.preparationProofImages)
                    ? (raw.delivery!.preparationProofImages as unknown[])
                        .filter((url) => typeof url === 'string' && (url as string).trim()) as string[]
                    : Array.isArray((raw as any).preparationProofImages)
                        ? ((raw as any).preparationProofImages as unknown[])
                            .filter((url) => typeof url === 'string' && (url as string).trim()) as string[]
                        : null;

                const trackingLists = Array.isArray(raw.trackingLists)
                    ? raw.trackingLists.map((item, index) => ({
                        trackingId: String((item as any)?.trackingId || `tracking-${index}`),
                        title: String(item?.title || 'Cập nhật đơn hàng'),
                        status: String(item?.status || ''),
                        description: String(item?.description || ''),
                        createdAt: String(item?.createdAt || ''),
                    }))
                    : [];

                return {
                    orderId: raw.orderId || orderId,
                    orderStatus: raw.orderStatus || 'Pending',
                    trackingLists,
                    customer: {
                        profileId: raw.customer?.profileId || raw.customer?.customerId || '',
                        customerId: raw.customer?.customerId || raw.customer?.profileId || '',
                        fullName: raw.customer?.fullName || raw.customer?.customerName || 'Khách hàng',
                        email: raw.customer?.email || '',
                        phoneNumber: raw.customer?.phoneNumber || raw.customer?.customerPhone || '',
                    },
                    vendor: {
                        profileId: raw.vendor?.profileId || raw.vendor?.vendorId || null,
                        shopName: raw.vendor?.shopName || 'Shop',
                        email: raw.vendor?.email || '',
                        phoneNumber: raw.vendor?.phoneNumber || '',
                        address: raw.vendor?.address || '',
                    },
                    delivery: {
                        deliveryDate: raw.delivery?.deliveryDate || '',
                        deliveryTime: raw.delivery?.deliveryTime || '',
                        deliveryAddress: raw.delivery?.deliveryAddress || 'N/A',
                        shippingDistanceKm: Number(raw.delivery?.shippingDistanceKm) || 0,
                        deliveryProofImageUrl,
                        deliveryProofImages,
                        preparationProofImages,
                    },
                    items,
                    pricing: {
                        totalQuantity: Number(raw.pricing?.totalQuantity) || items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
                        subTotal,
                        shippingFee,
                        totalAmount,
                        finalAmount: Number(raw.pricing?.finalAmount) || totalAmount,
                        discountAmount: Number(raw.pricing?.discountAmount) || 0,
                        discountBreakdown: raw.pricing?.discountBreakdown ?? null,
                        commissionRate,
                        platformFee,
                        vendorNetAmount,
                    },
                    payment: {
                        paymentMethod: raw.payment?.paymentMethod || 'N/A',
                        paymentStatus: this.derivePaymentStatus(raw),
                        paidAt: raw.payment?.paidAt || null,
                        transactionId: (
                            raw.payment?.transactionId
                            || raw.vendorPricingDetails?.transactionId
                            || null
                        ),
                        isPaidToVendor: typeof raw.vendorPricingDetails?.isPaidToVendor === 'boolean'
                            ? raw.vendorPricingDetails.isPaidToVendor
                            : null,
                        paidToVendorDate: raw.vendorPricingDetails?.paidToVendorDate || null,
                    },
                    vendorPricingDetails: {
                        commissionRate,
                        platformFee,
                        vendorNetAmount,
                        isPaidToVendor: typeof raw.vendorPricingDetails?.isPaidToVendor === 'boolean'
                            ? raw.vendorPricingDetails.isPaidToVendor
                            : null,
                        paidToVendorDate: raw.vendorPricingDetails?.paidToVendorDate || null,
                        transactionId: raw.vendorPricingDetails?.transactionId || raw.payment?.transactionId || null,
                    },
                    createdAt: raw.createdAt || new Date().toISOString(),
                    updatedAt: raw.updatedAt || null,
                    cancelReason: raw.cancelReason || null,
                    refundAmount: Number(raw.refundAmount) || 0,
                };
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
            const isSuccess = data?.isSuccess || data?.isSucceeded || data?.statusCode === 'OK';
            if (isSuccess && Array.isArray(data?.result)) {
                const mappedOrders: VendorOrder[] = data.result.map((raw: VendorOrdersApiItem) => {
                    const items = Array.isArray(raw.items)
                        ? raw.items.map((item) => {
                            const quantity = Number(item.quantity) || 0;
                            const unitPrice = Number(item.unitPrice ?? item.price) || 0;
                            const lineTotal = Number(item.lineTotal) || (unitPrice * quantity);

                            return {
                                itemId: item.itemId || `item-${Math.random().toString(36).slice(2, 10)}`,
                                variantId: item.variantId ?? '',
                                variantName: item.variantName || 'N/A',
                                packageName: item.packageName || 'N/A',
                                quantity,
                                price: unitPrice,
                                lineTotal,
                                decorationNote: item.decorationNote || '',
                            };
                        })
                        : [];

                    const subTotal = Number(raw.subTotal) || items.reduce((sum, item) => sum + item.lineTotal, 0);
                    const shippingFee = Number(raw.shippingFee) || 0;
                    const totalAmount = Number(raw.finalAmount) || Number(raw.vendorNetAmount) || (subTotal + shippingFee);
                    const commissionRate = this.normalizeCommissionRate(raw.commissionRate);
                    const platformFee = Number(raw.platformFee) || (totalAmount * commissionRate);
                    const vendorNetAmount = Number(raw.vendorNetAmount) || (totalAmount - platformFee);

                    return {
                        orderId: raw.orderId || '',
                        orderStatus: raw.orderStatus || 'Pending',
                        customerProfileId: raw.customerProfileId || raw.CustomerProfileId || raw.customer?.profileId || raw.customer?.customerId || '',
                        customerName: raw.customerName || raw.CustomerName || raw.customer?.fullName || raw.customer?.customerName || '',
                        customerPhone: raw.customerPhone || raw.CustomerPhone || raw.customer?.phoneNumber || raw.customer?.customerPhone || '',
                        vendorProfileId: raw.vendorId || '',
                        vendorName: raw.shopName || 'Shop',
                        deliveryDate: raw.deliveryDate || '',
                        deliveryTime: raw.deliveryTime || '',
                        deliveryAddress: raw.deliveryAddress || 'N/A',
                        items,
                        subTotal,
                        shippingDistanceKm: Number(raw.shippingDistanceKm) || 0,
                        shippingFee,
                        totalAmount,
                        commissionRate,
                        platformFee,
                        vendorNetAmount,
                        paymentMethod: raw.paymentMethod || 'N/A',
                        createdAt: raw.createdAt || raw.deliveryDate || new Date().toISOString(),
                    };
                });

                return mappedOrders;
            }
            return [];
        } catch (error) {
            console.error("Failed to fetch Vendor Orders:", error);
            throw error;
        }
    }

    // Update order status (vendor)
    async updateOrderStatus(orderId: string, newStatus: string, reason?: string, deliveryProofImages?: File[]): Promise<boolean> {
        try {
            const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
            const formData = new FormData();
            formData.append('NewStatus', newStatus);
            if (normalizedReason) {
                formData.append('Reason', normalizedReason);
            }
            if (deliveryProofImages?.length) {
                deliveryProofImages.forEach((file) => {
                    formData.append('DeliveryProofImages', file);
                });
            }

            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    ...(getAuthToken() ? { 'Authorization': `Bearer ${getAuthToken()}` } : {})
                },
                body: formData,
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
            const normalizedReason = typeof reason === 'string' ? reason.trim() : '';
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ cancelReason: normalizedReason || 'Không có lý do' }),
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
