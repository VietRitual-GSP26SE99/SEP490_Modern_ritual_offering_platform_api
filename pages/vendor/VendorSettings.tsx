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
import { geocodingService } from '../../services/geocodingService';
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
  const [coordinateLoading, setCoordinateLoading] = useState(false);
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
  const [searchMapLoading, setSearchMapLoading] = useState(false);

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
  });

  const [bankInfo, setBankInfo] = useState({
    bankName: 'Ngân Hàng Vietcombank',
    accountName: 'NGUYEN VAN CHU',
    accountNumber: '1234567890',
    branch: 'Chi nhánh Quận 1',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [initialShopInfo, setInitialShopInfo] = useState<{ shopName: string; address: string; description: string; tax: string; latitude: number; longitude: number } | null>(null);

  const mapPickerPosition = mapPreview ?? {
    latitude: Number(shopInfo.latitude) || DEFAULT_MAP_POSITION.latitude,
    longitude: Number(shopInfo.longitude) || DEFAULT_MAP_POSITION.longitude,
  };

  const findProvinceByReverse = (provinceName?: string): Province | undefined => {
    return provinces.find((province) =>
      isNameMatch(provinceName, province.name) || isNameMatch(provinceName, province.full_name)
    );
  };

  const findDistrictByReverse = (districtName: string | undefined, districtList: District[]): District | undefined => {
    return districtList.find((district) =>
      isNameMatch(districtName, district.name) || isNameMatch(districtName, district.full_name)
    );
  };

  const findWardByReverse = (wardName: string | undefined, wardList: Ward[]): Ward | undefined => {
    return wardList.find((ward) =>
      isNameMatch(wardName, ward.name) || isNameMatch(wardName, ward.full_name)
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
        }));

        setInitialShopInfo({
          shopName: vendorData?.shopName || data.shopName || '',
          address: vendorData?.shopAddressText || data.addressText || '',
          description: vendorData?.shopDescription || 'Chuyên cung cấp mâm cúng trọn gói chất lượng cao',
          tax: vendorData?.taxCode || data.businessLicenseNo || '',
          latitude: vendorData?.shopLatitude ?? data.latitude ?? 0,
          longitude: vendorData?.shopLongitude ?? data.longitude ?? 0,
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

      const matchedProvince = findProvinceByReverse(resolvedProvinceName);
      if (!matchedProvince) return;

      setSelectedProvince(matchedProvince.code);
      const districtList = await getDistrictsByProvince(matchedProvince.code);
      setDistricts(districtList);

      const matchedDistrict = findDistrictByReverse(resolvedDistrictName, districtList);
      if (!matchedDistrict) return;

      setSelectedDistrict(matchedDistrict.code);
      const wardList = await getWardsByDistrict(matchedDistrict.code);
      setWards(wardList);

      const matchedWard = findWardByReverse(resolvedWardName, wardList);
      if (matchedWard) {
        setSelectedWard(matchedWard.code);
      }
    };

    hydrateAddressSelections().catch((error) => {
      console.error('Failed to hydrate vendor address selections:', error);
    });
  }, [isEditing, initialShopInfo, provinces, selectedProvince, shopInfo.latitude, shopInfo.longitude]);

  // Handle get coordinates from address
  const handleSearchOnMap = async () => {
    const selectedProvinceName = provinces.find((p) => p.code === selectedProvince)?.name;
    const selectedDistrictName = districts.find((d) => d.code === selectedDistrict)?.name;
    const selectedWardName = wards.find((w) => w.code === selectedWard)?.name;

    if (!selectedProvinceName || !selectedDistrictName) {
      setMapPreviewError('Vui lòng chọn Tỉnh/Thành phố và Quận/Huyện trước khi tìm trên bản đồ.');
      return;
    }

    if (!detailedAddress.trim()) {
      setMapPreviewError('Vui lòng nhập địa chỉ chi tiết trước khi tìm trên bản đồ.');
      return;
    }

    try {
      setSearchMapLoading(true);
      setMapPreviewError(null);

      const geoResult = await geocodingService.geocodeAddressComponents({
        detailedAddress: detailedAddress.trim(),
        wardName: selectedWardName,
        districtName: selectedDistrictName,
        provinceName: selectedProvinceName,
      });

      if (!geoResult) {
        setMapPreviewError('Không tìm thấy vị trí phù hợp. Bạn thử nhập chi tiết hơn nhé.');
        return;
      }

      setMapPreview({ latitude: geoResult.latitude, longitude: geoResult.longitude });
      setShopInfo((prev) => ({ ...prev, latitude: geoResult.latitude, longitude: geoResult.longitude }));
    } catch (error) {
      console.error('Failed to search address on map:', error);
      setMapPreviewError('Không thể tìm vị trí trên bản đồ lúc này. Vui lòng thử lại.');
    } finally {
      setSearchMapLoading(false);
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
    setMapPreviewError(null);
    setShopInfo((prev) => ({ ...prev, latitude, longitude }));
  };

  const handleConfirmMapSelection = async () => {
    const targetLat = mapPickerPosition.latitude;
    const targetLng = mapPickerPosition.longitude;

    try {
      setCoordinateLoading(true);
      setMapPreviewError(null);

      const reverseData = await geocodingService.reverseGeocodeDetails(targetLat, targetLng);

      const matchedProvince = findProvinceByReverse(reverseData?.provinceName);
      let matchedDistrict: District | undefined;
      let matchedWard: Ward | undefined;

      if (matchedProvince) {
        setSelectedProvince(matchedProvince.code);
        const provinceDistricts = await getDistrictsByProvince(matchedProvince.code);
        setDistricts(provinceDistricts);

        matchedDistrict = findDistrictByReverse(reverseData?.districtName, provinceDistricts);
        if (matchedDistrict) {
          setSelectedDistrict(matchedDistrict.code);
          const districtWards = await getWardsByDistrict(matchedDistrict.code);
          setWards(districtWards);

          matchedWard = findWardByReverse(reverseData?.wardName, districtWards);
          if (matchedWard) {
            setSelectedWard(matchedWard.code);
          }
        }
      }

      const nextDetailedAddress =
        reverseData?.detailedAddress ||
        reverseData?.formattedAddress.split(',')[0]?.trim() ||
        detailedAddress ||
        'Địa điểm đã chọn trên bản đồ';

      const provinceText = matchedProvince?.name || reverseData?.provinceName || '';
      const districtText = matchedDistrict?.name || reverseData?.districtName || '';
      const wardText = matchedWard?.name || reverseData?.wardName || '';
      const composedAddressText = [nextDetailedAddress, wardText, districtText, provinceText]
        .filter(Boolean)
        .join(', ');

      setDetailedAddress(nextDetailedAddress);
      setMapPreview({ latitude: targetLat, longitude: targetLng });
      setShopInfo((prev) => ({
        ...prev,
        latitude: targetLat,
        longitude: targetLng,
        address: composedAddressText || reverseData?.formattedAddress || prev.address,
      }));
    } catch (error) {
      console.error('Failed to confirm map selection:', error);
      setMapPreviewError('Không thể xác nhận vị trí trên bản đồ. Vui lòng thử lại.');
    } finally {
      setCoordinateLoading(false);
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

        const latitudeChanged = Number(shopInfo.latitude) !== Number(initialShopInfo.latitude);
        const longitudeChanged = Number(shopInfo.longitude) !== Number(initialShopInfo.longitude);
        if (latitudeChanged || longitudeChanged) {
          payload.shopLatitude = Number(shopInfo.latitude);
          payload.shopLongitude = Number(shopInfo.longitude);
        }

        if (shopInfo.tax.trim() !== initialShopInfo.tax.trim()) {
          payload.taxCode = shopInfo.tax.trim();
        }

        if (Object.keys(payload).length === 0) {
          toast.info('Không có thay đổi để lưu.');
          setIsEditing(false);
          return;
        }

        const updatedVendor = await updateVendorProfile(payload);

        if (updatedVendor) {
          setVendorProfile(updatedVendor);
          setShopInfo((prev) => ({
            ...prev,
            shopName: updatedVendor.shopName || prev.shopName,
            description: updatedVendor.shopDescription || prev.description,
            address: updatedVendor.shopAddressText || prev.address,
            tax: updatedVendor.taxCode || prev.tax,
            latitude: updatedVendor.shopLatitude ?? prev.latitude,
            longitude: updatedVendor.shopLongitude ?? prev.longitude,
          }));

          setInitialShopInfo({
            shopName: updatedVendor.shopName || shopInfo.shopName,
            address: updatedVendor.shopAddressText || shopInfo.address,
            description: updatedVendor.shopDescription || shopInfo.description,
            tax: updatedVendor.taxCode || shopInfo.tax,
            latitude: updatedVendor.shopLatitude ?? shopInfo.latitude,
            longitude: updatedVendor.shopLongitude ?? shopInfo.longitude,
          });
        } else {
          setInitialShopInfo({
            shopName: payload.shopName ?? initialShopInfo.shopName,
            address: payload.shopAddressText ?? initialShopInfo.address,
            description: payload.shopDescription ?? initialShopInfo.description,
            tax: payload.taxCode ?? initialShopInfo.tax,
            latitude: payload.shopLatitude ?? initialShopInfo.latitude,
            longitude: payload.shopLongitude ?? initialShopInfo.longitude,
          });
        }

        toast.success('Cập nhật thông tin cửa hàng thành công!');
        setIsEditing(false);
        return;
      }

      const apiData: UpdateProfileRequest = {
        fullName: shopInfo.ownerName,
        gender: shopInfo.gender,
        phoneNumber: shopInfo.phone,
        dateOfBirth: shopInfo.dateOfBirth,
        addressText: shopInfo.address,
        latitude: shopInfo.latitude,
        longitude: shopInfo.longitude,
        avatarFile: shopInfo.avatarFile,
      };
      await updateProfile(apiData);
      toast.success('Cập nhật thông tin thành công!');
      setIsEditing(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to update profile:', err);
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
              className={`px-6 py-3 font-bold transition-all border-b-4 ${
                activeTab === tab.id
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
                onClick={() => setIsEditing(!isEditing)}
                className={`px-6 py-2 rounded-lg font-bold transition-all border-2 ${
                  isEditing
                    ? 'border-red-600 text-red-600 hover:bg-red-50'
                    : 'border-slate-400 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {isEditing ? 'Hủy' : 'Chỉnh Sửa'}
              </button>
            </div>

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
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <select
                        value={selectedProvince || ''}
                        onChange={(e) => {
                          const code = e.target.value ? Number(e.target.value) : null;
                          setSelectedProvince(code);
                          setSelectedDistrict(null);
                          setSelectedWard(null);
                        }}
                        className="w-full px-3 py-3 bg-white border-2 border-gold/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
                        disabled={loadingProvinces}
                      >
                        <option value="">{loadingProvinces ? 'Đang tải tỉnh/thành...' : 'Chọn Tỉnh/Thành phố'}</option>
                        {provinces.map((province) => (
                          <option key={province.code} value={province.code}>{province.name}</option>
                        ))}
                      </select>

                      <select
                        value={selectedDistrict || ''}
                        onChange={(e) => {
                          const code = e.target.value ? Number(e.target.value) : null;
                          setSelectedDistrict(code);
                          setSelectedWard(null);
                        }}
                        className="w-full px-3 py-3 bg-white border-2 border-gold/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
                        disabled={!selectedProvince || loadingDistricts}
                      >
                        <option value="">{loadingDistricts ? 'Đang tải quận/huyện...' : 'Chọn Quận/Huyện'}</option>
                        {districts.map((district) => (
                          <option key={district.code} value={district.code}>{district.name}</option>
                        ))}
                      </select>

                      <select
                        value={selectedWard || ''}
                        onChange={(e) => {
                          const code = e.target.value ? Number(e.target.value) : null;
                          setSelectedWard(code);
                        }}
                        className="w-full px-3 py-3 bg-white border-2 border-gold/20 rounded-lg focus:outline-none focus:border-primary disabled:bg-gray-100"
                        disabled={!selectedDistrict || loadingWards}
                      >
                        <option value="">{loadingWards ? 'Đang tải phường/xã...' : 'Chọn Phường/Xã (tùy chọn)'}</option>
                        {wards.map((ward) => (
                          <option key={ward.code} value={ward.code}>{ward.name}</option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="text"
                      value={detailedAddress}
                      onChange={(e) => {
                        setDetailedAddress(e.target.value);
                      }}
                      placeholder="Số nhà, tên đường..."
                      className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none"
                    />

                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={handleSearchOnMap}
                        disabled={searchMapLoading}
                        className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-xs uppercase hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {searchMapLoading ? 'Đang tìm...' : 'Tìm trên bản đồ'}
                      </button>
                      <button
                        type="button"
                        onClick={handleUseCurrentLocation}
                        disabled={mapPreviewLoading}
                        className="px-4 py-2 border-2 border-primary text-primary rounded-lg font-bold text-xs uppercase hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {mapPreviewLoading ? 'Đang lấy vị trí...' : 'Dùng vị trí hiện tại'}
                      </button>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
                      {mapPreviewError && <p className="text-sm text-red-600 mb-2">{mapPreviewError}</p>}

                      <AddressMapPicker
                        position={mapPickerPosition}
                        onPositionChange={handleMapPositionChange}
                      />

                      <div className="mt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={handleConfirmMapSelection}
                          disabled={coordinateLoading}
                          className="rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {coordinateLoading ? 'Đang xác nhận...' : 'Xác nhận vị trí đã chọn'}
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        Nhấn vào bản đồ hoặc kéo ghim để chỉnh vị trí chính xác trước khi lưu.
                      </p>
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
                  className="w-full px-4 py-3 border-2 border-green-300 rounded-lg bg-green-50 focus:border-primary focus:outline-none disabled:cursor-not-allowed"
                />
              </div>

              {isEditing && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Ảnh Đại Diện</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setShopInfo({ ...shopInfo, avatarFile: e.target.files?.[0] || null })}
                    className="w-full px-4 py-3 border-2 border-gold/20 rounded-lg focus:border-primary focus:outline-none"
                  />
                  {shopInfo.avatarFile && (
                    <p className="text-sm text-green-600 mt-1">Đã chọn: {shopInfo.avatarFile.name}</p>
                  )}
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
                className={`px-6 py-2 rounded-lg font-bold transition-all border-2 ${
                  isEditing
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
