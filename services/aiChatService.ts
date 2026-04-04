import { getAuthToken, ApiResponse } from './auth';

const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? '' // Use proxy in development
  : 'https://vietritual.click'; // Direct URL in production

export interface ChatMessage {
  messageId: string;
  sessionId: string;
  role: 'User' | 'AI' | string;
  content: string;
  timestamp: string;
  isRead?: boolean;
  extractedIntent?: string | null;
  extractedEntities?: string | null;
}

export interface ChatSession {
  sessionId: string;
  customerId: string;
  vendorId: string | null;
  sessionType: 'AI' | string;
  startedAt: string;
  lastActiveAt: string;
  resolvedIntent: string | null;
  convertedToOrder: boolean;
  closedAt: string | null;
  messages: ChatMessage[];
}

export interface SuggestedPackage {
  packageId: number;
  packageName: string;
  description: string;
  minVariantPrice: number;
}

export interface SendMessageResult {
  sessionId: string;
  assistantText: string;
  assistantMessage: ChatMessage | null;
  resolvedIntent: string | null;
  extractedEntities: string | null;
  suggestedPackages: SuggestedPackage[];
}

class AiChatService {
  private normalizeAssistantText(raw: unknown): string {
    if (typeof raw !== 'string') return '';

    let text = raw.trim();
    if (!text) return '';

    // Strip markdown code fence if backend wraps answer in ```json ... ```.
    const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    if (fenced?.[1]) {
      text = fenced[1].trim();
    }

    // Some responses may start with a loose prefix like "json {...}".
    if (/^json\s*\{/i.test(text)) {
      text = text.replace(/^json\s*/i, '').trim();
    }

    // Extract final human-readable text when AI returns JSON payload.
    if ((text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
      try {
        const parsed = JSON.parse(text) as any;
        if (typeof parsed === 'string') return parsed.trim();
        if (parsed && typeof parsed === 'object') {
          const candidate = parsed.answer || parsed.content || parsed.message || parsed.text;
          if (typeof candidate === 'string' && candidate.trim()) {
            return candidate.trim();
          }
        }
      } catch {
        // Keep original text if parsing fails.
      }
    }

    return text;
  }

  private async parseJsonOrThrow(response: Response): Promise<any> {
    const text = await response.text();
    const parsed = text ? JSON.parse(text) : null;

    if (!response.ok) {
      const message = parsed?.errorMessages?.join(', ') || `Request failed with status ${response.status}`;
      if (response.status === 401) {
        throw new Error('Vui lòng đăng nhập để sử dụng trợ lý AI.');
      }
      throw new Error(message);
    }

    return parsed;
  }

  /**
   * Tạo phiên chat AI mới
   * POST /api/ai-chat/sessions
   */
  async createSession(): Promise<ChatSession> {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/sessions`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: ''
    });

    const data = await this.parseJsonOrThrow(response);
    console.log('AI Session Creation Response:', data);

    if (data?.isSuccess && data?.result?.sessionId) {
      return data.result as ChatSession;
    }

    throw new Error(data.errorMessages?.join(', ') || 'Failed to create chat session');
  }

  /**
   * Gửi tin nhắn và nhận tư vấn AI
   * POST /api/ai-chat/sessions/{sessionId}/messages
   */
  async sendMessage(sessionId: string, content: string): Promise<SendMessageResult> {
    const token = getAuthToken();
    console.log(`Sending AI message to session: ${sessionId}`);
    const response = await fetch(`${API_BASE_URL}/api/ai-chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    });

    const data = await this.parseJsonOrThrow(response);
    console.log('AI Message API Raw Response:', data);

    if (data?.isSuccess && data?.result) {
      const assistantMessage = (data.result.assistantMessage || null) as ChatMessage | null;
      const normalizedAssistantText = this.normalizeAssistantText(assistantMessage?.content || '');
      return {
        sessionId: data.result.sessionId || sessionId,
        assistantText: normalizedAssistantText,
        assistantMessage,
        resolvedIntent: data.result.resolvedIntent || null,
        extractedEntities: data.result.extractedEntities || null,
        suggestedPackages: Array.isArray(data.result.suggestedPackages) ? data.result.suggestedPackages as SuggestedPackage[] : [],
      };
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
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await this.parseJsonOrThrow(response) as ApiResponse<ChatSession>;
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
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    try {
      const data = await this.parseJsonOrThrow(response) as ApiResponse<string>;
      return data.isSuccess;
    } catch (error) {
      console.warn('Failed to close chat session:', error);
      return false;
    }
  }
}

export const aiChatService = new AiChatService();
