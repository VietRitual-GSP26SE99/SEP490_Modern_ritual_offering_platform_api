import { getAuthToken, ApiResponse } from './auth';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' // Use proxy in development
  : 'https://vietritual.click'; // Direct URL in production

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  sender: 'User' | 'AI';
  content: string;
  sentAt: string;
}

export interface ChatSession {
  sessionId: string;
  userId: string;
  status: 'Open' | 'Closed';
  createdAt: string;
  closedAt: string | null;
  messages: ChatMessage[];
}

class AiChatService {
  /**
   * Tạo phiên chat AI mới
   * POST /api/ai-chat/sessions
   */
  async createSession(): Promise<string> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/sessions`, {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      },
      body: ''
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Vui lòng đăng nhập để sử dụng trợ lý AI.');
      }
      throw new Error(`Failed to create chat session: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Session Creation Response:', data);

    if (data.isSuccess && data.result) {
      let id = '';
      if (typeof data.result === 'string') {
        id = data.result;
      } else if (data.result && typeof data.result === 'object') {
        // Handle { result: { sessionId: "..." } } or { result: { id: "..." } }
        id = data.result.sessionId || data.result.id || '';
        if (!id) {
           console.warn('Could not find sessionId in result object, using stringified result', data.result);
           id = JSON.stringify(data.result);
        }
      }
      
      if (id && typeof id === 'string') {
        console.log('Extracted Session ID:', id);
        return id;
      }
    }
    throw new Error(data.errorMessages?.join(', ') || 'Failed to create chat session');
  }

  /**
   * Gửi tin nhắn và nhận tư vấn AI
   * POST /api/ai-chat/sessions/{sessionId}/messages
   */
  async sendMessage(sessionId: string, content: string): Promise<string> {
    const token = getAuthToken();
    console.log(`Sending AI message to session: ${sessionId}`);
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI Message API Raw Response:', data);

    if (data.isSuccess && data.result !== undefined) {
      const result = data.result;
      
      // If result is already a string, return it
      if (typeof result === 'string') return result;
      
      // If result is an object, try to find content fields
      if (result && typeof result === 'object') {
        // Handle common backend structures
        const extracted = 
          result.content || 
          result.message || 
          result.text || 
          result.result ||
          result.assistantMessage?.content ||
          result.assistantMessage;

        if (extracted !== undefined && typeof extracted === 'string') return extracted;
        if (extracted !== undefined && typeof extracted === 'object') return JSON.stringify(extracted);
        
        // Final fallback: stringify the whole result object if nothing extracted
        return String(extracted || JSON.stringify(result));
      }
      
      return String(result);
    }
    throw new Error(data.errorMessages?.join(', ') || 'Failed to get AI response');
  }

  /**
   * Lấy thông tin và lịch sử phiên chat
   * GET /api/ai-chat/sessions/{sessionId}
   */
  async getSession(sessionId: string): Promise<ChatSession> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get chat session: ${response.status}`);
    }

    const data: ApiResponse<ChatSession> = await response.json();
    if (data.isSuccess && data.result) {
      return data.result;
    }
    throw new Error(data.errorMessages?.join(', ') || 'Failed to get chat session history');
  }

  /**
   * Đóng phiên chat
   * POST /api/ai-chat/sessions/{sessionId}/close
   */
  async closeSession(sessionId: string): Promise<boolean> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/sessions/${sessionId}/close`, {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.warn(`Failed to close chat session: ${response.status}`);
      return false;
    }

    const data: ApiResponse<string> = await response.json();
    return data.isSuccess;
  }
}

export const aiChatService = new AiChatService();
