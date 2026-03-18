import { getAuthToken } from './auth';
const API_BASE_URL = '/api';

export interface CreateRefundItem {
    orderItemId: string;
}

export interface RefundRequest {
    orderId: string;
    reason: string;
    proofImages: File[];
    createRefundItems: CreateRefundItem[];
}

export interface RefundItem {
    refundItemId: string;
    orderItemId: string;
    packageName: string;
    variantName: string;
    quantity: number;
    refundAmount: number;
    lineTotal?: number;
}

export interface RefundRecord {
    refundId: string;
    orderId: string;
    orderCode: string;
    customerId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    reason: string;
    proofImages: string[];
    status: 'Pending' | 'Approved' | 'Rejected';
    refundAmount: number;
    orderFinalAmount: number;
    createdAt: string;
    processedAt: string | null;
    processedBy: string | null;
    adminNote: string | null;
    items: RefundItem[];
}

class RefundService {
    private normalizeRefundStatus(rawStatus: unknown): 'Pending' | 'Approved' | 'Rejected' {
        const status = String(rawStatus || '').trim().toLowerCase().replace(/[_\s-]/g, '');

        if (!status) return 'Pending';

        if ([
            'pending',
            'pendingvendor',
            'pendingvendorresponse',
            'vendorpending',
            'submitted',
            'requested'
        ].includes(status)) {
            return 'Pending';
        }

        if ([
            'approved',
            'accept',
            'accepted',
            'resolved'
        ].includes(status)) {
            return 'Approved';
        }

        if ([
            'rejected',
            'reject',
            'declined',
            'denied'
        ].includes(status)) {
            return 'Rejected';
        }

        return 'Pending';
    }

    private getHeaders(): HeadersInit {
        const token = getAuthToken();
        const headers: HeadersInit = {
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
        return headers;
    }

    private getJsonHeaders(): HeadersInit {
        const token = getAuthToken();
        return {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    private mapOrderItemsToRefundItems(rawItems: any[], refundId: string): RefundItem[] {
        if (!Array.isArray(rawItems)) return [];

        return rawItems.map((item: any, index: number) => {
            const quantity = Number(item.quantity) || 1;
            const unitPrice = Number(item.unitPrice ?? item.price) || 0;
            const inferredAmount =
                Number(item.refundAmount)
                || Number(item.lineTotal)
                || Number(item.totalAmount)
                || Number(item.price)
                || Number(item.amount)
                || 0;

            return {
                refundItemId: item.refundItemId || item.id || `${refundId || 'refund'}-order-${index}`,
                orderItemId: item.orderItemId || item.itemId || '',
                packageName: item.packageName || item.package?.packageName || item.productName || item.name || 'N/A',
                variantName: item.variantName || item.variant?.variantName || item.optionName || 'N/A',
                quantity,
                refundAmount: inferredAmount || unitPrice,
            };
        });
    }

    private async fetchOrderItemsByOrderId(orderId: string, refundId: string): Promise<RefundItem[]> {
        if (!orderId) return [];

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'GET',
                headers: this.getJsonHeaders(),
            });

            if (!response.ok) return [];

            const data = await response.json().catch(() => ({}));
            const orderResult = data?.result;
            return this.mapOrderItemsToRefundItems(orderResult?.items || orderResult?.orderItems || [], refundId);
        } catch {
            return [];
        }
    }

