// API Base URL - Use proxy in development, direct URL in production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' // Use proxy in development
  : 'https://vietritual.click'; // Direct URL in production

// API Response Types
export interface ApiResponse<T> {
  statusCode: string;
  isSuccess: boolean;
  errorMessages: string[];
  result: T;
}

// ==================== LOGIN ====================

export interface LoginRequest {
  username: string;
  password: string;
}

// API Response from backend
interface LoginApiResponse {
  token: string;
  refreshToken: string;
}

// Response we return to the app (with decoded JWT data)
export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  role: string;
  name?: string;
}

// Helper function to decode JWT token
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Error decoding JWT:', error);
    return {};
  }
}

/**
 * Login API
 * POST /api/auth/login
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  try {
    console.log('🔐 Calling login API...');
    console.log('📤 Request payload:', credentials);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log('📡 Response status:', response.status);

    // Đọc response text trước để debug
    const responseText = await response.text();
    console.log('📥 Response text:', responseText);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage = errorData.errorMessages.join(', ');
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (e) {
        // Nếu không parse được JSON, dùng text gốc
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data: ApiResponse<LoginApiResponse> = JSON.parse(responseText);
    console.log('✅ Login API Response:', data);

    if (data.isSuccess && data.result) {
      // Decode JWT to get user info
      const decodedToken = decodeJWT(data.result.token);
      console.log('🔓 Decoded JWT:', decodedToken);

      // Get role from JWT and normalize to lowercase
      const role = (
        decodedToken.role ||
        decodedToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ||
        'customer'
      ).toLowerCase();

      const loginResponse: LoginResponse = {
        token: data.result.token,
        refreshToken: data.result.refreshToken,
        userId: decodedToken.sub || decodedToken.userId || '',
        email: decodedToken.email || credentials.username,
        role: role,
        name: decodedToken.name || decodedToken.given_name || decodedToken.email || credentials.username,
      };

      console.log('📦 Login Response (normalized):', loginResponse);
      return loginResponse;
    } else {
      console.error('❌ Login failed:', data.errorMessages);
      throw new Error(data.errorMessages.join(', ') || 'Đăng nhập thất bại');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

// ==================== REGISTER ====================

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  username: string;
  message?: string;
}

/**
 * Register API
 * POST /api/auth/register
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    console.log('📝 Calling register API...');
    console.log('📤 Request data:', data);

    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('📡 Response status:', response.status);

    // Đọc response text trước để debug
    const responseText = await response.text();
    console.log('📥 Response text:', responseText);

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage = errorData.errorMessages.join(', ');
        }
      } catch (e) {
        // Nếu không parse được JSON, dùng text gốc
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData: ApiResponse<RegisterResponse> = JSON.parse(responseText);
    console.log('✅ Register API Response:', responseData);

    if (responseData.isSuccess && responseData.result) {
      return responseData.result;
    } else {
      console.error('❌ Register failed:', responseData.errorMessages);
      throw new Error(responseData.errorMessages.join(', ') || 'Đăng ký thất bại');
    }
  } catch (error) {
    console.error('❌ Register error:', error);
    throw error;
  }
}

// ==================== CONFIRM EMAIL ====================

export interface ConfirmEmailRequest {
  email: string;
  token: string;
}

export interface ConfirmEmailResponse {
  success: boolean;
  message: string;
}

/**
 * Confirm Email API
 * POST /api/auth/confirm-email
 */
