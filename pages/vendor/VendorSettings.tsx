import React, { useState, useEffect } from 'react';
import toast from '../../services/toast';
import {
  getProfile,
  getVendorProfile,
  updateProfile,
  updateVendorProfile,
  UserProfile,
  VendorCurrentProfile,
  UpdateProfileRequest,
  UpdateVendorProfileRequest,
} from '../../services/auth';
import { geocodingService, AddressSuggestion, ReverseGeocodingAddress } from '../../services/geocodingService';
import {
  Province,
  District,
  Ward,
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
} from '../../services/vietnamAddressApi';
import AddressMapPicker from '../../components/AddressMapPicker';

const DEFAULT_MAP_POSITION = { latitude: 10.8231, longitude: 106.6297 };

const normalizeAddressText = (value?: string | null): string => {
  if (!value) return '';
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(tinh|thanh pho|quan|huyen|phuong|xa|thi tran|thi xa|tp\.?|q\.?|p\.?)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const isNameMatch = (left?: string, right?: string): boolean => {
  const leftNorm = normalizeAddressText(left);
  const rightNorm = normalizeAddressText(right);
  if (!leftNorm || !rightNorm) return false;
  return leftNorm.includes(rightNorm) || rightNorm.includes(leftNorm);
};

interface VendorSettingsProps {
  onNavigate: (path: string) => void;
}

const VendorSettings: React.FC<VendorSettingsProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('shop');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [vendorProfile, setVendorProfile] = useState<VendorCurrentProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [coordinateError, setCoordinateError] = useState<string | null>(null);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [detailedAddress, setDetailedAddress] = useState('');
  const [mapPreview, setMapPreview] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapPreviewLoading, setMapPreviewLoading] = useState(false);
  const [mapPreviewError, setMapPreviewError] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingAddressSuggestions, setLoadingAddressSuggestions] = useState(false);
  const [isMapSelectionLocked, setIsMapSelectionLocked] = useState(false);
  const [mapConfirmLoading, setMapConfirmLoading] = useState(false);

  const [shopInfo, setShopInfo] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    email: '',
    address: '',
    description: 'Chuyên cung cấp mâm cúng trọn gói chất lượng cao',
    businessLicense: 'Có',
    tax: '',
    gender: 'Nam',
    dateOfBirth: '',
    latitude: 0,
    longitude: 0,
    avatarFile: null as File | null,
    avatarUrl: '' as string,
    dailyCapacity: 100,
    businessType: 'Individual',
  });

  const [bankInfo, setBankInfo] = useState({
    bankName: 'Ngân Hàng Vietcombank',
    accountName: 'NGUYEN VAN CHU',
    accountNumber: '1234567890',
    branch: 'Chi nhánh Quận 1',
  });

  const [provinceSearch, setProvinceSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [initialShopInfo, setInitialShopInfo] = useState<{
    shopName: string;
    address: string;
    description: string;
    tax: string;
    latitude: number;
    longitude: number;
    dailyCapacity: number;
    businessType: string;
    avatarUrl: string;
  } | null>(null);
  const isNameMatch = (name1: string | undefined, name2: string | undefined): boolean => {
    if (!name1 || !name2) return false;
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\b(tinh|thanh pho|quan|huyen|phuong|xa|thi tran|thi xa|city|district|ward)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    const s1 = normalize(name1);
    const s2 = normalize(name2);
    return s1.includes(s2) || s2.includes(s1);
  };

  const isPinnedCoordinateLabel = (text: string): boolean => {
    return text.includes('Vị trí đã ghim') || text.includes('Địa điểm đã chọn');
  };

  const mapPickerPosition = mapPreview ?? {
    latitude: Number(shopInfo.latitude) || DEFAULT_MAP_POSITION.latitude,
    longitude: Number(shopInfo.longitude) || DEFAULT_MAP_POSITION.longitude,
  };

  const findProvinceByReverse = (reverseData: ReverseGeocodingAddress): Province | undefined => {
    return provinces.find((province) =>
      isNameMatch(reverseData.provinceName, province.name) ||
      isNameMatch(reverseData.provinceName, province.full_name) ||
      isNameMatch(reverseData.formattedAddress, province.name) ||
      isNameMatch(reverseData.formattedAddress, province.full_name)
    );
  };

  const findDistrictByReverse = (reverseData: ReverseGeocodingAddress, districtList: District[]): District | undefined => {
    return districtList.find((district) =>
      isNameMatch(reverseData.districtName, district.name) ||
      isNameMatch(reverseData.districtName, district.full_name) ||
      isNameMatch(reverseData.formattedAddress, district.name) ||
      isNameMatch(reverseData.formattedAddress, district.full_name)
    );
  };

  const findWardByReverse = (reverseData: ReverseGeocodingAddress, wardList: Ward[]): Ward | undefined => {
    return wardList.find((ward) =>
      isNameMatch(reverseData.wardName, ward.name) ||
      isNameMatch(reverseData.wardName, ward.full_name) ||
      isNameMatch(reverseData.formattedAddress, ward.name) ||
      isNameMatch(reverseData.formattedAddress, ward.full_name)
    );
  };

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setProfileLoading(true);
        const [data, vendorData] = await Promise.all([
          getProfile(),
          getVendorProfile().catch(() => null),
        ]);
        setProfile(data);
        setVendorProfile(vendorData);

        let formattedDate = '';
        if (data.dateOfBirth) {
          const dateStr = data.dateOfBirth.toString();
          formattedDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr.substring(0, 10);
        }

        setShopInfo(prev => ({
          ...prev,
          shopName: vendorData?.shopName || data.shopName || 'Modern Ritual Shop',
          ownerName: data.fullName || '',
          phone: data.phoneNumber || '',
          email: `${data.userId}@vietritual.com`,
          address: vendorData?.shopAddressText || data.addressText || '',
          description: vendorData?.shopDescription || prev.description,
          tax: vendorData?.taxCode || data.businessLicenseNo || '',
          businessLicense: data.verificationStatus === 'Verified' ? 'Có' : 'Không',
          gender: data.gender || 'Nam',
          dateOfBirth: formattedDate,
          latitude: vendorData?.shopLatitude ?? data.latitude ?? 0,
          longitude: vendorData?.shopLongitude ?? data.longitude ?? 0,
          dailyCapacity: vendorData?.dailyCapacity ?? 100,
          businessType: vendorData?.businessType || 'Individual',
          avatarUrl: vendorData?.shopAvatarUrl || vendorData?.avatarUrl || '',
        }));

        setInitialShopInfo({
          shopName: vendorData?.shopName || data.shopName || '',
          address: vendorData?.shopAddressText || data.addressText || '',
          description: vendorData?.shopDescription || 'Chuyên cung cấp mâm cúng trọn gói chất lượng cao',
          tax: vendorData?.taxCode || data.businessLicenseNo || '',
          latitude: vendorData?.shopLatitude ?? data.latitude ?? 0,
          longitude: vendorData?.shopLongitude ?? data.longitude ?? 0,
          dailyCapacity: vendorData?.dailyCapacity ?? 100,
          businessType: vendorData?.businessType || 'Individual',
          avatarUrl: vendorData?.shopAvatarUrl || vendorData?.avatarUrl || '',
        });

        const resolvedAddress = vendorData?.shopAddressText || data.addressText || '';
        const resolvedLatitude = vendorData?.shopLatitude ?? data.latitude ?? 0;
        const resolvedLongitude = vendorData?.shopLongitude ?? data.longitude ?? 0;

        setDetailedAddress(resolvedAddress.split(',')[0]?.trim() || resolvedAddress);
        setMapPreview(resolvedLatitude && resolvedLongitude ? { latitude: resolvedLatitude, longitude: resolvedLongitude } : null);
        setMapPreviewError(null);
        setSelectedProvince(null);
        setSelectedDistrict(null);
        setSelectedWard(null);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
        toast.error('Không thể tải thông tin cửa hàng');
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const provinceList = await getProvinces();
        setProvinces(provinceList);
      } catch (error) {
        console.error('Failed to load provinces:', error);
      } finally {
        setLoadingProvinces(false);
      }
    };

    loadProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      return;
    }

    const loadDistricts = async () => {
      try {
        setLoadingDistricts(true);
        const districtList = await getDistrictsByProvince(selectedProvince);
        setDistricts(districtList);
      } catch (error) {
        console.error('Failed to load districts:', error);
        setDistricts([]);
      } finally {
        setLoadingDistricts(false);
      }
    };

    loadDistricts();
  }, [selectedProvince]);

  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard(null);
      return;
    }

    const loadWards = async () => {
      try {
        setLoadingWards(true);
        const wardList = await getWardsByDistrict(selectedDistrict);
        setWards(wardList);
      } catch (error) {
        console.error('Failed to load wards:', error);
        setWards([]);
      } finally {
        setLoadingWards(false);
      }
    };

    loadWards();
  }, [selectedDistrict]);

  useEffect(() => {
    if (!isEditing || !initialShopInfo || provinces.length === 0 || selectedProvince) return;

    const hydrateAddressSelections = async () => {
      const sourceAddress = initialShopInfo.address || '';
      const parts = sourceAddress
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);

      const provinceHint = parts.length > 0 ? parts[parts.length - 1] : undefined;
      const districtHint = parts.length > 1 ? parts[parts.length - 2] : undefined;
      const wardHint = parts.length > 2 ? parts[parts.length - 3] : undefined;

      let resolvedProvinceName = provinceHint;
      let resolvedDistrictName = districtHint;
      let resolvedWardName = wardHint;

      if ((!resolvedProvinceName || !resolvedDistrictName) && shopInfo.latitude && shopInfo.longitude) {
        const reverseData = await geocodingService.reverseGeocodeDetails(shopInfo.latitude, shopInfo.longitude);
        resolvedProvinceName = resolvedProvinceName || reverseData?.provinceName;
        resolvedDistrictName = resolvedDistrictName || reverseData?.districtName;
        resolvedWardName = resolvedWardName || reverseData?.wardName;
      }

      const matchedProvince = findProvinceByReverse({
        provinceName: resolvedProvinceName,
        formattedAddress: resolvedProvinceName || '',
      });
      if (!matchedProvince) return;

      setSelectedProvince(matchedProvince.code);
      const districtList = await getDistrictsByProvince(matchedProvince.code);
      setDistricts(districtList);

      const matchedDistrict = findDistrictByReverse({
        districtName: resolvedDistrictName,
        formattedAddress: resolvedDistrictName || '',
      }, districtList);
      if (!matchedDistrict) return;

      setSelectedDistrict(matchedDistrict.code);
      const wardList = await getWardsByDistrict(matchedDistrict.code);
      setWards(wardList);

      const matchedWard = findWardByReverse({
        wardName: resolvedWardName,
        formattedAddress: resolvedWardName || '',
      }, wardList);
      if (matchedWard) {
        setSelectedWard(matchedWard.code);
      }
    };

    hydrateAddressSelections().catch((error) => {
      console.error('Failed to hydrate vendor address selections:', error);
    });
  }, [isEditing, initialShopInfo, provinces, selectedProvince, shopInfo.latitude, shopInfo.longitude]);

  // Auto-update map preview when address components change (Like ProfilePage)
  useEffect(() => {
    if (!isEditing) return;

    // Keep user-picked map location stable; only recalculate when address fields are changed manually.
    if (isMapSelectionLocked && mapPreview) {
      setMapPreviewLoading(false);
      return;
    }

    const provinceName = provinces.find(p => p.code === selectedProvince)?.name;
    const districtName = districts.find(d => d.code === selectedDistrict)?.name;
    const wardName = wards.find(w => w.code === selectedWard)?.name;
    const hasEnoughAddress = !!detailedAddress.trim() && !!provinceName && !!districtName;

    if (!hasEnoughAddress) {
      setMapPreview(null);
      setMapPreviewLoading(false);
      setMapPreviewError(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setMapPreviewLoading(true);
        setMapPreviewError(null);

        const result = await geocodingService.geocodeAddressComponents({
          detailedAddress: detailedAddress.trim(),
          wardName,
          districtName,
          provinceName,
        });

        if (cancelled) return;

        if (result) {
          setMapPreview({ latitude: result.latitude, longitude: result.longitude });
          setShopInfo((prev) => ({
            ...prev,
            latitude: result.latitude,
            longitude: result.longitude,
          }));
        } else {
          setMapPreview(null);
          setMapPreviewError('Không tìm thấy vị trí chính xác cho địa chỉ này.');
        }
      } catch {
        if (cancelled) return;
        setMapPreview(null);
        setMapPreviewError('Không thể tìm thấy vị trí trên bản đồ cho địa chỉ đã nhập.');
      } finally {
        if (!cancelled) {
          setMapPreviewLoading(false);
        }
      }
    }, 650);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    isEditing,
    isMapSelectionLocked,
    detailedAddress,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    provinces,
    districts,
    wards,
  ]);

  // Address suggestions logic (Like ProfilePage)
  useEffect(() => {
    if (!isEditing) {
      setAddressSuggestions([]);
      setLoadingAddressSuggestions(false);
      return;
    }

    const keyword = detailedAddress.trim();
    if (keyword.length < 3) {
      setAddressSuggestions([]);
      setLoadingAddressSuggestions(false);
      return;
    }

    const districtName = districts.find((d) => d.code === selectedDistrict)?.name;
    const provinceName = provinces.find((p) => p.code === selectedProvince)?.name;

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setLoadingAddressSuggestions(true);
        const suggestions = await geocodingService.suggestAddresses(keyword, districtName, provinceName);
        if (cancelled) return;
        setAddressSuggestions(suggestions);
      } finally {
        if (!cancelled) {
          setLoadingAddressSuggestions(false);
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isEditing, detailedAddress, selectedDistrict, selectedProvince, districts, provinces]);

  const handlePickAddressSuggestion = async (suggestion: AddressSuggestion) => {
    const display = suggestion.displayName;

    setDetailedAddress(display);
    setMapPreview({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setIsMapSelectionLocked(true);
    setMapPreviewError(null);
    setAddressSuggestions([]);
    setShopInfo((prev) => ({
      ...prev,
      address: display,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    }));

    // Tự động tìm và điền Tỉnh/Huyện/Xã dựa trên tọa độ của gợi ý
    try {
      const reverseData = await geocodingService.reverseGeocodeDetails(suggestion.latitude, suggestion.longitude);
      if (reverseData) {
        const matchedProvince = findProvinceByReverse(reverseData);
        if (matchedProvince) {
          setSelectedProvince(matchedProvince.code);
          const provinceDistricts = await getDistrictsByProvince(matchedProvince.code);
          setDistricts(provinceDistricts);

          const matchedDistrict = findDistrictByReverse(reverseData, provinceDistricts);
          if (matchedDistrict) {
            setSelectedDistrict(matchedDistrict.code);
            const districtWards = await getWardsByDistrict(matchedDistrict.code);
            setWards(districtWards);

            const matchedWard = findWardByReverse(reverseData, districtWards);
            if (matchedWard) {
              setSelectedWard(matchedWard.code);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to reverse geocode suggestion:', err);
    }
  };


  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setMapPreviewError('Trình duyệt không hỗ trợ lấy vị trí hiện tại.');
      return;
    }

    try {
      setMapPreviewLoading(true);
      setMapPreviewError(null);

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      setMapPreview({ latitude, longitude });
      setShopInfo((prev) => ({ ...prev, latitude, longitude }));

      const reverseAddress = await geocodingService.reverseGeocode(latitude, longitude);
      if (reverseAddress) {
        setDetailedAddress(reverseAddress.split(',')[0]?.trim() || reverseAddress);
      }
    } catch (error) {
      console.error('Failed to get current location:', error);
      setMapPreviewError('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
    } finally {
      setMapPreviewLoading(false);
    }
  };

  const handleMapPositionChange = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    setMapPreview({ latitude, longitude });
    setIsMapSelectionLocked(true);
    setMapPreviewError(null);
    setShopInfo((prev) => ({ ...prev, latitude, longitude }));
  };

  const handleConfirmMapSelection = async () => {
    const targetLat = mapPickerPosition.latitude;
    const targetLng = mapPickerPosition.longitude;

    try {
      setMapConfirmLoading(true);
      setMapPreviewError(null);

      const reverseData = await geocodingService.reverseGeocodeDetails(targetLat, targetLng);

      const fallbackProvinceName = provinces.find((p) => p.code === selectedProvince)?.name;
      const fallbackDistrictName = districts.find((d) => d.code === selectedDistrict)?.name;
      const fallbackWardName = wards.find((w) => w.code === selectedWard)?.name;

      const effectiveReverseData: ReverseGeocodingAddress = reverseData || {
        formattedAddress: '',
        provinceName: fallbackProvinceName,
        districtName: fallbackDistrictName,
        wardName: fallbackWardName,
        detailedAddress: detailedAddress?.trim() || '',
      };

      const calculateDistanceKm = (
        lat1: number,
        lng1: number,
        lat2: number,
        lng2: number
      ): number => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const earthRadiusKm = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
          Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return earthRadiusKm * c;
      };

      const matchedProvince = findProvinceByReverse(effectiveReverseData);
      let matchedDistrict: District | undefined;
      let matchedWard: Ward | undefined;

      if (matchedProvince) {
        setSelectedProvince(matchedProvince.code);
        const provinceDistricts = await getDistrictsByProvince(matchedProvince.code);
        setDistricts(provinceDistricts);

        matchedDistrict = findDistrictByReverse(effectiveReverseData, provinceDistricts);
        if (matchedDistrict) {
          setSelectedDistrict(matchedDistrict.code);
          const districtWards = await getWardsByDistrict(matchedDistrict.code);
          setWards(districtWards);

          matchedWard = findWardByReverse(effectiveReverseData, districtWards);
          if (matchedWard) {
            setSelectedWard(matchedWard.code);
          }
        }
      }

      let nextDetailedAddress =
        effectiveReverseData.detailedAddress ||
        effectiveReverseData.formattedAddress ||
        detailedAddress;

      let resolvedDetailedAddress = nextDetailedAddress;
      let resolvedAddressTextFromSuggestion = '';

      // Prefer nearest suggestion around the selected pin
      if (detailedAddress.trim().length >= 3) {
        const nearbySuggestions = await geocodingService.suggestAddresses(
          detailedAddress.trim(),
          matchedDistrict?.name || effectiveReverseData.districtName || fallbackDistrictName,
          matchedProvince?.name || effectiveReverseData.provinceName || fallbackProvinceName
        );

        if (nearbySuggestions.length > 0) {
          const nearest = [...nearbySuggestions].sort((a, b) => {
            const distA = calculateDistanceKm(targetLat, targetLng, a.latitude, a.longitude);
            const distB = calculateDistanceKm(targetLat, targetLng, b.latitude, b.longitude);
            return distA - distB;
          })[0];

          const nearestDistanceKm = calculateDistanceKm(targetLat, targetLng, nearest.latitude, nearest.longitude);
          if (nearestDistanceKm <= 0.8) {
            resolvedDetailedAddress = nearest.displayName || resolvedDetailedAddress;
            resolvedAddressTextFromSuggestion = nearest.displayName;
          }
        }
      }

      const provinceText = matchedProvince?.name || effectiveReverseData.provinceName || fallbackProvinceName || '';
      const districtText = matchedDistrict?.name || effectiveReverseData.districtName || fallbackDistrictName || '';
      const wardText = matchedWard?.name || effectiveReverseData.wardName || fallbackWardName || '';

      if (!resolvedDetailedAddress || !resolvedDetailedAddress.trim()) {
        resolvedDetailedAddress =
          effectiveReverseData.formattedAddress.split(',')[0]?.trim() ||
          detailedAddress.trim() ||
          'Địa điểm đã chọn trên bản đồ';
      }

      const composedAddressText = resolvedDetailedAddress.includes(provinceText)
        ? resolvedDetailedAddress
        : [resolvedDetailedAddress, wardText, districtText, provinceText]
          .filter(Boolean)
          .join(', ');

      setDetailedAddress(resolvedDetailedAddress);
      setMapPreview({ latitude: targetLat, longitude: targetLng });
      setIsMapSelectionLocked(true);
      setShopInfo((prev) => ({
        ...prev,
        latitude: targetLat,
        longitude: targetLng,
        address: resolvedAddressTextFromSuggestion || composedAddressText || effectiveReverseData.formattedAddress || prev.address,
      }));
      toast.success('Đã xác nhận vị trí pin và tự động điền địa chỉ vào form.');
    } catch (error) {
      console.error('Failed to confirm map selection:', error);
      setMapPreviewError('Không thể xác nhận vị trí trên bản đồ. Vui lòng thử lại.');
    } finally {
      setMapConfirmLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaveLoading(true);

      if (activeTab === 'shop') {
        if (!initialShopInfo) {
          throw new Error('Không có dữ liệu gốc để cập nhật.');
        }

        const payload: UpdateVendorProfileRequest = {};

        if (shopInfo.shopName.trim() !== initialShopInfo.shopName.trim()) {
          payload.shopName = shopInfo.shopName.trim();
        }

        if (shopInfo.description.trim() !== initialShopInfo.description.trim()) {
          payload.shopDescription = shopInfo.description.trim();
        }

        if (shopInfo.address.trim() !== initialShopInfo.address.trim()) {
          payload.shopAddressText = shopInfo.address.trim();
        }

        // Auto-fetch coordinates from address before saving (Like ProfilePage fallback)
        const provinceName = provinces.find(p => p.code === selectedProvince)?.name;
        const districtName = districts.find(d => d.code === selectedDistrict)?.name;
        const wardName = wards.find(w => w.code === selectedWard)?.name;

        if (provinceName && districtName && detailedAddress.trim()) {
          try {
            const geoResult = await geocodingService.geocodeAddressComponents({
              detailedAddress: detailedAddress.trim(),
              wardName,
              districtName,
              provinceName,
            });
            if (geoResult) {
              shopInfo.latitude = geoResult.latitude;
              shopInfo.longitude = geoResult.longitude;
              setShopInfo(prev => ({
                ...prev,
                latitude: geoResult.latitude,
                longitude: geoResult.longitude
              }));
            }
          } catch (e) {
            console.warn('Fallback geocoding failed, using existing coordinates:', e);
          }
        }

        const latitudeChanged = Number(shopInfo.latitude) !== Number(initialShopInfo.latitude);
        const longitudeChanged = Number(shopInfo.longitude) !== Number(initialShopInfo.longitude);
        if (latitudeChanged || longitudeChanged) {
          payload.shopLatitude = Number(shopInfo.latitude);
          payload.shopLongitude = Number(shopInfo.longitude);
        }

        if (shopInfo.tax.trim() !== initialShopInfo.tax.trim()) {
          payload.taxCode = shopInfo.tax.trim();
        }

        if (shopInfo.dailyCapacity !== initialShopInfo.dailyCapacity) {
          payload.dailyCapacity = Number(shopInfo.dailyCapacity);
        }

        if (shopInfo.businessType !== initialShopInfo.businessType) {
          payload.businessType = shopInfo.businessType;
        }

        if (shopInfo.avatarFile) {
          payload.shopAvatarFile = shopInfo.avatarFile;
        }

        if (Object.keys(payload).length === 0) {
          toast.info('Không có thay đổi để lưu.');
          setIsEditing(false);
          return;
        }

        const updatedVendor = await updateVendorProfile(payload);

        if (updatedVendor) {
          setVendorProfile(updatedVendor);
          const newShopInfo = {
            ...shopInfo,
            shopName: updatedVendor.shopName || shopInfo.shopName,
            description: updatedVendor.shopDescription || shopInfo.description,
            address: updatedVendor.shopAddressText || shopInfo.address,
            tax: updatedVendor.taxCode || shopInfo.tax,
            latitude: updatedVendor.shopLatitude ?? shopInfo.latitude,
            longitude: updatedVendor.shopLongitude ?? shopInfo.longitude,
            dailyCapacity: updatedVendor.dailyCapacity ?? shopInfo.dailyCapacity,
            businessType: updatedVendor.businessType || shopInfo.businessType,
            avatarUrl: updatedVendor.shopAvatarUrl || updatedVendor.avatarUrl || shopInfo.avatarUrl,
          };
          setShopInfo(newShopInfo);
          setInitialShopInfo(newShopInfo);
        }

        toast.success('Cập nhật thông tin cửa hàng thành công!');
        setIsEditing(false);
        return;
      }

      // If other tabs might need personal profile updates (e.g. Owner name, Phone, etc.)
      const personalPayload: UpdateProfileRequest = {
        fullName: shopInfo.ownerName,
        gender: shopInfo.gender,
        phoneNumber: shopInfo.phone,
        dateOfBirth: shopInfo.dateOfBirth,
        addressText: profile?.addressText || '', // Keep existing personal address!
        latitude: profile?.latitude || 0,
        longitude: profile?.longitude || 0,
        avatarFile: shopInfo.avatarFile,
      };

      await updateProfile(personalPayload);
      toast.success('Cập nhật thông tin cá nhân thành công!');
      setIsEditing(false);
      // Optional: Refresh data to sync
      const refreshedProfile = await getProfile();
      setProfile(refreshedProfile);
    } catch (err) {
      console.error('Failed to update settings:', err);
      toast.error('Cập nhật thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-playfair font-bold text-primary mb-2">Cài Đặt Cửa Hàng</h1>
          <p className="text-gray-600">Quản lý thông tin cửa hàng và thanh toán</p>
        </div>

        {profileLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải thông tin...</p>
            </div>
          </div>
        ) : (<>
          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b-2 border-gold/20 flex-wrap">
            {[
              { id: 'shop', label: ' Thông Tin Cửa Hàng' },
              { id: 'bank', label: ' Thông Tin Ngân Hàng' },
              { id: 'commission', label: ' Hoa Hồng & Phí' },
              { id: 'notifications', label: ' Thông Báo' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-bold transition-all border-b-4 ${activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-gray-600 border-transparent hover:text-primary'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Shop Info Tab */}
          {activeTab === 'shop' && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">Thông Tin Cửa Hàng</h2>
                <button
                  disabled={profile?.verificationStatus === 'Banned'}
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-2 rounded-lg font-bold transition-all border-2 ${profile?.verificationStatus === 'Banned'
                      ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                      : isEditing
                        ? 'border-red-600 text-red-600 hover:bg-red-50'
                        : 'border-slate-400 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {isEditing ? 'Hủy' : 'Chỉnh Sửa'}
                </button>
              </div>

              {profile?.verificationStatus === 'Banned' && (
                <div className="mb-6 p-4 bg-red-100 border border-red-300 rounded-xl text-red-700 font-bold flex items-center gap-3 shadow-sm animate-pulse">
                  <span className="text-xl">🛑</span>
                  <span>Tài khoản này đã bị KHÓA. Bạn không thể thực hiện bất kỳ thay đổi nào.</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Tên Cửa Hàng

                  </label>
                  <input
                    type="text"
                    value={shopInfo.shopName}
                    onChange={(e) => setShopInfo({ ...shopInfo, shopName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên Chủ Cửa Hàng</label>
                  <input
                    type="text"
                    value={shopInfo.ownerName}
                    onChange={(e) => setShopInfo({ ...shopInfo, ownerName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số Điện Thoại</label>
                  <input
                    type="tel"
                    value={shopInfo.phone}
                    onChange={(e) => setShopInfo({ ...shopInfo, phone: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email

                  </label>
                  <input
                    type="email"
                    value={shopInfo.email}
                    readOnly
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Địa Chỉ Cửa Hàng</label>
                  {!isEditing && (
                    <input
                      type="text"
                      value={shopInfo.address}
                      readOnly
                      disabled
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed text-gray-500"
                    />
                  )}

                  {isEditing && (
                    <div className="space-y-4">
                      {!isMapSelectionLocked ? (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Province */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                              Tỉnh/Thành phố <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={selectedProvince || ''}
                              onChange={(e) => {
                                setIsMapSelectionLocked(false);
                                const code = e.target.value ? Number(e.target.value) : null;
                                setSelectedProvince(code);
                                setSelectedDistrict(null);
                                setSelectedWard(null);
                                setProvinceSearch('');
                                setDistrictSearch('');
                                setWardSearch('');
                              }}
                              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                              disabled={loadingProvinces}
                            >
                              <option value="">{loadingProvinces ? 'Đang tải...' : 'Chọn Tỉnh/Thành phố'}</option>
                              {provinces
                                .filter(province =>
                                  province.name.toLowerCase().includes(provinceSearch.toLowerCase())
                                )
                                .map(province => (
                                  <option key={province.code} value={province.code}>{province.name}</option>
                                ))}
                            </select>
                            {!loadingProvinces && provinces.length > 0 && (
                              <input
                                type="text"
                                placeholder="Nhập tỉnh, thành phố để tìm"
                                value={provinceSearch}
                                onChange={(e) => setProvinceSearch(e.target.value)}
                                className="w-full mt-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            )}
                          </div>

                          {/* District */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                              Quận/Huyện <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={selectedDistrict || ''}
                              onChange={(e) => {
                                setIsMapSelectionLocked(false);
                                const code = e.target.value ? Number(e.target.value) : null;
                                setSelectedDistrict(code);
                                setSelectedWard(null);
                                setWardSearch('');
                              }}
                              disabled={!selectedProvince || loadingDistricts}
                              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {loadingDistricts ? 'Đang tải...' : 'Vui lòng chọn Quận/Huyện'}
                              </option>
                              {districts
                                .filter(d => d.name.toLowerCase().includes(districtSearch.toLowerCase()))
                                .map(district => (
                                  <option key={district.code} value={district.code}>{district.name}</option>
                                ))}
                            </select>
                            {!loadingDistricts && districts.length > 0 && (
                              <input
                                type="text"
                                placeholder="Nhập quận, huyện để tìm"
                                value={districtSearch}
                                onChange={(e) => setDistrictSearch(e.target.value)}
                                className="w-full mt-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            )}
                          </div>

                          {/* Ward */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                              Phường/Xã {wards.length > 0 ? <span className="text-red-500">*</span> : '(Tùy chọn)'}
                            </label>
                            <select
                              value={selectedWard || ''}
                              onChange={(e) => {
                                setIsMapSelectionLocked(false);
                                const code = e.target.value ? Number(e.target.value) : null;
                                setSelectedWard(code);
                              }}
                              disabled={!selectedDistrict || loadingWards}
                              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {loadingWards ? 'Đang tải...' : 'Chọn Phường/Xã'}
                              </option>
                              {wards
                                .filter(w => w.name.toLowerCase().includes(wardSearch.toLowerCase()))
                                .map(ward => (
                                  <option key={ward.code} value={ward.code}>{ward.name}</option>
                                ))}
                            </select>
                            {!loadingWards && wards.length > 0 && (
                              <input
                                type="text"
                                placeholder="Nhập phường, xã để tìm"
                                value={wardSearch}
                                onChange={(e) => setWardSearch(e.target.value)}
                                className="w-full mt-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest block">Khu vực đã chọn</label>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
                              <p><span className="font-semibold text-slate-500">Tỉnh:</span> {provinces.find(p => p.code === selectedProvince)?.name || '---'}</p>
                              <p><span className="font-semibold text-slate-500">Quận/Huyện:</span> {districts.find(d => d.code === selectedDistrict)?.name || '---'}</p>
                              <p><span className="font-semibold text-slate-500">Phường/Xã:</span> {wards.find(w => w.code === selectedWard)?.name || '---'}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setIsMapSelectionLocked(false)}
                            className="text-xs font-bold text-primary hover:text-white hover:bg-primary px-4 py-2 border border-primary/30 rounded-xl transition-all self-start md:self-center"
                          >
                            Thay đổi khu vực
                          </button>
                        </div>
                      )}

                      {/* Detailed Address */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                          Địa chỉ cụ thể <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Số nhà, tên đường..."
                          value={detailedAddress}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDetailedAddress(val);
                            setShopInfo(prev => ({ ...prev, address: val }));
                          }}
                          className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                        {loadingAddressSuggestions && (
                          <p className="text-xs text-slate-500">Đang tìm gợi ý địa chỉ...</p>
                        )}
                        {!loadingAddressSuggestions && addressSuggestions.length > 0 && (
                          <div className="max-h-52 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                            {addressSuggestions.map((suggestion, index) => (
                              <button
                                key={`${suggestion.latitude}-${suggestion.longitude}-${index}`}
                                type="button"
                                onClick={() => handlePickAddressSuggestion(suggestion)}
                                className="w-full border-b border-gray-100 px-3 py-2 text-left text-sm text-slate-700 hover:bg-primary/5 last:border-b-0"
                              >
                                {suggestion.displayName}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                          Bản đồ vị trí
                        </label>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                          <div className="flex justify-end mb-2">
                            <button
                              type="button"
                              onClick={handleUseCurrentLocation}
                              className="text-xs font-semibold text-primary hover:underline"
                            >
                              Dùng vị trí hiện tại
                            </button>
                          </div>
                          {mapPreviewLoading && (
                            <p className="text-sm text-slate-500 mb-2">Đang tìm vị trí trên bản đồ...</p>
                          )}
                          {!mapPreviewLoading && mapPreviewError && (
                            <p className="text-sm text-red-600 mb-2">{mapPreviewError}</p>
                          )}
                          {!mapPreviewLoading && (
                            <>
                              <AddressMapPicker
                                position={mapPickerPosition}
                                onPositionChange={handleMapPositionChange}
                              />
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={handleConfirmMapSelection}
                                  disabled={mapConfirmLoading}
                                  className="rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {mapConfirmLoading ? 'Đang xác nhận...' : 'Xác nhận vị trí đã chọn'}
                                </button>
                              </div>
                              <p className="mt-2 text-xs text-slate-500">
                                Nhấn vào bản đồ hoặc kéo ghim để chỉnh vị trí chính xác trước khi lưu.
                              </p>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={shopInfo.latitude ? shopInfo.latitude.toString() : ''}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600"
                          placeholder="Vĩ độ"
                        />
                        <input
                          type="text"
                          value={shopInfo.longitude ? shopInfo.longitude.toString() : ''}
                          readOnly
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-sm text-gray-600"
                          placeholder="Kinh độ"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Mô Tả Cửa Hàng
                  </label>
                  <textarea
                    value={shopInfo.description}
                    onChange={(e) => setShopInfo({ ...shopInfo, description: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Giấy Phép Kinh Doanh</label>
                  <input
                    type="text"
                    value={shopInfo.businessLicense}
                    disabled
                    className="w-full px-4 py-3 border-2 border-green-300 rounded-lg bg-green-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Mã Số Thuế</label>
                  <input
                    type="text"
                    value={shopInfo.tax}
                    onChange={(e) => setShopInfo({ ...shopInfo, tax: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Sức chứa hàng ngày (Daily Capacity)</label>
                  <input
                    type="number"
                    value={shopInfo.dailyCapacity}
                    onChange={(e) => setShopInfo({ ...shopInfo, dailyCapacity: Number(e.target.value) })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Loại hình kinh doanh</label>
                  <select
                    value={shopInfo.businessType}
                    onChange={(e) => setShopInfo({ ...shopInfo, businessType: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="Individual">Cá nhân</option>
                    <option value="HouseholdBusiness">Hộ gia đình kinh doanh</option>
                    <option value="HouseholdBussiness">Hộ gia đình kinh doanh (Lỗi hệ thống)</option>
                    <option value="Company">Doanh nghiệp</option>
                    <option value="Enterprise">Doanh nghiệp</option>
                  </select>
                </div>

                {isEditing && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh Đại Diện Cửa Hàng</label>

                    <div className="flex items-center gap-6 mb-4">
                      {/* Current or Preview Image */}
                      <div className="relative">
                        {shopInfo.avatarFile ? (
                          <img
                            src={URL.createObjectURL(shopInfo.avatarFile)}
                            alt="Preview"
                            className="w-24 h-24 rounded-xl object-cover border-4 border-primary/30 shadow-md"
                          />
                        ) : shopInfo.avatarUrl ? (
                          <img
                            src={shopInfo.avatarUrl}
                            alt="Current Shop Avatar"
                            className="w-24 h-24 rounded-xl object-cover border-4 border-gold/30 shadow-md"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-xl bg-gray-100 border-4 border-dashed border-gray-300 flex items-center justify-center text-3xl">
                            🏪
                          </div>
                        )}
                        {shopInfo.avatarFile && (
                          <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Mới</span>
                        )}
                      </div>

                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setShopInfo({ ...shopInfo, avatarFile: e.target.files?.[0] || null })}
                          className="w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-bold
                          file:bg-primary/10 file:text-primary
                          hover:file:bg-primary/20
                          cursor-pointer"
                        />
                        <p className="text-xs text-gray-500 mt-2">Dung lượng tối đa 5MB. Định dạng: JPG, PNG, WEBP.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {isEditing && (
                <button
                  onClick={handleSave}
                  disabled={saveLoading}
                  className="mt-6 w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saveLoading ? ' Đang lưu...' : 'Lưu Thay Đổi'}
                </button>
              )}
            </div>
          )}

          {/* Bank Info Tab */}
          {activeTab === 'bank' && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary">Thông Tin Ngân Hàng</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-6 py-2 rounded-lg font-bold transition-all border-2 ${isEditing
                      ? 'border-red-600 text-red-600 hover:bg-red-50'
                      : 'border-slate-400 text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  {isEditing ? ' Hủy' : ' Chỉnh Sửa'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên Ngân Hàng</label>
                  <input
                    type="text"
                    value={bankInfo.bankName}
                    onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Tên Chủ Tài Khoản</label>
                  <input
                    type="text"
                    value={bankInfo.accountName}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Số Tài Khoản</label>
                  <input
                    type="text"
                    value={bankInfo.accountNumber}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chi Nhánh</label>
                  <input
                    type="text"
                    value={bankInfo.branch}
                    onChange={(e) => setBankInfo({ ...bankInfo, branch: e.target.value })}
                    disabled={!isEditing}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Lưu ý:</strong> Thông tin ngân hàng được mã hóa an toàn. Hãy chắc chắn nhập đúng để tránh lỗi thanh toán.
                </p>
              </div>

              {isEditing && (
                <button
                  onClick={handleSave}
                  className="mt-6 w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5"
                >
                  Lưu Thay Đổi
                </button>
              )}
            </div>
          )}

          {/* Commission Tab */}
          {activeTab === 'commission' && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
              <h2 className="text-2xl font-bold text-primary mb-6">Hoa Hồng & Phí</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-gradient-to-br from-primary/10 to-gold/10 rounded-xl border-2 border-primary/20">
                  <p className="text-sm font-bold text-gray-700 mb-2">HTKH NỀN TẢNG</p>
                  <p className="text-3xl font-black text-primary">5%</p>
                  <p className="text-xs text-gray-600 mt-2">Được trừ từ mỗi đơn hàng</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-blue-100 to-blue-50 rounded-xl border-2 border-blue-300">
                  <p className="text-sm font-bold text-gray-700 mb-2">PHÍ GIAO DỊCH</p>
                  <p className="text-3xl font-black text-blue-600">2.9% + 2k</p>
                  <p className="text-xs text-gray-600 mt-2">Phí thanh toán qua cổng</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-green-100 to-green-50 rounded-xl border-2 border-green-300">
                  <p className="text-sm font-bold text-gray-700 mb-2">DOANH THU THỰC</p>
                  <p className="text-3xl font-black text-green-600">92.1%</p>
                  <p className="text-xs text-gray-600 mt-2">Nhận được từ mỗi đơn hàng</p>
                </div>
                <div className="p-6 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl border-2 border-orange-300">
                  <p className="text-sm font-bold text-gray-700 mb-2">ĐÃ THU THÁNG NÀY</p>
                  <p className="text-3xl font-black text-orange-600">14.0M ₫</p>
                  <p className="text-xs text-gray-600 mt-2">Sau khi trừ phí</p>
                </div>
              </div>

              <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
                <h3 className="text-lg font-bold text-blue-900 mb-4">Bảng Tính Chi Tiết</h3>
                <div className="space-y-3 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Tổng doanh thu từ đơn hàng:</span>
                    <span className="font-bold">15,200,000 ₫</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>- Hoa hồng nền tảng (5%):</span>
                    <span className="font-bold">760,000 ₫</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>- Phí giao dịch (2.9% + 2k):</span>
                    <span className="font-bold">452,000 ₫</span>
                  </div>
                  <div className="border-t-2 border-blue-300 pt-3 flex justify-between">
                    <span>= Doanh thu thực nhận:</span>
                    <span className="font-bold text-green-600">13,988,000 ₫</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gold/20">
              <h2 className="text-2xl font-bold text-primary mb-6">Cài Đặt Thông Báo</h2>
              <div className="space-y-4">
                {[
                  { label: 'Thông báo đơn hàng mới', enabled: true },
                  { label: 'Thông báo đánh giá từ khách', enabled: true },
                  { label: 'Thông báo vấn đề/tranh chấp', enabled: true },
                  { label: 'Thông báo rút tiền thành công', enabled: true },
                  { label: 'Thông báo tin khuyến mãi', enabled: false },
                ].map((notif, idx) => (
                  <label key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <input
                      type="checkbox"
                      defaultChecked={notif.enabled}
                      className="w-5 h-5 text-primary rounded"
                    />
                    <span className="font-semibold text-gray-700">{notif.label}</span>
                  </label>
                ))}
              </div>

              <button className="mt-6 w-full px-6 py-2.5 border-2 border-primary text-primary rounded-lg font-bold transition-all hover:bg-primary/5">
                Lưu Cài Đặt Thông Báo
              </button>
            </div>
          )}
        </>)}
      </div>
    </div>
  );
};

export default VendorSettings;
