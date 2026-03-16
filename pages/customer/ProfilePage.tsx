import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getProfile, UserProfile, getCurrentUser, getAuthToken, updateProfile, UpdateProfileRequest, changePassword, logoutComplete } from '../../services/auth';
import toast from '../../services/toast';
import {
  getProvinces,
  getDistrictsByProvince,
  getWardsByDistrict,
  Province,
  District,
  Ward
} from '../../services/vietnamAddressApi';
import { geocodingService, ReverseGeocodingAddress, AddressSuggestion } from '../../services/geocodingService';
import AddressMapPicker from '../../components/AddressMapPicker';

interface ProfilePageProps {
  onNavigate: (path: string) => void;
}

interface CustomerAddress {
  addressId?: string | number;
  addressText?: string;
  fullAddress?: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

interface CreateCustomerAddressRequest {
  addressText: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

interface UpdateCustomerAddressRequest {
  addressText: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

const PROFILE_SETUP_REQUIRED_KEY = 'modern-ritual-profile-setup-required';
const DEFAULT_MAP_POSITION = { latitude: 10.8231, longitude: 106.6297 };

const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isFirstTimeSetup = searchParams.get('firstTime') === 'true';

  // Helper function to convert English gender to Vietnamese
  const getVietnameseGender = (gender: string | undefined): string => {
    if (!gender) return 'N/A';
    const genderMap: { [key: string]: string } = {
      'Male': 'Nam',
      'Female': 'Nữ',
      'Other': 'Khác',
      'Nam': 'Nam',
      'Nữ': 'Nữ',
      'Khác': 'Khác'
    };
    return genderMap[gender] || gender;
  };

  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'reviews'>('info');
  const [isEditing, setIsEditing] = useState(false);
  const [isProfileSetupRequired, setIsProfileSetupRequired] = useState(isFirstTimeSetup);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Address API data states
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);

  // Loading states for address dropdowns
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Address dropdown states (now using codes from API)
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);
  const [selectedWard, setSelectedWard] = useState<number | null>(null);
  const [detailedAddress, setDetailedAddress] = useState('');
  const [selectedExistingAddressId, setSelectedExistingAddressId] = useState<string | number | null>(null);

  // Search states for dropdowns
  const [provinceSearch, setProvinceSearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');
  const [wardSearch, setWardSearch] = useState('');

  // Form state for editing
  const [editForm, setEditForm] = useState({
    fullName: '',
    gender: '',
    phoneNumber: '',
    dateOfBirth: '',
    addressText: '',
    latitude: 0,
    longitude: 0
  });

  // Change password states
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Google Maps Geocoding states
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [mapPreviewLoading, setMapPreviewLoading] = useState(false);
  const [mapPreviewError, setMapPreviewError] = useState<string | null>(null);
  const [mapConfirmLoading, setMapConfirmLoading] = useState(false);
  const [mapPreview, setMapPreview] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isMapSelectionLocked, setIsMapSelectionLocked] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [loadingAddressSuggestions, setLoadingAddressSuggestions] = useState(false);

  const mapPickerPosition = mapPreview ?? {
    latitude: Number(editForm.latitude) || DEFAULT_MAP_POSITION.latitude,
    longitude: Number(editForm.longitude) || DEFAULT_MAP_POSITION.longitude,
  };

  const isSameAddressId = (
    left: string | number | null | undefined,
    right: string | number | null | undefined
  ): boolean => {
    if (left === null || left === undefined || right === null || right === undefined) {
      return false;
    }

    return String(left) === String(right);
  };

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

  const isPinnedCoordinateLabel = (value?: string | null): boolean => {
    if (!value) return false;
    return /^Vị trí đã ghim\s*\(/i.test(value.trim());
  };

  const fetchCustomerAddresses = async (): Promise<CustomerAddress[]> => {
    try {
      const token = getAuthToken();
      if (!token) return [];

      const response = await fetch('/api/addresses', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch addresses: ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data)) {
        return data as CustomerAddress[];
      }

      if (data?.isSuccess && Array.isArray(data.result)) {
        return data.result as CustomerAddress[];
      }

      return [];
    } catch (err) {
      console.error('Failed to fetch customer addresses:', err);
      return [];
    }
  };

