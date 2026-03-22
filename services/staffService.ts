import { getAuthToken } from './auth';

const API_BASE_URL = '/api';

export interface VendorVerification {
  profileId: string;
  fullName: string;
  phoneNumber: string;
  shopAvatarUrl: string | null;
  shopName: string;
  businessType: string;
  verificationStatus: 'Inactive' | 'Pending' | 'Verified' | 'Rejected';
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDocument {
  documentId: string;
  documentType: string;
  documentTypeName: string;
  fileUrl: string;
  status: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
  uploadedAt: string;
}

export interface VendorVerificationDetail extends VendorVerification {
  userId: string;
  gender: string | null;
  dateOfBirth: string | null;
  identityCardNumber: string | null;
  shopDescription: string;
  shopAddressText: string;
  shopLatitude: number;
  shopLongitude: number;
  dailyCapacity: number;
  taxCode: string;
  vendorStatus: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  documents: VendorDocument[];
}

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
    'Inactive': 'Không hoạt động',
    'Pending': 'Chờ duyệt',
    'Verified': 'Đã xác minh',
    'Rejected': 'Đã từ chối'
};

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
    'Individual': 'Cá nhân',
    'HouseholdBusiness': 'Hộ gia đình kinh doanh',
    'HouseholdBussiness': 'Hộ gia đình kinh doanh',
    'Enterprise': 'Doanh nghiệp'
};

class StaffService {
    private getHeaders(): HeadersInit {
        const token = getAuthToken();
        return {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    async getVendorVerifications(status?: string): Promise<VendorVerification[]> {
        try {
            const url = status 
                ? `${API_BASE_URL}/staff/vendor-verifications?status=${status}` 
                : `${API_BASE_URL}/staff/vendor-verifications`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.result || [];
        } catch (error) {
            console.error('Failed to fetch vendor verifications:', error);
            throw error;
        }
    }

    async getVendorVerificationDetail(profileId: string): Promise<VendorVerificationDetail> {
        try {
            const response = await fetch(`${API_BASE_URL}/staff/vendor-verifications/${profileId}`, {
                method: 'GET',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.result;
        } catch (error) {
            console.error('Failed to fetch vendor verification detail:', error);
            throw error;
        }
    }

    async approveVendor(profileId: string, staffNote?: string): Promise<boolean> {
        try {
            const url = staffNote 
                ? `${API_BASE_URL}/staff/vendor-verifications/${profileId}/approve?staffNote=${encodeURIComponent(staffNote)}`
                : `${API_BASE_URL}/staff/vendor-verifications/${profileId}/approve`;
                
            const response = await fetch(url, {
                method: 'PUT',
                headers: this.getHeaders(),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.isSuccess;
        } catch (error) {
            console.error('Failed to approve vendor:', error);
            throw error;
        }
    }

    async rejectVendor(profileId: string, rejectionReason: string, staffNote?: string): Promise<boolean> {
        try {
            const response = await fetch(`${API_BASE_URL}/staff/vendor-verifications/${profileId}/reject`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ 
                    isApprove: false, 
                    rejectionReason, 
                    staffNote 
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.errorMessages?.[0] || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.isSuccess;
        } catch (error) {
            console.error('Failed to reject vendor:', error);
            throw error;
        }
    }
}

export const staffService = new StaffService();
