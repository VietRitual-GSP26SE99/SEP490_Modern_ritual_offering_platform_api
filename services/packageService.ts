import { ApiPackage, ApiResponse, Product, PackageVariant, CeremonyCategory } from '../types';
import { vendorService, VendorProfile } from './vendorService';
import { getAuthToken } from './auth';


const API_BASE_URL = '/api'; // Use proxy instead of direct URL

class PackageService {
  /**
   * Lấy danh sách packages theo trạng thái từ endpoint by-status
   * @param status - Draft | Pending | Approved | Rejected | ''
   * @returns Promise<ApiPackage[]>
   */
  async getPackagesByStatus(status?: string): Promise<ApiPackage[]> {
    try {
      const token = getAuthToken();
      const query = new URLSearchParams();
      const normalizedStatus = String(status || '').trim();
      if (normalizedStatus) {
        query.set('status', normalizedStatus);
      }

      const endpoint = query.toString()
        ? `${API_BASE_URL}/packages/by-status?${query.toString()}`
        : `${API_BASE_URL}/packages/by-status`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      if (Array.isArray(data)) {
        return data as ApiPackage[];
      }

      if (data?.isSuccess && Array.isArray(data.result)) {
        return data.result as ApiPackage[];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch packages by status:', error);
      return [];
    }
  }

  /**
   * Lấy danh sách tất cả packages
   * @returns Promise<ApiPackage[]>
   */
  async getAllPackages(): Promise<ApiPackage[]> {
    try {
      console.log(' Fetching packages from API...');
      const response = await fetch(`${API_BASE_URL}/packages`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
      });

      console.log(' Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      console.log(' API Response:', data);
      
      if (Array.isArray(data)) {
        console.log(' Packages received:', data.length);
        return data as ApiPackage[];
      }
      
      if (data.isSuccess && data.result) {
        console.log(' Packages received:', data.result.length);
        return data.result;
      } else {
        console.error(' API Error:', data.errorMessages || 'Unknown error');
        return [];
      }
    } catch (error) {
      console.error(' Failed to fetch packages:', error);
      return [];
    }
  }

  /**
   * Lấy chi tiết package theo ID
   * @param id - Package ID
   * @returns Promise<ApiPackage | null>
   */
  async getPackageById(id: string | number): Promise<ApiPackage | null> {
    try {
      const token = getAuthToken();
      const normalizedId = Number(String(id).trim());
      if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
        throw new Error(`Invalid package id: ${id}`);
      }

      console.log(' Fetching package detail for ID:', normalizedId);
      const response = await fetch(`${API_BASE_URL}/packages/${normalizedId}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      console.log(' Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      console.log(' Package detail:', data);
      
      if (!data.isSuccess && (data.packageId !== undefined || data.id !== undefined || data.vendorId !== undefined)) {
        console.log(' Package loaded successfully from raw format');
        return data as ApiPackage;
      }
      
      if (data.isSuccess && data.result) {
        console.log(' Package loaded successfully');
        return data.result;
      } else {
        console.error('❌ API Error:', data.errorMessages || 'Unknown error');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to fetch package:', error);
      return null;
    }
  }

  /**
   * Phê duyệt package (Staff/Admin)
   * @param id - Package ID
   */
  async approvePackage(id: string | number): Promise<boolean> {
    try {
      const token = getAuthToken();
      const normalizedId = Number(String(id).trim());
      const response = await fetch(`${API_BASE_URL}/packages/${normalizedId}/approve`, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return true;
    } catch (error) {
      console.error('Failed to approve package:', error);
      return false;
    }
  }

  /**
   * Từ chối package (Staff/Admin)
   * @param id - Package ID
   * @param reason - Lý do từ chối
   */
  async rejectPackage(id: string | number, reason: string): Promise<boolean> {
    try {
      const token = getAuthToken();
      const normalizedId = Number(String(id).trim());
      const response = await fetch(`${API_BASE_URL}/packages/${normalizedId}/reject`, {
        method: 'POST',
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return true;
    } catch (error) {
      console.error('Failed to reject package:', error);
      return false;
    }
  }

  /**
   * Lấy packages theo category
   * @param categoryId - Category ID (string hoặc number)
   * @returns Promise<ApiPackage[]>
   */
  async getPackagesByCategory(categoryId: string | number): Promise<ApiPackage[]> {
    try {
      const allPackages = await this.getAllPackages();
      const categoryIdNum = typeof categoryId === 'string' ? parseInt(categoryId) : categoryId;
      return allPackages.filter(pkg => pkg.categoryId === categoryIdNum);
    } catch (error) {
      console.error('Failed to filter packages by category:', error);
      return [];
    }
  }

  /**
   * Lấy packages của vendor
   * @param vendorId - Vendor Profile ID
   * @returns Promise<ApiPackage[]>
   */
  async getPackagesByVendor(vendorId: string): Promise<ApiPackage[]> {
    try {
      const allPackages = await this.getAllPackages();
      return allPackages.filter(pkg => (pkg.vendorProfileId === vendorId || (pkg as any).vendorId === vendorId));
    } catch (error) {
      console.error('Failed to filter packages by vendor:', error);
      return [];
    }
  }

  /**
   * Lấy packages đang active
   * @returns Promise<ApiPackage[]>
   */
  async getActivePackages(): Promise<ApiPackage[]> {
    try {
      const allPackages = await this.getAllPackages();
      return allPackages.filter(pkg => pkg.isActive);
    } catch (error) {
      console.error('Failed to get active packages:', error);
      return [];
    }
  }

  /**
   * Chuyển đổi ApiPackage sang Product type (để tương thích với UI hiện tại)
   * @param apiPackage - API Package object
   * @param vendorMap - Optional map of vendorProfileId to VendorProfile
   * @returns Product
   */
  mapToProduct(apiPackage: ApiPackage, vendorMap?: Map<string, VendorProfile>): Product {
    // Find default variant or use first variant for pricing
    const defaultVariant = apiPackage.packageVariants?.[0];
    
    // Parse variants và chuyển description thành items array
    const packageId = apiPackage.packageId ?? (apiPackage as any).id;
    const parsedVariants = apiPackage.packageVariants?.map(variant => {
      console.log('🔍 Processing variant:', variant.variantName, 'Description:', variant.description);

      const rawVariantId = (variant as any).variantId ?? (variant as any).id ?? (variant as any).packageVariantId;
      const resolvedVariantId = (variant as any).id && packageId != null && Number((variant as any).variantId) === Number(packageId)
        ? (variant as any).id
        : rawVariantId;
      
      // Extract items from description
      let items: string[] = [];
      
      if (variant.description) {
        // Thử nhiều patterns khác nhau
        const patterns = [
          /(?:Bao gồm|bao gồm)\s+(.+?)(?:\.|$)/is,          // "Bao gồm ..."
          /(?:gồm|Gồm):\s*(.+?)(?:\.|$)/is,                 // "gồm: ..."
          /(?:Đầy đủ lễ vật cơ bản|lễ vật):\s*(.+?)(?:\.|$)/is,  // "Đầy đủ lễ vật cơ bản: ..."
          /(?:với|Với)\s+(.+?)(?:\.|$)/is,                  // "với ..." (NEW)
          /:\s*(.+?)(?:\.|$)/is                              // Fallback: lấy mọi thứ sau dấu hai chấm
        ];
        
        let itemsText = '';
        for (const pattern of patterns) {
          const match = variant.description.match(pattern);
          if (match && match[1]) {
            itemsText = match[1];
            console.log('🔍 Pattern matched! Items text:', itemsText);
            break;
          }
        }
        
        if (itemsText) {
          // Split theo dấu phẩy và trim
          items = itemsText
            .split(',')
            .map(item => item.trim())
            .filter(item => item.length > 0 && item !== 'và');
          console.log('✅ Parsed items:', items);
        } else {
          console.warn('⚠️ No items found in description');
        }
      }
      
      return {
        variantId: resolvedVariantId,
        packageId: variant.packageId,
        tier: variant.variantName,
        price: variant.price,
        description: variant.description,
        items: items.length > 0 ? items : []
      };
    });
    
    console.log('📦 Final parsed variants:', parsedVariants);
    
    // Get vendor info from map if available
    const vendorId = apiPackage.vendorProfileId || (apiPackage as any).vendorId;
    const vendor = vendorId ? vendorMap?.get(vendorId) : undefined;
    
    // Fallbacks for missing fields
    const pkgId = apiPackage.packageId?.toString() || (apiPackage as any).id?.toString() || defaultVariant?.packageId?.toString() || '';
    const pkgName = apiPackage.packageName || (apiPackage as any).name || defaultVariant?.variantName || 'Mâm cúng truyền thống';
    
    return {
      id: pkgId,
      name: pkgName,
      description: apiPackage.description || 'Mâm cúng truyền thống với đầy đủ lễ vật',
      category: (apiPackage as any).categoryName || (apiPackage as any).ceremonyCategory?.name || this.mapCategoryIdToOccasion(apiPackage.categoryId?.toString() || '1'),
      price: defaultVariant?.price || 2500000,
      image: ((apiPackage as any).imageUrls && (apiPackage as any).imageUrls.length > 0)
        ? ((apiPackage as any).imageUrls[(apiPackage as any).primaryImageIndex || 0] || (apiPackage as any).imageUrls[0])
        : ((apiPackage as any).imageUrl || this.generatePlaceholderImage(pkgId)),
      gallery: ((apiPackage as any).imageUrls && (apiPackage as any).imageUrls.length > 0)
        ? (apiPackage as any).imageUrls
        : this.generateGalleryImages(pkgId),
      rating: apiPackage.ratingAvg || 0,
      reviews: apiPackage.reviewCount || 0,
      totalSold: Number((apiPackage as any).totalSold || 0),
      orders: 0,
      status: apiPackage.isActive ? 'active' : 'inactive',
      tag: apiPackage.isActive ? 'NEW' : undefined,
      variants: parsedVariants,
      vendorId: vendorId,
      vendorName: vendor?.shopName || (vendorId ? `Shop ${vendorId.substring(0, 8)}` : 'Shop'),
    };
  }

  /**
   * Chuyển đổi nhiều ApiPackages sang Products
   * @param apiPackages - Array of API Packages
   * @returns Product[]
   */
  mapToProducts(apiPackages: ApiPackage[]): Product[] {
    return apiPackages.map(pkg => this.mapToProduct(pkg));
  }

  /**
   * Chuyển đổi nhiều ApiPackages sang Products với thông tin vendor
   * @param apiPackages - Array of API Packages
   * @returns Promise<Product[]>
   */
  async mapToProductsWithVendors(apiPackages: ApiPackage[]): Promise<Product[]> {
    try {
      // Lấy danh sách unique vendor IDs
      const vendorIds = [...new Set(apiPackages.map(pkg => pkg.vendorProfileId || (pkg as any).vendorId).filter(id => id))];
      console.log('🏪 Fetching vendors for IDs:', vendorIds);
      
      // Fetch tất cả vendors với error handling cho từng vendor
      const vendorPromises = vendorIds.map(async (id) => {
        try {
          return await vendorService.getVendorCached(id);
        } catch (err) {
          console.warn(`⚠️ Failed to fetch vendor ${id}:`, err);
          return null;
        }
      });
      const vendors = await Promise.all(vendorPromises);
      
      // Tạo vendor map
      const vendorMap = new Map<string, VendorProfile>();
      vendors.forEach((vendor, index) => {
        if (vendor) {
          vendorMap.set(vendorIds[index], vendor);
          console.log(`✅ Loaded vendor: ${vendor.shopName}`);
        }
      });
      
      console.log(`✅ Vendor map created with ${vendorMap.size}/${vendorIds.length} vendors`);
      
      // Map packages to products với vendor info
      return apiPackages.map(pkg => this.mapToProduct(pkg, vendorMap));
    } catch (error) {
      console.error('❌ Error mapping products with vendors:', error);
      // Fallback: map without vendor info (will show vendorProfileId)
      return apiPackages.map(pkg => this.mapToProduct(pkg));
    }
  }

  /**
   * Map categoryId sang Occasion type
   * TODO: Update này khi có mapping chính xác từ backend
   */
  private mapCategoryIdToOccasion(categoryId: string): any {
    const categoryMap: Record<string, string> = {
      '1': 'Cúng Rằm',
      '2': 'Tân Gia',
      '3': 'Khai Trương',
      '4': 'Cúng Giỗ',
      '5': 'Cúng Tết',
    };
    return categoryMap[categoryId] || 'Khác';
  }

  /**
   * Generate placeholder image URL
   * TODO: Replace với actual image URLs từ API
   */
  private generatePlaceholderImage(packageId: string): string {
    return `https://picsum.photos/600/600?random=${packageId}`;
  }

  /**
   * Generate gallery images
   * TODO: Replace với actual gallery từ API
   */
  private generateGalleryImages(packageId: string): string[] {
    return [
      `https://picsum.photos/400/400?random=${packageId}1`,
      `https://picsum.photos/400/400?random=${packageId}2`,
      `https://picsum.photos/400/400?random=${packageId}3`,
      `https://picsum.photos/400/400?random=${packageId}4`,
    ];
  }

  /**
   * Cập nhật package (Vendor) - PUT /api/packages/{id}
   */
  async updatePackage(
    id: string | number,
    payload: {
      packageName: string;
      description: string;
      categoryId: number;
      packageImageUrls: string[];
      primaryImageIndex: number;
      action: string;
      variants: { variantName: string; description: string; price: number }[];
    }
  ): Promise<any> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/packages/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json().catch(() => ({}));
    return data;
  }

  /**
   * Tạo package mới (Draft hoặc Submit) - POST /api/packages
   */
  async createPackage(payload: {
    packageName: string;
    description: string;
    categoryId: number;
    packageImageUrls: string[];
    primaryImageIndex: number;
    action: string;
    variants: { variantName: string; description: string; price: number }[];
  }): Promise<any> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/packages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || `HTTP error! status: ${response.status}`);
    }
    const data: any = await response.json().catch(() => ({}));
    return data;
  }

  /**
   * Upload nhiều ảnh package, trả về danh sách URL ảnh - POST /api/packages/upload-images
   */
  async uploadPackageImages(files: File[]): Promise<string[]> {
    const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1MB 
    const isAnyFileLarge = files.some(f => f.size > MAX_FILE_SIZE);
    if (isAnyFileLarge) {
      throw new Error('Dung lượng ảnh tải lên vượt quá giới hạn 1MB. Vui lòng nén hoặc chọn ảnh nhẹ hơn.');
    }

    const token = getAuthToken();
    const formData = new FormData();
    files.forEach((file) => formData.append('Images', file));

    return new Promise<string[]>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/packages/upload-images`, true);
      xhr.setRequestHeader('Accept', 'application/json, text/plain, */*');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data?.result?.imageUrls && Array.isArray(data.result.imageUrls)) { resolve(data.result.imageUrls); return; }
            if (Array.isArray(data?.result)) { resolve(data.result); return; }
            if (Array.isArray(data?.urls)) { resolve(data.urls); return; }
            if (Array.isArray(data)) { resolve(data); return; }
            resolve([]);
          } catch {
            resolve([]);
          }
        } else {
          try {
            const errObj = JSON.parse(xhr.responseText);
            reject(new Error(errObj.message || errObj.title || `HTTP error! status: ${xhr.status}`));
          } catch {
            reject(new Error(xhr.responseText || `HTTP error! status: ${xhr.status}`));
          }
        }
      };
      
      xhr.onerror = () => {
        console.error('XHR Upload Error');
        reject(new Error('Lỗi mạng khi upload ảnh (Vite Proxy ProxyRes Error). Hãy chắc chắn server Backend đang chạy và ổn định.'));
      };
      
      xhr.send(formData);
    });
  }

  /**
   * Lấy danh sách danh mục đang hoạt động
   * @returns Promise<CeremonyCategory[]>
   */
  async getCeremonyCategories(): Promise<CeremonyCategory[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/ceremony-categories`, {
        method: 'GET',
        headers: {
          Accept: 'application/json, text/plain, */*',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      
      // Handle ApiResponse format
      if (data?.isSuccess && Array.isArray(data.result)) {
        return data.result as CeremonyCategory[];
      }
      
      // Handle raw array format
      if (Array.isArray(data)) {
        return data as CeremonyCategory[];
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch ceremony categories:', error);
      return [];
    }
  }
}

// Export singleton instance
export const packageService = new PackageService();

// Export class for testing purposes
export { PackageService };
