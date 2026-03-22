import { ApiResponse } from '../types';

const API_BASE_URL = '/api';

export interface VendorProfile {
  profileId: string;
  shopName: string;
  shopDescription?: string;
  avatarUrl?: string | null;
  shopAvatarUrl?: string | null;
  businessType?: string;
  shopAddressText?: string;
  ratingAvg?: number;
  dailyCapacity?: number;
  tierName?: string;
  createdAt: string;
  
  // Optional/Legacy fields (keep for compatibility or if used elsewhere)
  vendorProfileId?: string; 
  responseRate?: number;
  joinedDate?: string;
  productCount?: number;
  responseTime?: string;
  followerCount?: number;
  rating?: number; // legacy
  isActive?: boolean; // legacy
}

export interface VendorTier {
  tierId: number;
  tierName: string;
  commissionRate: number;
  minCompletedOrders: number;
  minRevenueAmount: number;
  minRatingAvg: number;
  description: string;
  isActive: boolean;
}

class VendorService {
  // Feature flag: enable vendor API since it is now available
  private enableVendorApi = true;
  
  /**
   * Lấy thông tin vendor theo ID
   * @param vendorProfileId - Vendor Profile ID
   * @returns Promise<VendorProfile | null>
   */
  async getVendorById(vendorProfileId: string): Promise<VendorProfile | null> {
    // Return null if vendor API is disabled
    if (!this.enableVendorApi) {
      console.log('⚠️ Vendor API is disabled');
      return null;
    }
    
    try {
      console.log('📦 Fetching vendor profile:', vendorProfileId);
      const response = await fetch(`${API_BASE_URL}/vendors/${vendorProfileId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`⚠️ Vendor API returned ${response.status} for ${vendorProfileId}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<VendorProfile> = await response.json();
      
      if (data.isSuccess && data.result) {
        console.log('✅ Vendor profile loaded:', data.result);
        return data.result;
      } else {
        console.error('❌ API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to fetch vendor:', error);
      return null;
    }
  }

  /**
   * Lấy tất cả vendors
   * @returns Promise<VendorProfile[]>
   */
  async getAllVendors(): Promise<VendorProfile[]> {
    try {
      console.log('📦 Fetching all vendors...');
      const response = await fetch(`${API_BASE_URL}/vendors`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<VendorProfile[]> = await response.json();
      
      if (data.isSuccess && data.result) {
        console.log('✅ Vendors loaded:', data.result.length);
        return data.result;
      } else {
        console.error('❌ API Error:', data.errorMessages);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch vendors:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách tất cả hạng vendor.
   * GET /api/vendor-tiers
   */
  async getVendorTiers(): Promise<VendorTier[]> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/vendor-tiers`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<VendorTier[]> = await response.json();
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error('❌ API Error:', data.errorMessages);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch vendor tiers:', error);
      return [];
    }
  }

  /**
   * Lấy chi tiết 1 hạng vendor.
   * GET /api/vendor-tiers/{id}
   */
  async getVendorTierById(id: number): Promise<VendorTier | null> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/vendor-tiers/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<VendorTier> = await response.json();
      return data.isSuccess ? data.result : null;
    } catch (error) {
      console.error(`❌ Failed to fetch vendor tier ${id}:`, error);
      return null;
    }
  }

  /**
   * Cập nhật hạng vendor (Admin only).
   * PUT /api/vendor-tiers/{id}
   */
  async updateVendorTier(id: number, tierData: Partial<VendorTier>): Promise<boolean> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/vendor-tiers/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tierData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<unknown> = await response.json();
      return data.isSuccess;
    } catch (error) {
      console.error(`❌ Failed to update vendor tier ${id}:`, error);
      return false;
    }
  }

  /**
   * Tạo hạng vendor mới (Admin only).
   * POST /api/vendor-tiers
   */
  async createVendorTier(tierData: Partial<VendorTier>): Promise<boolean> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/vendor-tiers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(tierData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<unknown> = await response.json();
      return data.isSuccess;
    } catch (error) {
      console.error('❌ Failed to create vendor tier:', error);
      return false;
    }
  }

  /**
   * Xóa hạng vendor (Admin only).
   * DELETE /api/vendor-tiers/{id}
   */
  async deleteVendorTier(id: number): Promise<boolean> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/vendor-tiers/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<unknown> = await response.json();
      return data.isSuccess;
    } catch (error) {
      console.error(`❌ Failed to delete vendor tier ${id}:`, error);
      throw error; // Rethrow to handle specific error message in UI
    }
  }

  // Cache để tránh gọi API nhiều lần
  private vendorCache: Map<string, VendorProfile> = new Map();

  /**
   * Lấy vendor từ cache hoặc API
   */
  async getVendorCached(vendorProfileId: string): Promise<VendorProfile | null> {
    if (this.vendorCache.has(vendorProfileId)) {
      return this.vendorCache.get(vendorProfileId)!;
    }

    const vendor = await this.getVendorById(vendorProfileId);
    if (vendor) {
      this.vendorCache.set(vendorProfileId, vendor);
    }
    return vendor;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.vendorCache.clear();
  }
}

export const vendorService = new VendorService();
