import { ApiResponse } from '../types';

const API_BASE_URL = '/api';

export interface BannerResponse {
  bannerId: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  linkType: 'Ritual' | 'Package' | 'Vendor' | string;
  linkTargetId: number;
  position: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

class BannerService {
  /**
   * Lấy danh sách banner đang hoạt động cho trang chủ.
   */
  async getActiveBanners(): Promise<ApiResponse<BannerResponse[]>> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/banners/active`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch active banners:', error);
      return { 
        isSuccess: false, 
        statusCode: '500', 
        errorMessages: ['Không thể tải danh sách banner'], 
        result: [] 
      };
    }
  }

  /**
   * Lấy TẤT CẢ banner (dành cho Staff/Admin)
   */
  async getAllBanners(): Promise<ApiResponse<BannerResponse[]>> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`${API_BASE_URL}/banners`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to fetch all banners:', error);
      return { 
        isSuccess: false, 
        statusCode: '500', 
        errorMessages: ['Không thể tải toàn bộ danh sách banner'], 
        result: [] 
      };
    }
  }

  /**
   * Lấy chi tiết 1 banner
   */
  async getBannerById(id: number): Promise<ApiResponse<BannerResponse>> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      return await response.json();
    } catch (error) {
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi khi lấy chi tiết banner'], result: undefined as any };
    }
  }

  /**
   * Tạo banner mới
   */
  async createBanner(formData: FormData): Promise<ApiResponse<BannerResponse>> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/banners`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // KHÔNG đặt Content-Type khi gửi FormData để trình duyệt tự thêm boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Error response:', response.status, errorData);
        return { 
          isSuccess: false, 
          statusCode: response.status.toString(), 
          errorMessages: errorData.errorMessages || ['Lỗi khi tạo banner'], 
          result: undefined as any 
        };
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Request failed:', error);
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi kết nối hoặc kích thước ảnh quá lớn'], result: undefined as any };
    }
  }

  /**
   * Cập nhật banner
   */
  async updateBanner(id: number, formData: FormData): Promise<ApiResponse<BannerResponse>> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
          // KHÔNG đặt Content-Type ở đây
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          isSuccess: false, 
          statusCode: response.status.toString(), 
          errorMessages: errorData.errorMessages || ['Lỗi khi cập nhật banner'], 
          result: undefined as any 
        };
      }

      return await response.json();
    } catch (error) {
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi kết nối khi cập nhật banner'], result: undefined as any };
    }
  }

  /**
   * Xóa banner
   */
  async deleteBanner(id: number): Promise<ApiResponse<boolean>> {
    try {
      const token = localStorage.getItem('smart-child-token');
      const response = await fetch(`${API_BASE_URL}/banners/${id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      return await response.json();
    } catch (error) {
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi khi xóa banner'], result: false };
    }
  }

  /**
   * Tiện ích URL
   */
  getNavigationUrl(banner: BannerResponse): string {
    const { linkType, linkTargetId, linkUrl } = banner;
    if (linkUrl && linkUrl.startsWith('http')) return linkUrl;
    switch (linkType) {
      case 'Ritual': return `/ritual/${linkTargetId}`;
      case 'Package': return `/package/${linkTargetId}`;
      case 'Vendor': return `/vendor/${linkTargetId}`;
      default: return linkUrl || '/';
    }
  }
}

export const bannerService = new BannerService();
