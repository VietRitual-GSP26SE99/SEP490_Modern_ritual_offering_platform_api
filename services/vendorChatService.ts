import { getAuthToken } from './auth';

const API_BASE_URL = '/api';
const BASE_PATH = '/vendor-chat/sessions';

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  role: 'Customer' | 'Vendor';
  content: string;
  timestamp: string;
  isRead: boolean;
  extractedIntent?: string | null;
  extractedEntities?: string | null;
}

export interface ChatSession {
  sessionId: string;
  customerId: string;
  vendorId: string;
  sessionType: string;
  startedAt: string;
  lastActiveAt: string;
  resolvedIntent: string | null;
  convertedToOrder: boolean;
  closedAt: string | null;
  messages: ChatMessage[];
  counterPartyName?: string;
  counterPartyAvatar?: string;
  unreadCount?: number;
}

class VendorChatService {
  private async parseJsonOrThrow(response: Response): Promise<any> {
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = parsed?.errorMessages?.join(', ') || `Lỗi hệ thống (${response.status})`;
      throw new Error(message);
    }

    return parsed;
  }

  /**
   * Tạo phiên chat mới
   * POST /api/vendor-chat/sessions
   */
  async createSession(vendorId: string, packageId?: number): Promise<string> {
    const token = getAuthToken();
    const queryParams = new URLSearchParams();
    queryParams.append('vendorId', vendorId);
    if (packageId) queryParams.append('packageId', packageId.toString());

    const response = await fetch(`${API_BASE_URL}${BASE_PATH}?${queryParams.toString()}`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await this.parseJsonOrThrow(response);
    if ((data?.isSuccess || data?.isSucceeded) && data?.result?.sessionId) {
      return data.result.sessionId;
    }
    throw new Error('Không thể tạo phiên chat');
  }

  /**
   * Lấy danh sách phiên chat (Dành cho Customer/Vendor)
   * GET /api/vendor-chat/sessions/customer OR /api/vendor-chat/sessions/vendor
   */
  async getSessions(role: 'customer' | 'vendor' = 'customer'): Promise<ChatSession[]> {
    const token = getAuthToken();
    try {
      const rolePath = role === 'vendor' ? '/vendor' : '/customer';
      const response = await fetch(`${API_BASE_URL}${BASE_PATH}${rolePath}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return [];

      const data = await this.parseJsonOrThrow(response);
      return data?.result || [];
    } catch (error) {
      console.warn('Failed to fetch sessions:', error);
      return [];
    }
  }

  /**
   * Lấy chi tiết phiên chat và lịch sử tin nhắn
   * GET /api/vendor-chat/sessions/{sessionId}
   */
  async getSessionDetails(sessionId: string): Promise<ChatSession> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${sessionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await this.parseJsonOrThrow(response);
    return data?.result;
  }

  /**
   * Gửi tin nhắn
   * POST /api/vendor-chat/sessions/{sessionId}/messages
   */
  async sendMessage(sessionId: string, content: string): Promise<ChatMessage> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    const data = await this.parseJsonOrThrow(response);
    return data?.result;
  }

  /**
   * Lấy danh sách các vendor sẵn sàng cho một package cụ thể
   * GET /api/vendor-chat/vendors/available?packageId=...
   */
  async getAvailableVendors(packageId: number): Promise<any[]> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/vendor-chat/vendors/available?packageId=${packageId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await this.parseJsonOrThrow(response);
    return (data?.isSuccess || data?.isSucceeded) ? data.result : [];
  }

  /**
   * Đánh dấu tin nhắn đã đọc
   * POST /api/vendor-chat/sessions/{sessionId}/read
   */
  async markAsRead(sessionId: string): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${sessionId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  }

  /**
   * Đóng phiên chat
   * POST /api/vendor-chat/sessions/{sessionId}/close
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}${BASE_PATH}/${sessionId}/close`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.ok;
  }
}

export const vendorChatService = new VendorChatService();
