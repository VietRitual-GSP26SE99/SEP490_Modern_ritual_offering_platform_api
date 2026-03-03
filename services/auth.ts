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
  usernameOrEmail: string;
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
    console.log(' Calling login API...');
    console.log(' Request payload:', credentials);

    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    console.log(' Response status:', response.status);

    // Đọc response text trước để debug
    const responseText = await response.text();
    console.log(' Response text:', responseText);

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
    console.log(' Login API Response:', data);

    if (data.isSuccess && data.result) {
      // Decode JWT to get user info
      const decodedToken = decodeJWT(data.result.token);
      console.log(' Decoded JWT:', decodedToken);

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
        email: decodedToken.email || credentials.usernameOrEmail,
        role: role,
        name: decodedToken.name || decodedToken.given_name || decodedToken.email || credentials.usernameOrEmail,
      };

      console.log(' Login Response (normalized):', loginResponse);
      return loginResponse;
    } else {
      console.error(' Login failed:', data.errorMessages);
      throw new Error(data.errorMessages.join(', ') || 'Đăng nhập thất bại');
    }
  } catch (error) {
    console.error(' Login error:', error);
    throw error;
  }
}

// ==================== REGISTER ====================

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

// Backend trả về string message, không phải object
export interface RegisterResponse {
  userId?: string;
  email?: string;
  username?: string;
  message?: string;
}

/**
 * Register API
 * POST /api/auth/register
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  try {
    console.log('📝 Calling register API...');
    console.log('🌐 API_BASE_URL:', API_BASE_URL);
    console.log('🔗 Full URL:', `${API_BASE_URL}/api/auth/register`);
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

    const responseData: ApiResponse<RegisterResponse | string> = JSON.parse(responseText);
    console.log('✅ Register API Response:', responseData);

    if (responseData.isSuccess) {
      // Backend might return string message or object
      if (typeof responseData.result === 'string') {
        // Result is just a message string
        return {
          message: responseData.result,
          userId: '',
          email: data.email,
          username: data.username
        };
      } else if (responseData.result) {
        // Result is RegisterResponse object
        return responseData.result;
      } else {
        throw new Error('No result in response');
      }
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
    console.log('📤 Request data:', { email: data.email, token: data.token.substring(0, 20) + '...' });
    
    const response = await fetch(`${API_BASE_URL}/api/auth/confirm-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: '*/*',
      },
      body: JSON.stringify(data),
    });

    console.log('📡 Response status:', response.status);

    // Read response text first for debugging
    const responseText = await response.text();
    console.log('📥 Response text:', responseText);

    // Special case: 409 = Email already confirmed (treat as success)
    if (response.status === 409) {
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          const message = errorData.errorMessages[0];
          if (message.includes('đã được xác nhận') || message.includes('already confirmed')) {
            console.log('✅ Email already verified, treating as success');
            return {
              success: true,
              message: 'Email đã được xác nhận trước đó. Bạn có thể đăng nhập ngay.'
            };
          }
        }
      } catch (e) {
        // Continue to error handling below
      }
    }

    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = JSON.parse(responseText);
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          const message = errorData.errorMessages[0];
          
          // Special case: Concurrency failure = email was just verified (treat as success)
          if (message.includes('Optimistic concurrency failure') || 
              message.includes('object has been modified')) {
            console.log('✅ Concurrency error detected - email was already verified, treating as success');
            return {
              success: true,
              message: 'Email đã được xác nhận thành công! Bạn có thể đăng nhập ngay.'
            };
          }
          
          errorMessage = errorData.errorMessages.join(', ');
        }
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData: ApiResponse<ConfirmEmailResponse | string> = JSON.parse(responseText);
    console.log('✅ Confirm Email API Response:', responseData);

    if (responseData.isSuccess) {
      // Backend might return string message or object
      if (typeof responseData.result === 'string') {
        return {
          success: true,
          message: responseData.result
        };
      } else if (responseData.result) {
        return responseData.result;
      } else {
        return {
          success: true,
          message: 'Email đã được xác nhận thành công'
        };
      }
    } else {
      console.error('❌ Confirm email failed:', responseData.errorMessages);
      throw new Error(responseData.errorMessages?.join(', ') || 'Xác nhận email thất bại');
    }
  } catch (error) {
    console.error('❌ Confirm email error:', error);
    throw error;
  }
}

// ==================== LOGOUT ====================

/**
 * Logout API call - Send logout request to server
 */
export async function logoutApi(): Promise<void> {
  try {
    console.log('🔄 Calling Logout API...');
    
    const token = getAuthToken();
    if (!token) {
      console.warn('⚠️ No token found, skipping API logout');
      return;
    }

    // Get refresh token from localStorage
    const refreshToken = localStorage.getItem('smart-child-refresh-token');
    if (!refreshToken) {
      console.warn('⚠️ No refresh token found, proceeding with logout');
    }

    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        refreshToken: refreshToken || ''
      })
    });

    console.log('📡 Logout API status:', response.status);
    
    if (!response.ok) {
      console.warn('⚠️ Logout API failed, but proceeding with local logout');
    } else {
      console.log('✅ Logout API successful');
    }
  } catch (error) {
    console.error('❌ Logout API Error:', error);
    console.warn('⚠️ API logout failed, but proceeding with local logout');
  }
}