  const createCustomerAddress = async (
    payload: CreateCustomerAddressRequest
  ): Promise<CustomerAddress | null> => {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const response = await fetch('/api/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to create address: ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      if (data && typeof data === 'object' && (data.addressId || data.addressText || data.fullAddress)) {
        return data as CustomerAddress;
      }

      if (data?.isSuccess && data.result) {
        return data.result as CustomerAddress;
      }

      return null;
    } catch (err) {
      console.error('Failed to create customer address:', err);
      return null;
    }
  };

  const fetchCustomerAddressDetail = async (
    addressId: string | number
  ): Promise<CustomerAddress | null> => {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch address detail: ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      if (data && typeof data === 'object' && (data.addressId || data.addressText || data.fullAddress)) {
        return data as CustomerAddress;
      }

      if (data?.isSuccess && data.result) {
        return data.result as CustomerAddress;
      }

      return null;
    } catch (err) {
      console.error('Failed to fetch address detail:', err);
      return null;
    }
  };

  const updateCustomerAddress = async (
    addressId: string | number,
    payload: UpdateCustomerAddressRequest
  ): Promise<CustomerAddress | null> => {
    try {
      const token = getAuthToken();
      if (!token) return null;

      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to update address: ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      if (data && typeof data === 'object' && (data.addressId || data.addressText || data.fullAddress)) {
        return data as CustomerAddress;
      }

      if (data?.isSuccess && data.result) {
        return data.result as CustomerAddress;
      }

      return null;
    } catch (err) {
      console.error('Failed to update customer address:', err);
      return null;
    }
  };

  const deleteCustomerAddress = async (addressId: string | number): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to delete address: ${response.status}`);
      }

      return true;
    } catch (err) {
      console.error('Failed to delete customer address:', err);
      return false;
    }
  };

  const setDefaultCustomerAddress = async (addressId: string | number): Promise<boolean> => {
    try {
      const token = getAuthToken();
      if (!token) return false;

      const response = await fetch(`/api/addresses/${addressId}/set-default`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(errorText || `Failed to set default address: ${response.status}`);
      }

      return true;
    } catch (err) {
      console.error('Failed to set default address:', err);
      return false;
    }
  };

  // Load provinces when component mounts
  useEffect(() => {
    const loadProvinces = async () => {
      try {
        setLoadingProvinces(true);
        const data = await getProvinces();
        setProvinces(data);
      } catch (err) {
        console.error('Failed to load provinces:', err);
      } finally {
        setLoadingProvinces(false);
      }
    };
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      const loadDistricts = async () => {
        try {
          setLoadingDistricts(true);
          setDistricts([]);
          setWards([]);
          setSelectedDistrict(null);
          setSelectedWard(null);
          const data = await getDistrictsByProvince(selectedProvince);
          setDistricts(data);
        } catch (err) {
          console.error('Failed to load districts:', err);
        } finally {
          setLoadingDistricts(false);
        }
      };
      loadDistricts();
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const loadWards = async () => {
        try {
          setLoadingWards(true);
          setWards([]);
          setSelectedWard(null);
          const data = await getWardsByDistrict(selectedDistrict);
          setWards(data);
        } catch (err) {
          console.error('Failed to load wards:', err);
        } finally {
          setLoadingWards(false);
        }
      };
      loadWards();
    } else {
      setWards([]);
    }
  }, [selectedDistrict]);

  // Auto-update addressText when address components change
  useEffect(() => {
    if (selectedProvince || selectedDistrict || selectedWard || detailedAddress) {
      const provinceName = provinces.find(p => p.code === selectedProvince)?.name || '';
      const districtName = districts.find(d => d.code === selectedDistrict)?.name || '';
      const wardName = wards.find(w => w.code === selectedWard)?.name || '';
      const parts = [detailedAddress, wardName, districtName, provinceName].filter(Boolean);
      const fullAddress = parts.join(', ');
      setEditForm(prev => ({ ...prev, addressText: fullAddress }));
    }
  }, [selectedProvince, selectedDistrict, selectedWard, detailedAddress, provinces, districts, wards]);

  // Auto-preview map when user inputs a new detailed address.
  useEffect(() => {
    if (!isEditing) return;

    // With saved address selection, use existing coordinates directly.
    if (selectedExistingAddressId !== null) {
      const selectedAddress = customerAddresses.find((addr, index) => {
        const id = addr.addressId ?? `address-${index}`;
        return isSameAddressId(selectedExistingAddressId, id);
      });

      if (
        selectedAddress &&
        typeof selectedAddress.latitude === 'number' &&
        typeof selectedAddress.longitude === 'number'
      ) {
        setMapPreview({ latitude: selectedAddress.latitude, longitude: selectedAddress.longitude });
        setMapPreviewError(null);
      } else {
        setMapPreview(null);
      }
      setMapPreviewLoading(false);
      return;
    }

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
          setEditForm((prev) => ({
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
    selectedExistingAddressId,
    customerAddresses,
    detailedAddress,
    selectedProvince,
    selectedDistrict,
    selectedWard,
    provinces,
    districts,
    wards,
  ]);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('🔄 Loading profile...');

        const [profileData, addressesData] = await Promise.all([
          getProfile(),
          fetchCustomerAddresses()
        ]);

        setCustomerAddresses(addressesData);

        const defaultAddress = addressesData.find(addr => addr.isDefault) || addressesData[0];
        setSelectedExistingAddressId(defaultAddress?.addressId ?? null);
        const defaultAddressDetail = defaultAddress?.addressId !== undefined && defaultAddress?.addressId !== null
          ? await fetchCustomerAddressDetail(defaultAddress.addressId)
          : null;
        const resolvedAddress = defaultAddressDetail || defaultAddress;

        const resolvedAddressText = resolvedAddress?.addressText || resolvedAddress?.fullAddress || profileData.addressText || '';
        const resolvedLatitude = typeof resolvedAddress?.latitude === 'number' ? resolvedAddress.latitude : (profileData.latitude || 0);
        const resolvedLongitude = typeof resolvedAddress?.longitude === 'number' ? resolvedAddress.longitude : (profileData.longitude || 0);

        const profileWithAddress: UserProfile = {
          ...profileData,
          addressText: resolvedAddressText,
          latitude: resolvedLatitude,
          longitude: resolvedLongitude,
        };

        const hasFullName = !!profileWithAddress.fullName?.trim();
        const hasPhoneNumber = !!profileWithAddress.phoneNumber?.trim();
        const hasDateOfBirth = !!profileWithAddress.dateOfBirth;
        const hasAddress = !!resolvedAddressText?.trim() || addressesData.length > 0;
        const isProfileIncomplete = !(hasFullName && hasPhoneNumber && hasDateOfBirth && hasAddress);

        const requireFirstTimeSetup = isFirstTimeSetup && isProfileIncomplete;
        setIsProfileSetupRequired(requireFirstTimeSetup);
        setIsEditing(requireFirstTimeSetup);

        setProfile(profileWithAddress);

        // Populate edit form with current profile data
        // Handle empty dateOfBirth gracefully
        const dateOfBirth = profileWithAddress.dateOfBirth
          ? profileWithAddress.dateOfBirth.split('T')[0]
          : ''; // Empty date for new profiles

        setEditForm({
          fullName: profileWithAddress.fullName || '',
          gender: profileWithAddress.gender || 'Male',
          phoneNumber: profileWithAddress.phoneNumber || '',
          dateOfBirth: dateOfBirth,
          addressText: profileWithAddress.addressText || '',
          latitude: profileWithAddress.latitude || 0,
          longitude: profileWithAddress.longitude || 0
        });

        // Note: User will need to re-select address using dropdowns when editing
        // The addressText will be displayed as read-only text in view mode

        console.log('✅ Profile loaded successfully:', profileWithAddress);
        console.log('📍 Coordinates:', {
          latitude: profileWithAddress.latitude,
          longitude: profileWithAddress.longitude
        });

        // If profile is empty (first-time user), log it
        if (!profileWithAddress.fullName || !profileWithAddress.phoneNumber) {
          console.log('⚠️ Profile is incomplete - first-time setup required');
        }

        // Profile already completed: remove firstTime mode for current and next visits.
        if (isFirstTimeSetup && !isProfileIncomplete) {
          navigate('/profile', { replace: true });
        }
      } catch (err) {
        console.error('❌ Failed to load profile:', err);
        setError('Không thể tải thông tin profile. Vui lòng thử lại.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [isFirstTimeSetup, navigate]);

  // Block browser back button during first-time setup
  useEffect(() => {
    if (isProfileSetupRequired) {
      const handlePopState = (e: PopStateEvent) => {
        e.preventDefault();
        toast.warning('Bạn cần hoàn thành thông tin cá nhân trước khi tiếp tục.');
        window.history.pushState(null, '', window.location.href);
      };

      // Add current state to history
      window.history.pushState(null, '', window.location.href);

      // Listen for back button
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [isProfileSetupRequired]);

  // Handle avatar file selection
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // For latitude and longitude, keep as string in form but validate numeric pattern
    if (name === 'latitude' || name === 'longitude') {
      // Allow numbers, dots, minus sign for coordinates
      const numericPattern = /^-?[0-9]*\.?[0-9]*$/;
      if (value === '' || numericPattern.test(value)) {
        setEditForm(prev => ({
          ...prev,
          [name]: value === '' ? 0 : value
        }));
      }
    } else {
      setEditForm(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Automatically get coordinates from OpenStreetMap Nominatim (FREE) + fallbacks
  const handleGetCoordinates = async () => {
    try {
      setGeoLoading(true);
      setGeoError(null);

      // Build full address from selected components
      const selectedProvinceName = provinces.find(p => p.code === selectedProvince)?.name;
      const selectedDistrictName = districts.find(d => d.code === selectedDistrict)?.name;
      const selectedWardName = wards.find(w => w.code === selectedWard)?.name;

      if (!selectedProvinceName || !selectedDistrictName) {
        setGeoError('Vui lòng chọn đầy đủ Tỉnh/Thành phố và Quận/Huyện');
        return;
      }

      console.log('🗺️ Getting coordinates with components:', {
        detailedAddress,
        wardName: selectedWardName,
        districtName: selectedDistrictName,
        provinceName: selectedProvinceName
      });

      // Use enhanced geocoding with multiple query strategies
      const result = await geocodingService.geocodeAddressComponents({
        detailedAddress: detailedAddress.trim() || undefined,
        wardName: selectedWardName,
        districtName: selectedDistrictName,
        provinceName: selectedProvinceName
      });

      if (result) {
        setEditForm(prev => ({
          ...prev,
          latitude: result.latitude,
          longitude: result.longitude
        }));

        console.log('✅ Coordinates updated:', {
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress,
          provider: result.provider
        });

        // Show success message with provider info
        const providerNames = {
          'nominatim': 'OpenStreetMap Nominatim',
          'google': '📍 Google Maps',
          'approximate': '📌 Ước lượng'
        };

        const providerName = providerNames[result.provider] || result.provider;

        alert(` Đã lấy tọa độ thành công từ ${providerName}!\n\nVĩ độ: ${result.latitude}\nKinh độ: ${result.longitude}\n\nĐịa chỉ tìm được: ${result.formattedAddress}`);
      }
    } catch (error) {
      console.error('❌ Error getting coordinates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi lấy tọa độ';
      setGeoError(errorMessage);
    } finally {
      setGeoLoading(false);
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
      setIsMapSelectionLocked(true);
      setEditForm((prev) => ({ ...prev, latitude, longitude }));

      const reverseAddress = await geocodingService.reverseGeocode(latitude, longitude);
      if (reverseAddress) {
        setDetailedAddress(reverseAddress);
      }
    } catch (error) {
      console.error('❌ Failed to get current location:', error);
      setMapPreviewError('Không thể lấy vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí.');
    } finally {
      setMapPreviewLoading(false);
    }
  };

  const handleMapPositionChange = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
    setMapPreview({ latitude, longitude });
    setIsMapSelectionLocked(true);
    setMapPreviewError(null);
    setEditForm((prev) => ({
      ...prev,
      latitude,
      longitude,
    }));
  };

  useEffect(() => {
    if (!isEditing || selectedExistingAddressId !== null) {
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
  }, [isEditing, selectedExistingAddressId, detailedAddress, selectedDistrict, selectedProvince, districts, provinces]);

  const handlePickAddressSuggestion = (suggestion: AddressSuggestion) => {
    const display = suggestion.displayName;
    const firstPart = display.split(',')[0]?.trim() || detailedAddress;

    setSelectedExistingAddressId(null);
    setDetailedAddress(firstPart);
    setMapPreview({ latitude: suggestion.latitude, longitude: suggestion.longitude });
    setIsMapSelectionLocked(true);
    setMapPreviewError(null);
    setAddressSuggestions([]);
    setEditForm((prev) => ({
      ...prev,
      addressText: display,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    }));
  };

  const findProvinceByReverse = (reverseData: ReverseGeocodingAddress): Province | undefined => {
    return provinces.find((province) => {
      return (
        isNameMatch(reverseData.provinceName, province.name) ||
        isNameMatch(reverseData.provinceName, province.full_name) ||
        isNameMatch(reverseData.formattedAddress, province.name) ||
        isNameMatch(reverseData.formattedAddress, province.full_name)
      );
    });
  };

  const findDistrictByReverse = (reverseData: ReverseGeocodingAddress, districtList: District[]): District | undefined => {
    return districtList.find((district) => {
      return (
        isNameMatch(reverseData.districtName, district.name) ||
        isNameMatch(reverseData.districtName, district.full_name) ||
        isNameMatch(reverseData.formattedAddress, district.name) ||
        isNameMatch(reverseData.formattedAddress, district.full_name)
      );
    });
  };

  const findWardByReverse = (reverseData: ReverseGeocodingAddress, wardList: Ward[]): Ward | undefined => {
    return wardList.find((ward) => {
      return (
        isNameMatch(reverseData.wardName, ward.name) ||
        isNameMatch(reverseData.wardName, ward.full_name) ||
        isNameMatch(reverseData.formattedAddress, ward.name) ||
        isNameMatch(reverseData.formattedAddress, ward.full_name)
      );
    });
  };

  const handleConfirmMapSelection = async () => {
    const targetLat = mapPickerPosition.latitude;
    const targetLng = mapPickerPosition.longitude;

    try {
      setMapConfirmLoading(true);
      setMapPreviewError(null);
      setSelectedExistingAddressId(null);

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
        effectiveReverseData.formattedAddress.split(',')[0]?.trim() ||
        detailedAddress;

      if (isPinnedCoordinateLabel(nextDetailedAddress)) {
        nextDetailedAddress = effectiveReverseData.formattedAddress.split(',')[0]?.trim() || '';
      }

      let resolvedDetailedAddress = nextDetailedAddress;
      let resolvedAddressTextFromSuggestion = '';

      // Prefer nearest suggestion around the selected pin to avoid keeping stale value like S106 when pin is on S105.
      if (detailedAddress.trim().length >= 3 && !isPinnedCoordinateLabel(detailedAddress)) {
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
            resolvedDetailedAddress = nearest.displayName.split(',')[0]?.trim() || resolvedDetailedAddress;
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

      const composedAddressText = [resolvedDetailedAddress, wardText, districtText, provinceText]
        .filter(Boolean)
        .join(', ');

      setDetailedAddress(resolvedDetailedAddress);

      setMapPreview({ latitude: targetLat, longitude: targetLng });
      setIsMapSelectionLocked(true);
      setEditForm((prev) => ({
        ...prev,
        latitude: targetLat,
        longitude: targetLng,
        addressText:
          resolvedAddressTextFromSuggestion ||
          composedAddressText ||
          effectiveReverseData.formattedAddress ||
          prev.addressText,
      }));

      toast.success('Đã xác nhận vị trí pin và tự động điền địa chỉ vào form.');
    } catch (error) {
      console.error('❌ Failed to confirm map selection:', error);
      setMapPreviewError('Không thể xác nhận vị trí trên bản đồ. Vui lòng thử lại.');
    } finally {
      setMapConfirmLoading(false);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setUpdating(true);
      setError(null);

      // Auto-fetch coordinates from address before saving
      if (selectedProvince && selectedDistrict) {
        try {
          const selectedProvinceName = provinces.find(p => p.code === selectedProvince)?.name;
          const selectedDistrictName = districts.find(d => d.code === selectedDistrict)?.name;
          const selectedWardName = wards.find(w => w.code === selectedWard)?.name;
          if (selectedProvinceName && selectedDistrictName) {
            const geoResult = await geocodingService.geocodeAddressComponents({
              detailedAddress: detailedAddress?.trim() || undefined,
              wardName: selectedWardName,
              districtName: selectedDistrictName,
              provinceName: selectedProvinceName,
            });
            if (geoResult) {
              setEditForm(prev => ({
                ...prev,
                latitude: geoResult.latitude,
                longitude: geoResult.longitude,
              }));
              editForm.latitude = geoResult.latitude;
              editForm.longitude = geoResult.longitude;
            }
          }
        } catch {
          // silently ignore geo errors — save continues with existing coordinates
        }
      }

      const updateData: UpdateProfileRequest = {
        ...editForm,
        // Convert coordinate strings to numbers before sending to API
        latitude: typeof editForm.latitude === 'string' ? parseFloat(editForm.latitude) || 0 : editForm.latitude,
        longitude: typeof editForm.longitude === 'string' ? parseFloat(editForm.longitude) || 0 : editForm.longitude,
        avatarFile: avatarFile
      };

      const normalizedAddress = (updateData.addressText || '').trim();
      if (normalizedAddress) {
        const normalizedAddressLower = normalizedAddress.toLowerCase();
        const matchedAddress = customerAddresses.find(addr => {
          const text = (addr.addressText || addr.fullAddress || '').trim().toLowerCase();
          return text === normalizedAddressLower;
        });
        const selectedAddress = selectedExistingAddressId !== null
          ? customerAddresses.find(addr => isSameAddressId(addr.addressId ?? null, selectedExistingAddressId))
          : undefined;

        if (selectedAddress?.addressId !== undefined && selectedAddress?.addressId !== null) {
          if (!selectedAddress.isDefault) {
            const setDefaultOk = await setDefaultCustomerAddress(selectedAddress.addressId);
            if (setDefaultOk) {
              setCustomerAddresses(prev => prev.map(item => ({
                ...item,
                isDefault: isSameAddressId(item.addressId ?? null, selectedAddress.addressId ?? null),
              })));
            }
          }
        } else if (matchedAddress?.addressId !== undefined && matchedAddress?.addressId !== null) {
          if (!matchedAddress.isDefault) {
            const setDefaultOk = await setDefaultCustomerAddress(matchedAddress.addressId);
            if (setDefaultOk) {
              setCustomerAddresses(prev => prev.map(item => ({
                ...item,
                isDefault: isSameAddressId(item.addressId ?? null, matchedAddress.addressId ?? null),
              })));
            }
          }
        } else {
          // Create new address and keep old addresses intact.
          const createdAddress = await createCustomerAddress({
            addressText: normalizedAddress,
            latitude: updateData.latitude,
            longitude: updateData.longitude,
            isDefault: customerAddresses.length === 0,
          });

          if (createdAddress) {
            setCustomerAddresses(prev => [...prev, createdAddress]);

            if (createdAddress.addressId !== undefined && createdAddress.addressId !== null && customerAddresses.length > 0) {
              const setDefaultOk = await setDefaultCustomerAddress(createdAddress.addressId);
              if (setDefaultOk) {
                setCustomerAddresses(prev => prev.map(item => ({
                  ...item,
                  isDefault: isSameAddressId(item.addressId ?? null, createdAddress.addressId ?? null),
                })));
              }
            }
          }
        }
      }

      console.log('📤 Update data being sent:', updateData);

      const updatedProfile = await updateProfile(updateData);

      console.log('✅ Profile updated, reloading from server...');

      // Fetch fresh profile data from server to ensure we have the latest
      const [refreshedProfile, refreshedAddresses] = await Promise.all([
        getProfile(),
        fetchCustomerAddresses()
      ]);

      setCustomerAddresses(refreshedAddresses);

      const refreshedDefaultAddress = refreshedAddresses.find(addr => addr.isDefault) || refreshedAddresses[0];
      const refreshedDefaultAddressDetail = refreshedDefaultAddress?.addressId !== undefined && refreshedDefaultAddress?.addressId !== null
        ? await fetchCustomerAddressDetail(refreshedDefaultAddress.addressId)
        : null;
      const resolvedRefreshedAddress = refreshedDefaultAddressDetail || refreshedDefaultAddress;

      const refreshedAddressText = resolvedRefreshedAddress?.addressText || resolvedRefreshedAddress?.fullAddress || refreshedProfile.addressText;
      const refreshedLatitude = typeof resolvedRefreshedAddress?.latitude === 'number' ? resolvedRefreshedAddress.latitude : (refreshedProfile.latitude || 0);
      const refreshedLongitude = typeof resolvedRefreshedAddress?.longitude === 'number' ? resolvedRefreshedAddress.longitude : (refreshedProfile.longitude || 0);

      const refreshedProfileWithAddress: UserProfile = {
        ...refreshedProfile,
        addressText: refreshedAddressText,
        latitude: refreshedLatitude,
        longitude: refreshedLongitude,
      };

      // Update local state with refreshed data
      setProfile(refreshedProfileWithAddress);

      // Update edit form with new data
      setEditForm({
        fullName: refreshedProfileWithAddress.fullName,
        gender: refreshedProfileWithAddress.gender,
        phoneNumber: refreshedProfileWithAddress.phoneNumber,
        dateOfBirth: refreshedProfileWithAddress.dateOfBirth.split('T')[0],
        addressText: refreshedProfileWithAddress.addressText,
        latitude: refreshedProfileWithAddress.latitude || 0,
        longitude: refreshedProfileWithAddress.longitude || 0
      });

      // Reset editing state
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);

      // If first-time setup, redirect to home with success message
      if (isProfileSetupRequired) {
        localStorage.setItem(PROFILE_SETUP_REQUIRED_KEY, 'false');
        toast.message({
          title: 'Hoàn thành thiết lập tài khoản!',
          text: 'Chào mừng bạn đến với Modern Ritual. Chúc bạn có trải nghiệm tuyệt vời!',
          icon: 'success',
          confirmButtonText: 'Bắt đầu mua sắm'
        });
        console.log('✅ First-time setup complete, redirecting to home...');
        navigate('/');
        return;
      }

      toast.success('Cập nhật profile thành công!');
      console.log('✅ Profile refreshed:', refreshedProfileWithAddress);
    } catch (err) {
      console.error('❌ Failed to update profile:', err);
      setError('Không thể cập nhật profile. Vui lòng thử lại.');
      toast.error('Cập nhật thất bại: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setUpdating(false);
    }
  };

  // Handle change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự!');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      setChangingPassword(true);
      console.log('🔄 Changing password...');

      const response = await changePassword({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword
      });

      setPasswordSuccess(response.message);

      // Reset form
      setPasswordForm({
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Hide form after 2 seconds
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess(null);
      }, 2000);

      console.log('✅ Password changed successfully');
    } catch (err) {
      console.error('❌ Failed to change password:', err);
      setPasswordError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogoutFromSetup = async () => {
    const result = await toast.confirm({
      title: 'Đăng xuất?',
      text: 'Bạn có chắc muốn đăng xuất khỏi tài khoản không?',
      icon: 'warning',
      confirmButtonText: 'Đăng xuất',
      cancelButtonText: 'Hủy'
    });

    if (!result.isConfirmed) return;

    try {
      setLoggingOut(true);
      await logoutComplete();
      localStorage.setItem(PROFILE_SETUP_REQUIRED_KEY, 'false');
      window.location.href = '/auth';
    } catch (err) {
      console.error('❌ Failed to logout from setup:', err);
      toast.error('Không thể đăng xuất. Vui lòng thử lại.');
    } finally {
      setLoggingOut(false);
    }
  };

  const mockOrders = [
    {
      id: '#MRT-8829-2024',
      product: 'Mâm Cúng Đầy Tháng Đặc Biệt',
      date: '2024-01-12',
      total: 2500000,
      status: 'Đang giao',
      image: 'https://picsum.photos/100/100?random=1'
    },
    {
      id: '#MRT-8828-2024',
      product: 'Gói Đại Phát - Khai Trương',
      date: '2024-01-10',
      total: 4950000,
      status: 'Hoàn tất',
      image: 'https://picsum.photos/100/100?random=2'
    },
    {
      id: '#MRT-8827-2024',
      product: 'Gói Bình An - Tân Gia',
      date: '2024-01-05',
      total: 1850000,
      status: 'Hoàn tát',
      image: 'https://picsum.photos/100/100?random=3'
    }
  ];

  const mockReviews = [
    {
      id: 1,
      product: 'Mâm Cúng Đầy Tháng Đặc Biệt',
      rating: 5,
      date: '2024-01-12',
      comment: 'Rất hài lòng với dịch vụ. Mâm cúng được chuẩn bị tỉ mỉ, đúng giờ giao. Đội ngũ chuyên nghiệp và tư vấn kỹ lưỡng.'
    }
  ];

  return (
    <div className="min-h-screen bg-white py-12">
      <div className="max-w-7xl mx-auto px-6 md:px-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
          <div className="flex gap-6">
            <div className="w-24 h-24 rounded-full bg-cover border-4 border-gold shadow-lg"
              style={{ backgroundImage: profile?.avatarUrl ? `url("${profile.avatarUrl}")` : 'url("https://picsum.photos/200/200?random=profile")' }} />
            <div className="flex flex-col justify-center">
              <h1 className="text-3xl font-black text-primary font-display mb-2">
                {loading ? 'Đang tải...' : profile?.fullName || 'Chưa có tên'}
              </h1>
              <p className="text-slate-500">{loading ? '...' : getCurrentUser()?.email || profile?.userId}</p>
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 bg-gray-100 text-primary text-xs font-bold uppercase rounded-lg">
                  {profile?.isVendor ? 'Vendor' : 'Customer'}
                </span>
                {profile?.isVendor && profile?.ratingAvg > 0 && (
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold uppercase rounded-lg">
                    ⭐ {profile.ratingAvg.toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              // Don't allow canceling during first-time setup
              if (isProfileSetupRequired) {
                toast.warning('Bạn cần hoàn thành thông tin cá nhân để tiếp tục sử dụng dịch vụ.');
                return;
              }

              if (!isEditing && profile) {
                // When entering edit mode, reset form to current profile data
                setEditForm({
                  fullName: profile.fullName,
                  gender: profile.gender,
                  phoneNumber: profile.phoneNumber,
                  dateOfBirth: profile.dateOfBirth.split('T')[0],
                  addressText: profile.addressText,
                  latitude: profile.latitude || 0,
                  longitude: profile.longitude || 0
                });
              } else {
                // When exiting edit mode, also reset
                if (profile) {
                  setEditForm({
                    fullName: profile.fullName,
                    gender: profile.gender,
                    phoneNumber: profile.phoneNumber,
                    dateOfBirth: profile.dateOfBirth.split('T')[0],
                    addressText: profile.addressText,
                    latitude: profile.latitude || 0,
                    longitude: profile.longitude || 0
                  });
                }
                setAvatarFile(null);
                setAvatarPreview(null);
              }
              setIsEditing(!isEditing);
            }}
            disabled={loading}
            className={`px-6 py-3 rounded-xl font-bold text-sm uppercase tracking-wider hover:scale-105 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isProfileSetupRequired && isEditing
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white'
              }`}
          >
            {isEditing ? (isProfileSetupRequired ? 'Bắt buộc hoàn thành' : 'Hủy') : 'Chỉnh sửa'}
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
              <p className="text-slate-500 font-semibold">Đang tải thông tin...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="font-bold text-red-800 mb-1">Có lỗi xảy ra</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Main Content - Only show when not loading */}
        {!loading && !error && (
          <>
            {/* First-Time Setup Banner */}
            {/* {isFirstTimeSetup && (
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-8 shadow-xl border-2 border-blue-700 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center">
                <span className="text-3xl">👋</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">
                  Chào mừng bạn đến với Modern Ritual!
                </h3>
                <p className="text-blue-50 mb-4 leading-relaxed">
                  Để bắt đầu sử dụng dịch vụ, vui lòng hoàn thành thông tin cá nhân của bạn. 
                  Các thông tin này sẽ giúp chúng tôi phục vụ bạn tốt hơn.
                </p>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                  <p className="text-white font-semibold mb-2">📝 Thông tin cần điền:</p>
                  <ul className="text-blue-50 space-y-1 text-sm">
                    <li>✓ Họ và tên đầy đủ</li>
                    <li>✓ Số điện thoại liên hệ</li>
                    <li>✓ Ngày sinh</li>
                    <li>✓ Địa chỉ giao hàng</li>
                  </ul>
                </div>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="mt-4 bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 transition-all shadow-lg hover:scale-105"
                  >
                    Bắt đầu điền thông tin →
                  </button>
                )}
              </div>
            </div>
          </div>
        )} */}

            {/* Tabs */}
            <div className="-mx-6 md:-mx-10 px-6 md:px-10 mb-8 bg-white/98 backdrop-blur-sm py-4 border-y border-gray-200 shadow-md sticky top-[88px] z-[100]">
              <div className="flex gap-2 max-w-7xl mx-auto">
                {['info', 'orders', 'reviews'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      // Disable switching tabs during first-time setup
                      if (isProfileSetupRequired) {
                        return;
                      }
                      setActiveTab(tab as any);
                    }}
                    disabled={isProfileSetupRequired && tab !== 'info'}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm uppercase transition-all tracking-wider ${activeTab === tab
                        ? 'bg-primary text-white shadow-md'
                        : isProfileSetupRequired && tab !== 'info'
                          ? 'text-slate-300 cursor-not-allowed opacity-50'
                          : 'text-slate-500 hover:text-primary'
                      }`}
                  >
                    {tab === 'info' && 'Thông tin cá nhân'}
                    {tab === 'orders' && `Đơn hàng (${mockOrders.length})`}
                    {tab === 'reviews' && `Đánh giá (${mockReviews.length})`}
                    {isProfileSetupRequired && tab !== 'info' && ' 🔒'}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="relative">
              {activeTab === 'info' && (
                <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-lg p-8 md:p-12 relative z-10">
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <h3 className="text-2xl font-bold text-primary mb-6">Chỉnh Sửa Thông Tin</h3>

                      {/* Avatar Upload */}
                      <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                          <div
                            className="w-32 h-32 rounded-full bg-cover border-4 border-primary shadow-lg"
                            style={{
                              backgroundImage: avatarPreview
                                ? `url("${avatarPreview}")`
                                : profile?.avatarUrl
                                  ? `url("${profile.avatarUrl}")`
                                  : 'url("https://picsum.photos/200/200?random=profile")'
                            }}
                          />
                          <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-all">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                            />

                          </label>
                        </div>
                        <p className="text-xs text-slate-500">Click vào icon để thay đổi ảnh đại diện</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                            Họ và tên <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="fullName"
                            value={editForm.fullName}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                            Số điện thoại <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            name="phoneNumber"
                            value={editForm.phoneNumber}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>

                        {/* Gender */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                            Giới tính <span className="text-red-500">*</span>
                          </label>
                          <select
                            name="gender"
                            value={editForm.gender}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                            <option value="Khác">Khác</option>
                          </select>
                        </div>

                        {/* Date of Birth */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                            Ngày sinh <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="date"
                            name="dateOfBirth"
                            value={editForm.dateOfBirth}
                            onChange={handleInputChange}
                            required
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                          />
                        </div>
                      </div>

                      {/* Address Section */}
                      <div className="space-y-4">
                        {customerAddresses.length > 0 && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                                Địa chỉ đã lưu
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedExistingAddressId(null);
                                  setIsMapSelectionLocked(false);
                                  setSelectedProvince(null);
                                  setSelectedDistrict(null);
                                  setSelectedWard(null);
                                  setDetailedAddress('');
                                  setProvinceSearch('');
                                  setDistrictSearch('');
                                  setWardSearch('');
                                  setEditForm(prev => ({
                                    ...prev,
                                    addressText: '',
                                    latitude: 0,
                                    longitude: 0,
                                  }));
                                }}
                                className={`text-xs font-semibold ${selectedExistingAddressId === null
                                    ? 'text-slate-400 cursor-default'
                                    : 'text-primary hover:underline'
                                  }`}
                              >
                                {selectedExistingAddressId === null ? 'Đang nhập địa chỉ mới' : 'Nhập địa chỉ mới'}
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {customerAddresses.map((addr, index) => {
                                const id = addr.addressId ?? `address-${index}`;
                                const isSelected = isSameAddressId(selectedExistingAddressId, id);
                                const label = addr.addressText || addr.fullAddress || '';
                                const handleSelectAddress = () => {
                                  setSelectedExistingAddressId(id);
                                  setIsMapSelectionLocked(true);
                                  setSelectedProvince(null);
                                  setSelectedDistrict(null);
                                  setSelectedWard(null);
                                  setDetailedAddress(label);
                                  setEditForm(prev => ({
                                    ...prev,
                                    addressText: label,
                                    latitude: typeof addr.latitude === 'number' ? addr.latitude : prev.latitude,
                                    longitude: typeof addr.longitude === 'number' ? addr.longitude : prev.longitude,
                                  }));
                                };

                                return (
                                  <div
                                    key={id}
                                    onClick={handleSelectAddress}
                                    className={`text-left p-3 rounded-xl border transition-all ${isSelected
                                        ? 'border-primary bg-primary/5'
                                        : 'border-gray-200 hover:border-primary/50'
                                      } cursor-pointer`}
                                  >
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                      <div className="flex items-center gap-2">
                                        {addr.isDefault && (
                                          <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold uppercase">
                                            Mặc định
                                          </span>
                                        )}
                                        {isSelected && (
                                          <span className="text-[10px] px-2 py-0.5 rounded bg-primary text-white font-bold uppercase">
                                            Đang dùng
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <p className="text-sm text-slate-700 line-clamp-2 min-h-[40px]">
                                      {label || 'Chưa có nội dung địa chỉ'}
                                    </p>
                                    {isSelected && (
                                      <div
                                        className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <button
                                          type="button"
                                          onClick={handleSelectAddress}
                                          className={`w-full rounded-lg px-3 py-2 text-xs font-bold transition-all ${isSelected
                                              ? 'bg-primary text-white'
                                              : 'bg-primary/10 text-primary hover:bg-primary/20'
                                            }`}
                                        >
                                          {isSelected ? 'Đang chọn' : 'Dùng địa chỉ này'}
                                        </button>

                                        {addr.addressId !== undefined && addr.addressId !== null ? (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              if (addr.isDefault) {
                                                toast.success('Địa chỉ này đã là mặc định.');
                                                return;
                                              }

                                              const updated = await setDefaultCustomerAddress(addr.addressId as string | number);
                                              if (!updated) {
                                                toast.error('Không thể đặt địa chỉ mặc định. Vui lòng thử lại.');
                                                return;
                                              }

                                              setCustomerAddresses(prev => prev.map(item => ({
                                                ...item,
                                                isDefault: isSameAddressId(item.addressId ?? null, addr.addressId ?? null),
                                              })));
                                              toast.success('Đã đặt địa chỉ mặc định.');
                                            }}
                                            disabled={!!addr.isDefault}
                                            className={`w-full rounded-lg px-3 py-2 text-xs font-bold border transition-all ${addr.isDefault
                                                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                                                : 'border-amber-200 text-amber-700 hover:bg-amber-50'
                                              }`}
                                          >
                                            {addr.isDefault ? 'Đang mặc định' : 'Đặt mặc định'}
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            disabled
                                            className="w-full rounded-lg px-3 py-2 text-xs font-bold border border-gray-200 text-gray-400 cursor-not-allowed"
                                          >
                                            Không hỗ trợ
                                          </button>
                                        )}

                                        {!addr.isDefault && addr.addressId !== undefined && addr.addressId !== null ? (
                                          <button
                                            type="button"
                                            onClick={async () => {
                                              const confirmed = window.confirm('Bạn có chắc muốn xóa địa chỉ này không?');
                                              if (!confirmed) return;

                                              const deleted = await deleteCustomerAddress(addr.addressId as string | number);
                                              if (!deleted) {
                                                toast.error('Không thể xóa địa chỉ. Vui lòng thử lại.');
                                                return;
                                              }

                                              const remaining = customerAddresses.filter(
                                                item => !isSameAddressId(item.addressId ?? null, addr.addressId ?? null)
                                              );
                                              setCustomerAddresses(remaining);

                                              if (isSameAddressId(selectedExistingAddressId, id)) {
                                                const nextDefault = remaining.find(item => item.isDefault) || remaining[0];
                                                if (nextDefault) {
                                                  const nextId = nextDefault.addressId ?? null;
                                                  const nextLabel = nextDefault.addressText || nextDefault.fullAddress || '';
                                                  setSelectedExistingAddressId(nextId);
                                                  setDetailedAddress(nextLabel);
                                                  setEditForm(prev => ({
                                                    ...prev,
                                                    addressText: nextLabel,
                                                    latitude: typeof nextDefault.latitude === 'number' ? nextDefault.latitude : prev.latitude,
                                                    longitude: typeof nextDefault.longitude === 'number' ? nextDefault.longitude : prev.longitude,
                                                  }));
                                                } else {
                                                  setSelectedExistingAddressId(null);
                                                  setDetailedAddress('');
                                                  setEditForm(prev => ({ ...prev, addressText: '' }));
                                                }
                                              }

                                              toast.success('Xóa địa chỉ thành công.');
                                            }}
                                            className="w-full rounded-lg px-3 py-2 text-xs font-bold border border-red-200 text-red-600 hover:bg-red-50 transition-all"
                                          >
                                            Xóa địa chỉ
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            disabled
                                            className="w-full rounded-lg px-3 py-2 text-xs font-bold border border-gray-200 text-gray-400 cursor-not-allowed"
                                          >
                                            Không thể xóa
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Province */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                              Tỉnh/Thành phố <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={selectedProvince || ''}
                              onChange={(e) => {
                                setSelectedExistingAddressId(null);
                                setIsMapSelectionLocked(false);
                                const code = e.target.value ? Number(e.target.value) : null;
                                setSelectedProvince(code);
                                setSelectedDistrict(null);
                                setSelectedWard(null);
                                setProvinceSearch('');
                                setDistrictSearch('');
                                setWardSearch('');
                              }}
                              required={selectedExistingAddressId === null}
                              disabled={loadingProvinces}
                              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                                setSelectedExistingAddressId(null);
                                setIsMapSelectionLocked(false);
                                const code = e.target.value ? Number(e.target.value) : null;
                                setSelectedDistrict(code);
                                setSelectedWard(null);
                                setWardSearch('');
                              }}
                              disabled={!selectedProvince || loadingDistricts}
                              required={selectedExistingAddressId === null}
                              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {loadingDistricts ? 'Đang tải...' : 'Vui lòng chọn Quận/Huyện'}
                              </option>
                              {districts.map(district => (
                                <option key={district.code} value={district.code}>{district.name}</option>
                              ))}
                            </select>
                          </div>

                          {/* Ward */}
                          <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                              Phường/Xã {wards.length > 0 ? <span className="text-red-500">*</span> : '(Tùy chọn)'}
                            </label>
                            <select
                              value={selectedWard || ''}
                              onChange={(e) => {
                                setSelectedExistingAddressId(null);
                                setIsMapSelectionLocked(false);
                                const code = e.target.value ? Number(e.target.value) : null;
                                setSelectedWard(code);
                              }}
                              disabled={!selectedDistrict || loadingWards}
                              required={selectedExistingAddressId === null && wards.length > 0}
                              className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                            >
                              <option value="">
                                {loadingWards ? 'Đang tải...' : 'Chọn Phường/Xã'}
                              </option>
                              {wards.map(ward => (
                                <option key={ward.code} value={ward.code}>{ward.name}</option>
                              ))}
                            </select>
                            {selectedDistrict && !loadingWards && wards.length === 0 && (
                              <p className="text-xs text-amber-600 mt-1">
                                ⚠️ Chưa có dữ liệu phường/xã cho quận/huyện này. Vui lòng nhập trực tiếp vào "Địa chỉ cụ thể".
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Detailed Address */}
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                            Địa chỉ cụ thể <span className="text-red-500">*</span>
                            {selectedDistrict && wards.length === 0 && !loadingWards && (
                              <span className="text-xs normal-case text-slate-500"> (bao gồm phường/xã)</span>
                            )}
                          </label>
                          <input
                            type="text"
                            placeholder={
                              selectedDistrict && wards.length === 0 && !loadingWards
                                ? "VD: 123 Đường ABC, Phường XYZ..."
                                : "Số nhà, tên đường..."
                            }
                            value={detailedAddress}
                            onChange={(e) => {
                              setSelectedExistingAddressId(null);
                              setIsMapSelectionLocked(false);
                              setDetailedAddress(e.target.value);
                            }}
                            required={selectedExistingAddressId === null}
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
                              <p className="text-sm text-slate-500">Đang tìm vị trí trên bản đồ...</p>
                            )}
                            {!mapPreviewLoading && mapPreviewError && (
                              <p className="text-sm text-red-600">{mapPreviewError}</p>
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
                      </div>

                      {/* Coordinates are fetched automatically on save – no UI needed */}

                      {/* Buttons */}
                      <div className="flex gap-4 pt-4">
                        <button
                          type="submit"
                          disabled={updating}
                          className="flex-1 bg-primary text-white py-4 rounded-xl font-bold uppercase tracking-widest shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {updating ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                        {isProfileSetupRequired ? (
                          <button
                            type="button"
                            onClick={handleLogoutFromSetup}
                            disabled={updating || loggingOut}
                            className="flex-1 bg-red-100 text-red-700 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              // Reset form to current profile data
                              if (profile) {
                                setEditForm({
                                  fullName: profile.fullName,
                                  gender: profile.gender,
                                  phoneNumber: profile.phoneNumber,
                                  dateOfBirth: profile.dateOfBirth.split('T')[0],
                                  addressText: profile.addressText,
                                  latitude: profile.latitude || 0,
                                  longitude: profile.longitude || 0
                                });
                              }
                              setIsEditing(false);
                              setAvatarFile(null);
                              setAvatarPreview(null);
                            }}
                            disabled={updating}
                            className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-8">
                      {/* Basic Information */}
                      <div>
                        <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-gray-200">
                          Thông Tin Cơ Bản
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">Profile ID</span>
                      <p className="text-sm font-mono text-primary mt-1">{profile?.profileId}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                      <span className="text-xs font-bold uppercase text-slate-400">User ID</span>
                      <p className="text-sm font-mono text-primary mt-1">{profile?.userId}</p>
                    </div> */}
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase text-slate-400">Họ và tên</span>
                            <p className="text-lg font-bold text-primary mt-1">{profile?.fullName}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase text-slate-400">Email</span>
                            <p className="text-lg font-bold text-primary mt-1">{getCurrentUser()?.email}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase text-slate-400">Số điện thoại</span>
                            <p className="text-lg font-bold text-primary mt-1">{profile?.phoneNumber}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase text-slate-400">Giới tính</span>
                            <p className="text-lg font-bold text-primary mt-1">{getVietnameseGender(profile?.gender)}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase text-slate-400">Ngày sinh</span>
                            <p className="text-lg font-bold text-primary mt-1">
                              {profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : 'N/A'}
                            </p>
                          </div>
                          {profile?.isVendor && profile?.ratingAvg > 0 && (
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                              <span className="text-xs font-bold uppercase text-slate-400">Đánh giá trung bình</span>
                              <p className="text-lg font-bold text-primary mt-1">
                                ⭐ {profile?.ratingAvg.toFixed(1)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Address Information */}
                      <div>
                        <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-gray-200">
                          Địa Chỉ
                        </h3>
                        {customerAddresses.length > 0 && (
                          <p className="text-sm text-slate-500 mb-3">Đã tải {customerAddresses.length} địa chỉ từ tài khoản hiện tại.</p>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-3 p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase text-slate-400">Địa chỉ đầy đủ</span>
                            <p className="text-lg font-bold text-primary mt-1">{profile?.addressText}</p>
                          </div>
                        </div>
                      </div>

                      {/* Vendor Information - Only show if user is a vendor */}
                      {profile?.isVendor && (
                        <div>
                          <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-gray-200">
                            Thông Tin Vendor
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                              <span className="text-xs font-bold uppercase text-slate-400">Tên Shop</span>
                              <p className="text-lg font-bold text-primary mt-1">{profile?.shopName || 'N/A'}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                              <span className="text-xs font-bold uppercase text-slate-400">Số GPKD</span>
                              <p className="text-lg font-bold text-primary mt-1">{profile?.businessLicenseNo || 'N/A'}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                              <span className="text-xs font-bold uppercase text-slate-400">Trạng thái xác minh</span>
                              <p className="text-lg font-bold text-primary mt-1">{profile?.verificationStatus || 'N/A'}</p>
                            </div>
                            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                              <span className="text-xs font-bold uppercase text-slate-400">Đánh giá Shop</span>
                              <p className="text-lg font-bold text-primary mt-1">⭐ {profile?.ratingAvg.toFixed(1)}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* System Information */}
                      <div>
                        <h3 className="text-lg font-bold text-primary mb-4 pb-2 border-b-2 border-gray-200">
                          Thông Tin Hệ Thống
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase text-slate-400">Ngày tạo</span>
                            <p className="text-lg font-bold text-primary mt-1">
                              {profile?.createdAt ? new Date(profile.createdAt).toLocaleString('vi-VN') : 'N/A'}
                            </p>
                          </div>
                          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                            <span className="text-xs font-bold uppercase text-slate-400">Cập nhật lần cuối</span>
                            <p className="text-lg font-bold text-primary mt-1">
                              {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString('vi-VN') : 'N/A'}
                            </p>
                          </div>
                          {/* {profile?.avatarUrl && (
                      // <div className="md:col-span-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                      //   <span className="text-xs font-bold uppercase text-slate-400">Avatar URL</span>
                      //   <p className="text-sm font-mono text-primary mt-1 break-all">{profile.avatarUrl}</p>
                      // </div>
                    )} */}
                        </div>
                      </div>

                      {/* Security - Change Password */}
                      <div>
                        <div className="flex items-center justify-between mb-4 pb-2 border-b-2 border-gray-200">
                          <h3 className="text-lg font-bold text-primary">
                            Bảo Mật
                          </h3>
                          {!showChangePassword && (
                            <button
                              onClick={() => setShowChangePassword(true)}
                              className="px-4 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-all"
                            >
                              Đổi mật khẩu
                            </button>
                          )}
                        </div>

                        {showChangePassword ? (
                          <form onSubmit={handleChangePassword} className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                                Mật khẩu hiện tại <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                value={passwordForm.oldPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, oldPassword: e.target.value }))}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                                Mật khẩu mới <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                                required
                                minLength={6}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                              <p className="text-xs text-slate-500">Yêu cầu mật khẩu:

                                •
                                Tối thiểu 6 ký tự
                                •
                                Ít nhất 1 chữ cái viết HOA (A-Z)
                                •
                                Ít nhất 1 chữ cái viết thường (a-z)
                                •
                                Ít nhất 1 ký tự đặc biệt (!@#$%^&*)
                                •
                                Ít nhất 1 chữ số (0-9)
                                Ví dụ: Modern@123</p>
                            </div>

                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase text-slate-400 tracking-widest">
                                Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="password"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                              />
                            </div>

                            {passwordError && (
                              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                                <p className="text-red-600 text-sm font-semibold">{passwordError}</p>
                              </div>
                            )}

                            {passwordSuccess && (
                              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
                                <p className="text-green-600 text-sm font-semibold">{passwordSuccess}</p>
                              </div>
                            )}

                            <div className="flex gap-4 pt-2">
                              <button
                                type="submit"
                                disabled={changingPassword}
                                className="flex-1 bg-primary text-white py-3 rounded-xl font-bold uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {changingPassword ? 'Đang xử lý...' : 'Xác nhận đổi'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setShowChangePassword(false);
                                  setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
                                  setPasswordError(null);
                                  setPasswordSuccess(null);
                                }}
                                disabled={changingPassword}
                                className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Hủy
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="text-center py-6 text-slate-500">
                            <p className="text-sm">Nhấn nút "Đổi mật khẩu" để thay đổi mật khẩu của bạn</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'orders' && (
                <div className="space-y-6 relative z-10">
                  {mockOrders.map((order) => (
                    <div key={order.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all p-6 flex flex-col md:flex-row md:items-center gap-6">
                      <div className="w-20 h-20 rounded-xl flex-shrink-0 bg-cover border-2 border-gray-200" style={{ backgroundImage: `url("${order.image}")` }} />
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold uppercase text-gray-400 tracking-widest mb-1">{order.id}</p>
                            <h3 className="text-lg font-bold text-primary mb-1">{order.product}</h3>
                            <p className="text-sm text-slate-500">{order.date}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-black text-primary tracking-tight mb-2">{order.total.toLocaleString()}đ</p>
                            <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${order.status === 'Hoàn tát' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onNavigate('/tracking')}
                        className="md:self-start bg-primary text-white px-6 py-2 rounded-lg font-bold text-sm hover:scale-105 transition-all"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6 relative z-10">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-primary mb-1">{review.product}</h3>
                          <p className="text-sm text-slate-500">{review.date}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(review.rating)].map((_, i) => (
                            <span key={i} className="text-primary text-lg">★</span>
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{review.comment}</p>
                      <div className="flex gap-4 mt-6 pt-6 border-t border-gray-200">
                        <button className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/70 transition-all">
                          👍 Hữu ích (2)
                        </button>
                        <button className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-primary transition-all">
                          ✎ Chỉnh sửa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
