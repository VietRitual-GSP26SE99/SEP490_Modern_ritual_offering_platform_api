import { ApiPackage, ApiResponse, Product, PackageVariant } from '../types';


const API_BASE_URL = 'https://vietritual.click/api';

class PackageService {
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

      const data: ApiResponse<ApiPackage[]> = await response.json();
      console.log(' API Response:', data);
      console.log(' Packages received:', data.result?.length || 0);
      
      if (data.isSuccess && data.result) {
        return data.result;
      } else {
        console.error(' API Error:', data.errorMessages);
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
  async getPackageById(id: string): Promise<ApiPackage | null> {
    try {
      console.log(' Fetching package detail for ID:', id);
      const response = await fetch(`${API_BASE_URL}/packages/${id}`, {
        method: 'GET',
        headers: {
          'Accept': 'text/plain',
        },
      });

      console.log(' Response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ApiResponse<ApiPackage> = await response.json();
      console.log(' Package detail:', data);
      
      if (data.isSuccess && data.result) {
        console.log(' Package loaded successfully');
        return data.result;
      } else {
        console.error('❌ API Error:', data.errorMessages);
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to fetch package:', error);
      return null;
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
      return allPackages.filter(pkg => pkg.vendorProfileId === vendorId);
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
   * @returns Product
   */
  mapToProduct(apiPackage: ApiPackage): Product {
    // Find default variant or use first variant for pricing
    const defaultVariant = apiPackage.packageVariants?.[0];
    
    // Parse variants và chuyển description thành items array
    const parsedVariants = apiPackage.packageVariants?.map(variant => {
      console.log('🔍 Processing variant:', variant.variantName, 'Description:', variant.description);
      
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
        variantId: variant.variantId,
        packageId: variant.packageId,
        tier: variant.variantName,
        price: variant.price,
        description: variant.description,
        items: items.length > 0 ? items : []
      };
    });
    
    console.log('📦 Final parsed variants:', parsedVariants);
    
    return {
      id: apiPackage.packageId.toString(),
      name: apiPackage.packageName,
      description: apiPackage.description || 'Mâm cúng truyền thống với đầy đủ lễ vật',
      category: this.mapCategoryIdToOccasion(apiPackage.categoryId.toString()),
      price: defaultVariant?.price || 2500000,
      image: this.generatePlaceholderImage(apiPackage.packageId.toString()),
      gallery: this.generateGalleryImages(apiPackage.packageId.toString()),
      rating: 4.8,
      reviews: 128,
      tag: apiPackage.isActive ? 'NEW' : undefined,
      variants: parsedVariants,
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
   * Map categoryId sang Occasion type
   * TODO: Update này khi có mapping chính xác từ backend
   */
  private mapCategoryIdToOccasion(categoryId: string): any {
    const categoryMap: Record<string, string> = {
      '1': 'Full Moon',
      '2': 'House Warming',
      '3': 'Grand Opening',
      '4': 'Ancestral',
      '5': 'Year End',
    };
    return categoryMap[categoryId] || 'Full Moon';
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
}

// Export singleton instance
export const packageService = new PackageService();

// Export class for testing purposes
export { PackageService };
