// Geocoding Service using OpenStreetMap Nominatim (FREE) + Google Maps fallback
// 
// PRIMARY: OpenStreetMap Nominatim - HOÀN TOÀN MIỄN PHÍ
// - Endpoint: https://nominatim.openstreetmap.org/search
// - Không cần API key
// - Unlimited requests (với rate limiting hợp lý)
// - Độ chính xác cao cho Việt Nam
//
// FALLBACK: Google Maps (nếu có API key)
// - Chỉ dùng khi Nominatim không tìm được kết quả
//
export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  provider: 'nominatim' | 'google' | 'approximate';
}

// Nominatim (OpenStreetMap) Response
export interface NominatimResponse {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: string[];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
}

// Google Maps Response (fallback)
export interface GoogleMapsResponse {
  results: {
    formatted_address: string;
    geometry: {
      location: {
        lat: number;
        lng: number;
      };
    };
  }[];
  status: string;
}

class GeocodingService {
  private googleApiKey: string;

  constructor() {
    this.googleApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    console.log('🗺️  Geocoding Service initialized');
    console.log('📍 Primary: OpenStreetMap Nominatim (FREE)');
    console.log('🔑 Fallback: Google Maps', this.googleApiKey ? '(Configured)' : '(Not configured)');
  }

  /**
   * Kiểm tra xem Google API key có được cấu hình không (for fallback)
   */
  private isGoogleApiKeyConfigured(): boolean {
    return !!this.googleApiKey && this.googleApiKey.trim() !== '';
  }

  /**
   * PRIMARY: Geocoding sử dụng OpenStreetMap Nominatim (MIỄN PHÍ)
   * @param address - Địa chỉ đầy đủ
   * @returns Tọa độ từ Nominatim
   */
  private async geocodeWithNominatim(address: string): Promise<GeocodingResult | null> {
    try {
      const encodedAddress = encodeURIComponent(address);
      // Nominatim API - HOÀN TOÀN MIỄN PHÍ
      // Thêm nhiều tham số để tăng độ chính xác
      const url = `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=5&countrycodes=vn&addressdetails=1&extratags=1&namedetails=1&polygon_geojson=0`;
      
      console.log('🗺️  Calling Nominatim (OpenStreetMap) API:', address);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Modern-Ritual-Offering-Platform/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Nominatim API error: ${response.status}`);
      }
      
      const data: NominatimResponse[] = await response.json();
      
      console.log('📍 Nominatim response:', data);
      
      if (data && data.length > 0) {
        // STEP 1: Tìm kết quả khớp chính xác với từ khóa nhập vào
        let bestResult = data[0];
        
        // Lấy từ khóa quan trọng từ query (bỏ "Vietnam", dấu phẩy, từ quá ngắn)
        const originalQuery = decodeURIComponent(address.toLowerCase())
          .replace(/,?\s*vietnam\s*$/i, '') // Bỏ "Vietnam" cuối chuỗi
          .replace(/[,\(\)]/g, ' '); // Thay dấu phẩy, ngoặc bằng space
        
        const queryKeywords = originalQuery.split(/\s+/)
          .filter(word => word.length > 2) // Bỏ từ quá ngắn
          .filter(word => !['tỉnh', 'huyện', 'xã', 'phường', 'thôn'].includes(word)); // Bỏ từ chung chung
        
        console.log('🔍 Analyzing query keywords:', queryKeywords);
        
        let bestMatchScore = 0;
        
        for (const result of data) {
          const displayName = result.display_name.toLowerCase();
          
          // Đếm số từ khóa khớp chính xác (exact match)
          const exactMatches = queryKeywords.filter(keyword => 
            displayName.includes(keyword)
          ).length;
          
          // Tính điểm khớp: exact matches + importance bonus
          const matchScore = exactMatches + (result.importance * 0.1);
          
          console.log(`📊 Result analysis:`, {
            address: result.display_name.substring(0, 80),
            exactMatches: exactMatches,
            importance: result.importance,
            matchScore: matchScore
          });
          
          // Ưu tiên kết quả có điểm khớp cao nhất
          if (matchScore > bestMatchScore) {
            bestMatchScore = matchScore;
            bestResult = result;
          }
        }
        
        // STEP 2: Validate kết quả có phù hợp với input không
        const selectedAddress = bestResult.display_name.toLowerCase();
        const matchedKeywords = queryKeywords.filter(keyword => 
          selectedAddress.includes(keyword)
        );
        
        const matchRatio = queryKeywords.length > 0 ? matchedKeywords.length / queryKeywords.length : 0;
        
        // Cảnh báo nếu quá ít từ khóa khớp
        if (matchRatio < 0.4 && queryKeywords.length > 1) {
          console.warn(`⚠️ Low match ratio (${Math.round(matchRatio * 100)}%):`, {
            input: originalQuery,
            result: bestResult.display_name,
            expectedKeywords: queryKeywords,
            matchedKeywords: matchedKeywords
          });
        }
        
        console.log('🎯 Final selected result:', {
          display_name: bestResult.display_name,
          class: bestResult.class,
          type: bestResult.type,
          importance: bestResult.importance,
          matchRatio: `${Math.round(matchRatio * 100)}%`,
          matchedKeywords: matchedKeywords
        });
        
        return {
          latitude: parseFloat(bestResult.lat),
          longitude: parseFloat(bestResult.lon),
          formattedAddress: bestResult.display_name,
          provider: 'nominatim'
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Nominatim error:', error);
      throw error;
    }
  }

  /**
   * FALLBACK: Geocoding sử dụng Google Maps (nếu có API key)
   * @param address - Địa chỉ đầy đủ
   * @returns Tọa độ từ Google Maps
   */
  private async geocodeWithGoogle(address: string): Promise<GeocodingResult | null> {
    if (!this.isGoogleApiKeyConfigured()) {
      return null;
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${this.googleApiKey}&region=VN&language=vi`;
      
      console.log('🗺️  Calling Google Maps API as fallback:', address);
      
      const response = await fetch(url);
      const data: GoogleMapsResponse = await response.json();

      console.log('📍 Google Maps response:', data);

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
          provider: 'google'
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Google Maps error:', error);
      return null;
    }
  }