    /**
     * Tạo yêu cầu hoàn tiền (customer)
     * POST /api/refunds
     */
    async createRefund(request: RefundRequest): Promise<boolean> {
        try {
            const formData = new FormData();
            formData.append('OrderId', request.orderId);
            formData.append('Reason', request.reason);
            request.proofImages.forEach((file) => {
                formData.append('ProofImages', file);
            });

            request.createRefundItems.forEach((item) => {
                // Đảm bảo truyền đúng field BE nhận
                formData.append('ItemIds', item.orderItemId);
            });

            // Log FormData contents for debugging
            console.log('📤 Refund FormData:');
            for (let pair of formData.entries()) {
                console.log(`  ${pair[0]}: ${pair[1]}`);
            }

            const response = await fetch(`${API_BASE_URL}/refunds`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.isSuccess || data.statusCode === 'OK';
        } catch (error) {
            console.error('Failed to create refund:', error);
            throw error;
        }
    }

    /**
     * Lấy tất cả yêu cầu hoàn tiền (staff/admin)
     * GET /api/refunds
     */
    async getAllRefunds(): Promise<RefundRecord[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/refunds`, {
                method: 'GET',
                headers: this.getJsonHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.isSuccess && data.result) {
                const result = data.result;
                const list = Array.isArray(result) ? result : (Array.isArray(result.items) ? result.items : []);
                const mapped = list.map((item: any) => this.mapRefundRecord(item));

                return await Promise.all(
                    mapped.map(async (record) => {
                        if (record.items.length > 0) return record;

                        const orderItems = await this.fetchOrderItemsByOrderId(record.orderId, record.refundId);
                        if (orderItems.length === 0) return record;

                        return {
                            ...record,
                            items: orderItems,
                        };
                    })
                );
            }
            return [];
        } catch (error) {
            console.error('Failed to fetch refunds:', error);
            throw error;
        }
    }

    /**
     * Lấy chi tiết yêu cầu hoàn tiền
     * GET /api/refunds/:id
     */
    async getRefundById(refundId: string): Promise<RefundRecord | null> {
        try {
            const response = await fetch(`${API_BASE_URL}/refunds/${refundId}`, {
                method: 'GET',
                headers: this.getJsonHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.isSuccess && data.result) {
                const mapped = this.mapRefundRecord(data.result);
                if (mapped.items.length > 0) return mapped;

                const orderItems = await this.fetchOrderItemsByOrderId(mapped.orderId, mapped.refundId);
                return orderItems.length > 0 ? { ...mapped, items: orderItems } : mapped;
            }
            return null;
        } catch (error) {
            console.error('Failed to fetch refund detail:', error);
            throw error;
        }
    }

    /**
     * Duyệt yêu cầu hoàn tiền (staff/admin)
     * PUT /api/refunds/:id/approve
     */
    async approveRefund(refundId: string, note?: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/refunds/${refundId}/approve`, {
                method: 'PUT',
                headers: this.getJsonHeaders(),
                body: JSON.stringify({ adminNote: note || '' }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.isSuccess || data.statusCode === 'OK';
        } catch (error) {
            console.error('Failed to approve refund:', error);
            throw error;
        }
    }

    /**
     * Từ chối yêu cầu hoàn tiền (staff/admin)
     * PUT /api/refunds/:id/reject
     */
    async rejectRefund(refundId: string, reason: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/refunds/${refundId}/reject`, {
                method: 'PUT',
                headers: this.getJsonHeaders(),
                body: JSON.stringify({ adminNote: reason }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.isSuccess || data.statusCode === 'OK';
        } catch (error) {
            console.error('Failed to reject refund:', error);
            throw error;
        }
    }

    /**
     * Vendor phản hồi yêu cầu hoàn tiền
     * PUT /api/refunds/{id}/vendor-respond
     */
    async vendorRespondRefund(refundId: string, isAccept: boolean, vendorNote?: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/refunds/${refundId}/vendor-respond`, {
                method: 'PUT',
                headers: this.getJsonHeaders(),
                body: JSON.stringify({
                    isAccept,
                    vendorNote: vendorNote || ''
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json().catch(() => ({}));
            return data.isSuccess || data.statusCode === 'OK' || response.ok;
        } catch (error) {
            console.error('Failed to vendor respond refund:', error);
            throw error;
        }
    }

    private mapRefundRecord(raw: any): RefundRecord {
        const refundId = raw.refundId || raw.id || '';

        const rawItemsSource = raw.refundItems
            || raw.items
            || raw.refundItemDtos
            || raw.refundDetails
            || raw.orderItems
            || raw.createRefundItems
            || [];

        const normalizedItems = this.mapOrderItemsToRefundItems(rawItemsSource, refundId);

        const fallbackItem =
            normalizedItems.length === 0 && (raw.packageName || raw.productName || raw.itemName)
                ? [{
                    refundItemId: `${refundId || 'refund'}-fallback`,
                    orderItemId: '',
                    packageName: raw.packageName || raw.productName || raw.itemName || 'N/A',
                    variantName: raw.variantName || raw.optionName || 'N/A',
                    quantity: Number(raw.quantity) || 1,
                    refundAmount: Number(raw.refundAmount || raw.amount) || 0,
                }]
                : [];

        return {
            refundId,
            orderId: raw.orderId || '',
            orderCode: raw.orderCode || raw.orderId?.substring(0, 8).toUpperCase() || '',
            customerId: raw.customerId || raw.customer?.profileId || '',
            customerName: raw.customerName || raw.customer?.fullName || 'Khách hàng',
            customerEmail: raw.customerEmail || raw.customer?.email || '',
            customerPhone: raw.customerPhone || raw.customer?.phoneNumber || '',
            reason: raw.reason || '',
            proofImages: Array.isArray(raw.proofImages) ? raw.proofImages : [],
            status: this.normalizeRefundStatus(raw.status),
            refundAmount: Number(
                raw.totalAmount
                ?? raw.refundAmount
            ) || 0,
            orderFinalAmount: Number(
                raw.orderFinalAmount
                ?? raw.finalAmount
                ?? raw.totalAmount
            ) || 0,
            createdAt: raw.createdAt || new Date().toISOString(),
            processedAt: raw.processedAt || null,
            processedBy: raw.processedBy || null,
            adminNote: raw.adminNote || null,
            items: normalizedItems.length > 0 ? normalizedItems : fallbackItem,
        };
    }
}

export const refundService = new RefundService();
export default refundService;
