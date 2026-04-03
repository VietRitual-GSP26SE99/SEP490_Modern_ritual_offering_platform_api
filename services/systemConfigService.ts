import { ApiResponse } from '../types';

const API_BASE_URL = '/api';

export interface SystemConfig {
  configKey: string;
  configValue: string;
  dataType: string;
  description: string;
  group: string;
}

export interface CreateSystemConfigRequest {
  configKey: string;
  configValue: string;
  dataType: string;
  description: string;
  group: string;
}

export interface UpdateSystemConfigRequest {
  configValue: string;
  description: string;
}

class SystemConfigService {
  private getHeaders() {
    const token = localStorage.getItem('smart-child-token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  async getAllConfigs(group?: string): Promise<ApiResponse<SystemConfig[]>> {
    try {
      const normalizedGroup = typeof group === 'string' ? group.trim() : undefined;

      // Backend currently errors when `group` is missing/empty (null predicate / validation).
      // To support "Tất cả các nhóm" on FE, we fetch known groups and merge results.
      if (!normalizedGroup) {
        const groups = ['Financial', 'Operational', 'Policy', 'Contact'];
        const responses = await Promise.all(groups.map((g) => this.getAllConfigs(g)));

        const successResponses = responses.filter((r) => r?.isSuccess && Array.isArray(r.result));
        const merged: SystemConfig[] = [];
        const seenKeys = new Set<string>();

        for (const res of successResponses) {
          for (const cfg of res.result) {
            const key = String(cfg?.configKey || '').trim();
            if (!key || seenKeys.has(key)) continue;
            seenKeys.add(key);
            merged.push(cfg);
          }
        }

        const errorMessages = responses
          .filter((r) => !r?.isSuccess)
          .flatMap((r) => r?.errorMessages || [])
          .filter(Boolean);

        if (merged.length > 0) {
          return {
            isSuccess: true,
            statusCode: '200',
            errorMessages: errorMessages.length ? errorMessages : undefined,
            result: merged,
          } as ApiResponse<SystemConfig[]>;
        }

        return {
          isSuccess: false,
          statusCode: '400',
          errorMessages: errorMessages.length ? errorMessages : ['Không thể tải cấu hình hệ thống'],
          result: null as any,
        };
      }

      const params = new URLSearchParams({
        PageNumber: '1',
        PageSize: '100'
      });
      params.append('group', normalizedGroup);
      const url = `${API_BASE_URL}/system-configs?${params.toString()}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get system configs:', error);
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi kết nối hệ thống'], result: null as any };
    }
  }

  async createConfig(request: CreateSystemConfigRequest): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/system-configs`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to create system config:', error);
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi kết nối hệ thống'], result: null };
    }
  }

  async getConfigByKey(key: string): Promise<ApiResponse<SystemConfig>> {
    try {
      const response = await fetch(`${API_BASE_URL}/system-configs/${encodeURIComponent(key)}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get system config by key:', error);
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi kết nối hệ thống'], result: null as any };
    }
  }

  async updateConfig(key: string, request: UpdateSystemConfigRequest): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/system-configs/${encodeURIComponent(key)}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(request),
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to update system config:', error);
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi kết nối hệ thống'], result: null };
    }
  }

  async deleteConfig(key: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/system-configs/${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return await response.json();
    } catch (error) {
      console.error('❌ Failed to delete system config:', error);
      return { isSuccess: false, statusCode: '500', errorMessages: ['Lỗi kết nối hệ thống'], result: null };
    }
  }
}

export const systemConfigService = new SystemConfigService();
