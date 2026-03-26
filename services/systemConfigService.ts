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
      const url = group 
        ? `${API_BASE_URL}/system-configs?group=${encodeURIComponent(group)}`
        : `${API_BASE_URL}/system-configs`;
      
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