  /**
   * MAIN: Geocoding với nhiều provider (Nominatim -> Google -> Approximate)
   * @param address - Địa chỉ đầy đủ
   * @returns Tọa độ latitude và longitude
   */
  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim() === '') {
      throw new Error('Địa chỉ không được để trống');
    }

    try {
      // TRY 1: OpenStreetMap Nominatim (FREE)
      console.log('🚀 Trying Nominatim (OpenStreetMap) first...');
      const nominatimResult = await this.geocodeWithNominatim(address);
      if (nominatimResult) {
        console.log('✅ Success with Nominatim!');
        return nominatimResult;
      }
      
      // TRY 2: Google Maps (fallback if configured)
      if (this.isGoogleApiKeyConfigured()) {
        console.log('⏭️  Nominatim failed, trying Google Maps fallback...');
        const googleResult = await this.geocodeWithGoogle(address);
        if (googleResult) {
          console.log('✅ Success with Google Maps fallback!');
          return googleResult;
        }
      }
      
      // TRY 3: Approximate coordinates từ tên tỉnh
      console.log('⏭️  Both services failed, trying approximate coordinates...');
      const addressParts = address.split(',');
      for (const part of addressParts.reverse()) {
        const trimmedPart = part.trim();
        const approximateResult = this.getApproximateCoordinates(trimmedPart);
        if (approximateResult) {
          console.log('✅ Success with approximate coordinates!');
          return approximateResult;
        }
      }
      
      throw new Error('Không tìm được tọa độ cho địa chỉ này');
    } catch (error) {
      console.error('❌ All geocoding methods failed:', error);
      throw error;
    }
  }

  /**
   * ENHANCED: Geocoding với multi-query strategy (thử nhiều cách tìm kiếm)
   * @param components - Các thành phần địa chỉ riêng biệt 
   * @returns Tọa độ với độ chính xác cao nhất có thể
   */
  async geocodeAddressComponents(components: {
    detailedAddress?: string;
    wardName?: string;
    districtName?: string;
    provinceName?: string;
  }): Promise<GeocodingResult | null> {
    const searchQueries = this.generateSearchQueries(components);
    
    // Thử từng query cho đến khi tìm được kết quả
    for (let i = 0; i < searchQueries.length; i++) {
      const query = searchQueries[i];
      console.log(`🔍 Trying query ${i + 1}/${searchQueries.length}:`, query);
      
      try {
        // Thử Nominatim trước
        const nominatimResult = await this.geocodeWithNominatim(query);
        if (nominatimResult) {
          console.log(`✅ Success with query ${i + 1} (Nominatim)!`);
          return {
            ...nominatimResult,
            formattedAddress: nominatimResult.formattedAddress
          };
        }
        
        // Fallback Google Maps nếu được cấu hình
        if (this.isGoogleApiKeyConfigured()) {
          const googleResult = await this.geocodeWithGoogle(query);
          if (googleResult) {
            console.log(`✅ Success with query ${i + 1} (Google Maps)!`);
            return googleResult;
          }
        }
        
        // Delay nhỏ giữa các requests để tránh rate limit
        if (i < searchQueries.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      } catch (error) {
        console.warn(`⚠️ Query ${i + 1} failed:`, error);
        // Tiếp tục với query tiếp theo
      }
    }
    
    // Cuối cùng thử approximate coordinates
    if (components.provinceName) {
      console.log('🔄 All queries failed, using approximate coordinates...');
      const approximateResult = this.getApproximateCoordinates(components.provinceName);
      if (approximateResult) {
        return approximateResult;
      }
    }
    
    throw new Error('Không tìm thấy tọa độ cho địa chỉ này từ tất cả các phương pháp');
  }

  /**
   * Shortcut method -只用 Nominatim (khuyến nghị)
   */
  async geocodeWithNominatimOnly(address: string): Promise<GeocodingResult | null> {
    if (!address || address.trim() === '') {
      throw new Error('Địa chỉ không được để trống');
    }

    return await this.geocodeWithNominatim(address);
  }

  /**
   * Tạo nhiều query variations để tăng khả năng tìm thấy kết quả
   * Ưu tiên giữ nguyên từ khóa quan trọng (số tòa, tên đường cụ thể)
   * @param components - Các thành phần địa chỉ
   * @returns Array của các query string khác nhau
   */
  private generateSearchQueries(components: {
    detailedAddress?: string;
    wardName?: string;
    districtName?: string;
    provinceName?: string;
  }): string[] {
    const queries: string[] = [];
    
    // Query 1: Địa chỉ đầy đủ (ưu tiên cao nhất - giữ nguyên từ khóa)
    const fullAddress = this.buildFullAddress(components);
    queries.push(fullAddress);
    
    // Query 2: Địa chỉ chi tiết + huyện + tỉnh (bỏ xã để tránh confuse)
    if (components.detailedAddress && components.districtName && components.provinceName) {
      queries.push(`${components.detailedAddress}, ${components.districtName}, ${components.provinceName}, Vietnam`);
    }
    
    // Query 3: Chỉ địa chỉ chi tiết + tỉnh (cho trường hợp địa chỉ nổi tiếng)
    if (components.detailedAddress && components.provinceName) {
      queries.push(`${components.detailedAddress}, ${components.provinceName}, Vietnam`);
    }
    
    // Query 4: Phường/xã + huyện + tỉnh (fallback khi địa chỉ chi tiết không có)
    if (components.wardName && components.districtName && components.provinceName) {
      queries.push(`${components.wardName}, ${components.districtName}, ${components.provinceName}, Vietnam`);
    }
    
    // Query 5: Chỉ huyện + tỉnh  
    if (components.districtName && components.provinceName) {
      queries.push(`${components.districtName}, ${components.provinceName}, Vietnam`);
    }
    
    // Query 6: Chỉ tỉnh (fallback cuối cùng)
    if (components.provinceName) {
      queries.push(`${components.provinceName}, Vietnam`);
    }
    
    console.log('🔍 Generated search queries (priority order):', queries);
    return queries;
  }
  buildFullAddress(components: {
    detailedAddress?: string;
    wardName?: string;
    districtName?: string;
    provinceName?: string;
  }): string {
    const parts: string[] = [];
    
    if (components.detailedAddress) {
      parts.push(components.detailedAddress);
    }
    if (components.wardName) {
      parts.push(components.wardName);
    }
    if (components.districtName) {
      parts.push(components.districtName);
    }
    if (components.provinceName) {
      parts.push(components.provinceName);
    }
    
    // Thêm "Vietnam" để tăng độ chính xác
    parts.push('Vietnam');
    
    return parts.join(', ');
  }

  /**
   * Ước lượng tọa độ dựa trên tên tỉnh/thành (fallback khi không có Google Maps API)
   * Chỉ là ước lượng gần đúng, không chính xác như Google Maps
   */
  getApproximateCoordinates(provinceName: string, districtName?: string): GeocodingResult | null {
    const provinceCoords: { [key: string]: { lat: number, lng: number } } = {
      'Hồ Chí Minh': { lat: 10.8231, lng: 106.6297 },
      'Hà Nội': { lat: 21.0285, lng: 105.8542 },
      'Đà Nẵng': { lat: 16.0544, lng: 108.2022 },
      'Hải Phòng': { lat: 20.8449, lng: 106.6881 },
      'Cần Thơ': { lat: 10.0452, lng: 105.7469 },
      'Lâm Đồng': { lat: 11.5753, lng: 108.1429 },
      'An Giang': { lat: 10.5215, lng: 105.1258 },
      'Bà Rịa - Vũng Tàu': { lat: 10.5417, lng: 107.2429 },
      'Bạc Liêu': { lat: 9.2948, lng: 105.7278 },
      'Bắc Giang': { lat: 21.2731, lng: 106.1946 },
      'Bắc Kạn': { lat: 22.1471, lng: 105.8348 },
      'Bắc Ninh': { lat: 21.1861, lng: 106.0763 },
      'Bến Tre': { lat: 10.2434, lng: 106.3757 },
      'Bình Định': { lat: 13.7765, lng: 109.2216 },
      'Bình Dương': { lat: 11.3254, lng: 106.4772 },
      'Bình Phước': { lat: 11.7511, lng: 106.7234 },
      'Bình Thuận': { lat: 11.0904, lng: 108.0721 },
      'Cà Mau': { lat: 9.1768, lng: 105.1524 },
      'Cao Bằng': { lat: 22.6663, lng: 106.2525 },
      'Đắk Lắk': { lat: 12.7100, lng: 108.2378 },
      'Đắk Nông': { lat: 12.2646, lng: 107.6098 },
      'Điện Biên': { lat: 21.8042, lng: 103.2287 },
      'Đồng Nai': { lat: 11.0686, lng: 107.1676 },
      'Đồng Tháp': { lat: 10.4938, lng: 105.6881 },
      'Gia Lai': { lat: 13.8078, lng: 108.1099 },
      'Hà Giang': { lat: 22.8025, lng: 104.9784 },
      'Hà Nam': { lat: 20.5835, lng: 105.9230 },
      'Hà Tĩnh': { lat: 18.2943, lng: 105.8752 },
      'Hải Dương': { lat: 20.9339, lng: 106.3147 },
      'Hậu Giang': { lat: 9.7571, lng: 105.6412 },
      'Hòa Bình': { lat: 20.6861, lng: 105.3389 },
      'Hưng Yên': { lat: 20.6464, lng: 106.0169 },
      'Khánh Hòa': { lat: 12.2585, lng: 109.0526 },
      'Kiên Giang': { lat: 10.0125, lng: 105.0439 },
      'Kon Tum': { lat: 14.3497, lng: 107.9651 },
      'Lai Châu': { lat: 22.3686, lng: 103.4570 },
      'Long An': { lat: 10.6956, lng: 106.2431 },
      'Nam Định': { lat: 20.4388, lng: 106.1621 },
      'Nghệ An': { lat: 19.2342, lng: 104.9200 },
      'Ninh Bình': { lat: 20.2506, lng: 105.9745 },
      'Ninh Thuận': { lat: 11.6738, lng: 108.8629 },
      'Phú Thọ': { lat: 21.2680, lng: 105.2045 },
      'Phú Yên': { lat: 13.0881, lng: 109.0928 },
      'Quảng Bình': { lat: 17.4648, lng: 106.3921 },
      'Quảng Nam': { lat: 15.5394, lng: 108.0191 },
      'Quảng Ngãi': { lat: 15.1214, lng: 108.8050 },
      'Quảng Ninh': { lat: 21.0064, lng: 107.2925 },
      'Quảng Trị': { lat: 16.7403, lng: 107.1851 },
      'Sóc Trăng': { lat: 9.6003, lng: 105.9739 },
      'Sơn La': { lat: 21.3273, lng: 103.9188 },
      'Tây Ninh': { lat: 11.3100, lng: 106.0950 },
      'Thái Bình': { lat: 20.4463, lng: 106.3365 },
      'Thái Nguyên': { lat: 21.5944, lng: 105.8480 },
      'Thanh Hóa': { lat: 19.8006, lng: 105.7851 },
      'Thừa Thiên Huế': { lat: 16.4637, lng: 107.5909 },
      'Tiền Giang': { lat: 10.4493, lng: 106.3420 },
      'Trà Vinh': { lat: 9.9477, lng: 106.3472 },
      'Tuyên Quang': { lat: 21.7767, lng: 105.2280 },
      'Vĩnh Long': { lat: 10.2397, lng: 105.9571 },
      'Vĩnh Phúc': { lat: 21.3608, lng: 105.6049 },
      'Yên Bái': { lat: 21.7168, lng: 104.8986 }
    };

    // Tìm theo tên chính xác trước
    const exactMatch = provinceCoords[provinceName];
    if (exactMatch) {
      return {
        latitude: exactMatch.lat,
        longitude: exactMatch.lng,
        formattedAddress: `${provinceName}, Vietnam (ước lượng)`,
        provider: 'approximate'
      };
    }

    // Tìm theo tên gần đúng
    const fuzzyMatch = Object.keys(provinceCoords).find(key => 
      key.toLowerCase().includes(provinceName.toLowerCase()) || 
      provinceName.toLowerCase().includes(key.toLowerCase())
    );

    if (fuzzyMatch) {
      const coords = provinceCoords[fuzzyMatch];
      return {
        latitude: coords.lat,
        longitude: coords.lng,
        formattedAddress: `${fuzzyMatch}, Vietnam (ước lượng)`,
        provider: 'approximate'
      };
    }

    return null;
  }

  /**
   * Trích xuất từ khóa quan trọng từ query, loại bỏ stop words
   * Ưu tiên giữ lại số nhà, tên tòa, tên đường cụ thể
   * @param query - Câu query để trích xuất keyword
   * @returns Array các từ khóa đã được filter
   */
  private extractKeywords(query: string): string[] {
    // Danh sách stop words tiếng Việt thường gặp trong địa chỉ
    const stopWords = new Set([
      'phường', 'ward', 'quận', 'district', 'huyện', 'tỉnh', 'province',
      'thành', 'phố', 'city', 'việt', 'nam', 'vietnam', 'xã', 'commune',
      'thị', 'trấn', 'town', 'đường', 'street', 'số', 'number',
      'của', 'và', 'tại', 'ở', 'trong', 'ngoài', 'trên', 'dưới',
      'the', 'and', 'of', 'in', 'at', 'on', 'for', 'to', 'with'
    ]);
    
    // Tách từ bằng dấu cách, phẩy, và các ký tự đặc biệt
    const words = query.toLowerCase()
      .split(/[,\s\-_\.\/\\]+/)
      .map(word => word.trim())
      .filter(word => {
        return word.length > 0 && 
               !stopWords.has(word) &&
               word !== ''; // Loại bỏ chuỗi rỗng
      });
    
    // Ưu tiên giữ lại các từ khóa có chứa số (như S202, Tòa B1, số 123)
    const priorityKeywords = words.filter(word => /\d/.test(word));
    const otherKeywords = words.filter(word => !/\d/.test(word));
    
    // Combine với priority keywords đầu tiên
    const keywords = [...priorityKeywords, ...otherKeywords];
    
    console.log(`🔤 Keywords extracted from "${query}":`, {
      original: words,
      priority: priorityKeywords,
      other: otherKeywords,
      final: keywords
    });
    
    return keywords;
  }

  /**
   * Reverse Geocoding - Chuyển tọa độ thành địa chỉ (optional)
   * @param latitude - Vĩ độ
   * @param longitude - Kinh độ
   * @returns Địa chỉ
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<string | null> {
    try {
      // Try Nominatim first (FREE)
      const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
      
      const response = await fetch(nominatimUrl, {
        headers: {
          'User-Agent': 'Modern-Ritual-Offering-Platform/1.0'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          return data.display_name;
        }
      }
      
      // Fallback to Google Maps if configured
      if (this.isGoogleApiKeyConfigured()) {
        const googleUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.googleApiKey}&region=VN&language=vi`;
        
        const googleResponse = await fetch(googleUrl);
        const googleData: GoogleMapsResponse = await googleResponse.json();

        if (googleData.status === 'OK' && googleData.results.length > 0) {
          return googleData.results[0].formatted_address;
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error in reverseGeocode:', error);
      return null;
    }
  }
}

// Export singleton instance
export const geocodingService = new GeocodingService();

// Backward compatibility
export const googleMapsService = geocodingService;

// Export class for testing
export { GeocodingService, GeocodingService as GoogleMapsService };