/**
 * Logout - Clear ALL local storage data
 */
export function logout(): void {
  // Xóa tất cả dữ liệu trong localStorage
  localStorage.clear();
  console.log('✅ Logged out successfully - All localStorage cleared');
}

/**
 * Complete logout - API call + clear storage + redirect
 */
export async function logoutComplete(): Promise<void> {
  try {
    // Try API logout first
    await logoutApi();
  } catch (error) {
    console.warn('API logout failed, continuing with local logout');
  } finally {
    // Always clear local storage regardless of API result
    logout();
    // Reload page để về trang login
    window.location.href = '/';
  }
}

/**
 * Logout và redirect về trang login (legacy - kept for compatibility)
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

    // If 404, profile doesn't exist yet - return empty profile
    if (response.status === 404) {
      console.log('⚠️ Profile not found (404) - returning empty profile for first-time setup');
      const currentUser = getCurrentUser();
      return {
        profileId: '',
        userId: currentUser?.id || '',
        fullName: '',
        phoneNumber: '',
        avatarUrl: null,
        gender: '',
        dateOfBirth: '',
        addressText: '',
        latitude: 0,
        longitude: 0,
        isVendor: false,
        shopName: null,
        businessLicenseNo: null,
        verificationStatus: null,
        ratingAvg: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

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

// ==================== FORGOT PASSWORD ====================

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

/**
 * Forgot Password API
 * POST /api/auth/forget-password
 */
export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  try {
    console.log('📧 Calling forgot password API...');
    console.log('🔗 Full URL:', `${API_BASE_URL}/api/auth/forget-password`);
    console.log('📤 Request data:', { email });

    const response = await fetch(`${API_BASE_URL}/api/auth/forget-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    console.log('📡 Response status:', response.status);

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
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData: ApiResponse<any> = JSON.parse(responseText);
    console.log('✅ Forgot Password API Response:', responseData);

    if (responseData.isSuccess) {
      const resultMessage = typeof responseData.result === 'string' 
        ? responseData.result 
        : responseData.result?.message || 'Email đặt lại mật khẩu đã được gửi đến địa chỉ email của bạn.';
      
      return {
        message: resultMessage,
      };
    } else {
      const errorMsg = responseData.errorMessages?.join(', ') || 'Không thể gửi email đặt lại mật khẩu.';
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('❌ Forgot Password API Error:', error);
    throw error;
  }
}

// ==================== RESET PASSWORD ====================

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

/**
 * Reset Password API
 * POST /api/auth/reset-password
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  try {
    console.log('🔑 Calling reset password API...');
    console.log('🔗 Full URL:', `${API_BASE_URL}/api/auth/reset-password`);
    console.log('📤 Request data:', { email: data.email, token: data.token });

    const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('📡 Response status:', response.status);

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
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData: ApiResponse<any> = JSON.parse(responseText);
    console.log('✅ Reset Password API Response:', responseData);

    if (responseData.isSuccess) {
      const resultMessage = typeof responseData.result === 'string' 
        ? responseData.result 
        : responseData.result?.message || 'Mật khẩu đã được đặt lại thành công.';
      
      return {
        message: resultMessage,
      };
    } else {
      const errorMsg = responseData.errorMessages?.join(', ') || 'Không thể đặt lại mật khẩu.';
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('❌ Reset Password API Error:', error);
    throw error;
  }
}

// Change Password (for logged-in users)
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export async function changePassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  try {
    console.log('🔄 Calling Change Password API...');
    console.log('📤 Request:', { oldPassword: '***', newPassword: '***' });
    
    const token = getAuthToken();
    if (!token) {
      throw new Error('Vui lòng đăng nhập để đổi mật khẩu');
    }

    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword
      })
    });

    console.log('📡 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📥 Response text:', responseText);
    
    const responseData: ApiResponse<any> = JSON.parse(responseText);

    if (responseData.isSuccess) {
      const resultMessage = typeof responseData.result === 'string'
        ? responseData.result
        : responseData.result?.message || 'Mật khẩu đã được thay đổi thành công!';
      
      console.log('✅ Change Password successful');
      return { message: resultMessage };
    } else {
      const errorMessage = responseData.errorMessages?.join(', ') || 'Đổi mật khẩu không thành công';
      console.error('❌ Change Password failed:', errorMessage);
      throw new Error(errorMessage);
    }
  } catch (error: any) {
    console.error('❌ Change Password API Error:', error);
    throw error;
  }
}

