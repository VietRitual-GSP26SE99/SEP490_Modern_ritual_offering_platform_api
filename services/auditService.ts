import { getAuthToken } from './auth';

export interface AuditLogFilter {
  action?: string;
  entityType?: string;
  performedBy?: string;
  from?: string;
  to?: string;
}

export interface AuditLog {
  auditId: string;
  action: string;
  entityType: string;
  entityId: string;
  performedBy: string;
  performedRole: string;
  performedByName?: string;
  description: string;
  timestamp: string;
  oldValue: string | null;
  newValue: string | null;
  ipAddress?: string;
}

function unwrapResultArray(payload: any): any[] {
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.result)) return payload.result;
    if (Array.isArray(payload)) return payload;
  }
  return [];
}

export const auditService = {
  getAuditLogs: async (filter: AuditLogFilter = {}): Promise<AuditLog[]> => {
    const token = getAuthToken();
    const params = new URLSearchParams();
    if (filter.action) params.append('action', filter.action);
    if (filter.entityType) params.append('entityType', filter.entityType);
    if (filter.performedBy) params.append('performedBy', filter.performedBy);
    if (filter.from) params.append('from', filter.from);
    if (filter.to) params.append('to', filter.to);

    const response = await fetch(`/api/audit-logs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Không thể tải nhật ký hệ thống');
    const payload = await response.json();
    return unwrapResultArray(payload);
  },

  getAuditLogById: async (id: string): Promise<AuditLog> => {
    const token = getAuthToken();
    const response = await fetch(`/api/audit-logs/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Không thể tải chi tiết nhật ký');
    const payload = await response.json();
    return payload.result || payload;
  }
};
