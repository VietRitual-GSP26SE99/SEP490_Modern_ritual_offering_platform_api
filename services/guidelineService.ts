import { API_BASE_URL } from './api';
import { getAuthToken } from './auth';

export interface CulturalGuideline {
  guidelineId: number;
  categoryId: number;
  categoryName: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
}

export const guidelineService = {
  getGuidelines: async (categoryId?: number): Promise<CulturalGuideline[]> => {
    const url = new URL(`${API_BASE_URL}/cultural-guidelines`, window.location.origin);
    if (categoryId) url.searchParams.append('categoryId', categoryId.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cultural guidelines');
    }

    const data: any = await response.json();
    return data.result || [];
  },

  getGuidelineById: async (id: number): Promise<CulturalGuideline> => {
    const response = await fetch(`${API_BASE_URL}/cultural-guidelines/${id}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch guideline detail');
    }

    const data: any = await response.json();
    return data.result;
  },

  getAllGuidelinesForStaff: async (categoryId?: number): Promise<CulturalGuideline[]> => {
    const token = getAuthToken();
    const url = new URL(`${API_BASE_URL}/cultural-guidelines/all`, window.location.origin);
    if (categoryId) url.searchParams.append('categoryId', categoryId.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch guidelines: ${response.status}`);
    }

    const data: any = await response.json();
    return data.result || [];
  },

  createGuideline: async (payload: { categoryId: number; title: string; description: string }): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/cultural-guidelines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ Create guideline error detail:', errorData);
      
      const errorMessage = errorData?.errorMessages?.[0] || errorData?.message || 'Failed to create guideline';
      throw new Error(errorMessage);
    }
  },

  updateGuideline: async (id: number, payload: { categoryId: number; title: string; description: string }): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/cultural-guidelines/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.errorMessages?.[0] || errorData?.message || 'Failed to update guideline');
    }
  },

  deleteGuideline: async (id: number): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/cultural-guidelines/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.errorMessages?.[0] || errorData?.message || 'Failed to delete guideline');
    }
  },

  reactivateGuideline: async (id: number): Promise<void> => {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/cultural-guidelines/${id}/reactivate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.errorMessages?.[0] || errorData?.message || 'Failed to reactivate guideline');
    }
  }
};