export async function confirmEmail(data: ConfirmEmailRequest): Promise<ConfirmEmailResponse> {
  try {
    console.log('✉️ Calling confirm-email API...');
    const response = await fetch(`${API_BASE_URL}/api/auth/confirm-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/plain',
      },
      body: JSON.stringify(data),
    });

    console.log('📡 Response status:', response.status);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData: ApiResponse<ConfirmEmailResponse> = await response.json();
    console.log('✅ Confirm Email API Response:', responseData);

    if (responseData.isSuccess && responseData.result) {
      return responseData.result;
    } else {
      console.error('❌ Confirm email failed:', responseData.errorMessages);
      throw new Error(responseData.errorMessages.join(', ') || 'Xác nhận email thất bại');
    }
  } catch (error) {
    console.error('❌ Confirm email error:', error);
    throw error;
  }
}

// ==================== LOGOUT ====================

/**
 * Logout - Clear ALL local storage data
 */
export function logout(): void {
  // Xóa tất cả dữ liệu trong localStorage
  localStorage.clear();
  console.log('✅ Logged out successfully - All localStorage cleared');
}

/**
 * Logout và redirect về trang login
 */
export function logoutAndRedirect(): void {
  logout();
  // Reload page để về trang login
  window.location.href = '/';
}

// ==================== GET CURRENT USER ====================

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

// ==================== PROFILE ====================

export interface UserProfile {
  profileId: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  avatarUrl: string | null;
  gender: string;
  dateOfBirth: string;
  addressText: string;
  latitude: number;
  longitude: number;
  isVendor: boolean;
  shopName: string | null;
  businessLicenseNo: string | null;
  verificationStatus: string | null;
  ratingAvg: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch user profile from backend
 * GET /api/profile
 */
export async function getProfile(): Promise<UserProfile> {
  console.log('📱 Fetching user profile...');
  
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    console.log('📱 Profile response status:', response.status);

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const data: ApiResponse<UserProfile> = await response.json();
    console.log('📱 Profile API response:', data);

    if (!data.isSuccess) {
      throw new Error(data.errorMessages?.join(', ') || 'Failed to fetch profile');
    }

    console.log('✅ Profile fetched successfully:', data.result);
    return data.result;
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    throw error;
  }
}

/**
 * Update user profile
 * PUT /api/profile
 */
export interface UpdateProfileRequest {
  fullName: string;
  gender: string;
  phoneNumber: string;
  dateOfBirth: string;
  addressText: string;
  latitude: number;
  longitude: number;
  avatarFile?: File | null;
}

export async function updateProfile(profileData: UpdateProfileRequest): Promise<UserProfile> {
  console.log('✏️ Updating user profile...');
  
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    // Create FormData for multipart/form-data
    const formData = new FormData();
    formData.append('FullName', profileData.fullName);
    formData.append('Gender', profileData.gender);
    formData.append('PhoneNumber', profileData.phoneNumber);
    formData.append('DateOfBirth', profileData.dateOfBirth);
    formData.append('AddressText', profileData.addressText);
    formData.append('Latitude', profileData.latitude.toString());
    formData.append('Longitude', profileData.longitude.toString());
    
    if (profileData.avatarFile) {
      formData.append('AvatarFile', profileData.avatarFile);
    }

    console.log('📤 Updating profile with data:', {
      fullName: profileData.fullName,
      gender: profileData.gender,
      phoneNumber: profileData.phoneNumber,
      dateOfBirth: profileData.dateOfBirth,
      addressText: profileData.addressText,
      latitude: profileData.latitude,
      longitude: profileData.longitude,
      hasAvatar: !!profileData.avatarFile
    });

    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
        // Note: Do NOT set Content-Type for FormData, browser will set it automatically with boundary
      },
      body: formData
    });

    console.log('✏️ Update profile response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Update failed:', errorText);
      throw new Error(`Failed to update profile: ${response.status}`);
    }

    const data: ApiResponse<UserProfile> = await response.json();
    console.log('✏️ Update profile API response:', data);

    if (!data.isSuccess) {
      throw new Error(data.errorMessages?.join(', ') || 'Failed to update profile');
    }

    console.log('✅ Profile updated successfully:', data.result);
    return data.result;
  } catch (error) {
    console.error('❌ Error updating profile:', error);
    throw error;
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get current logged-in user from localStorage
 */
export function getCurrentUser(): CurrentUser | null {
  try {
    const userStr = localStorage.getItem('smart-child-user');
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch (error) {
    console.error('❌ Error getting current user:', error);
    return null;
  }
}

/**
 * Get current auth token from localStorage
 */
export function getAuthToken(): string | null {
  return localStorage.getItem('smart-child-token');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getAuthToken();
}
