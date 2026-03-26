
import { UserRole } from "../types";

export interface DiscountPolicy {
  policyId: number;
  vendorId: string;
  minQuantity: number;
  discountType: "Percentage" | "FixedAmount";
  discountTypeName: string;
  discountValue: number;
  description: string;
  isActive: boolean;
}

export interface CreateDiscountPolicyRequest {
  minQuantity: number;
  discountType: "Percentage" | "FixedAmount";
  discountValue: number;
  description: string;
}

export interface UpdateDiscountPolicyRequest {
  minQuantity?: number;
  discountType?: "Percentage" | "FixedAmount";
  discountValue?: number;
  description?: string;
  isActive?: boolean;
}

class DiscountPolicyService {
  private getBaseUrl() {
    return '/api/discount-policies';
  }

  private getHeaders() {
    const token = localStorage.getItem('smart-child-token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async getDiscountPolicies(): Promise<DiscountPolicy[]> {
    try {
      const response = await fetch(this.getBaseUrl(), {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) throw new Error('Failed to fetch discount policies');
      const data = await response.json();
      return data.isSuccess ? data.result : [];
    } catch (error) {
      console.error('Error fetching discount policies:', error);
      return [];
    }
  }

  async createDiscountPolicy(request: CreateDiscountPolicyRequest): Promise<boolean> {
    try {
      const response = await fetch(this.getBaseUrl(), {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      });
      return response.ok;
    } catch (error) {
      console.error('Error creating discount policy:', error);
      return false;
    }
  }

  async updateDiscountPolicy(id: number, request: UpdateDiscountPolicyRequest): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/${id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(request)
      });
      return response.ok;
    } catch (error) {
      console.error('Error updating discount policy:', error);
      return false;
    }
  }

  async deleteDiscountPolicy(id: number): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      return response.ok;
    } catch (error) {
      console.error('Error deleting discount policy:', error);
      return false;
    }
  }

  async getDiscountPolicyById(id: number): Promise<DiscountPolicy | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.isSuccess ? data.result : null;
    } catch (error) {
      console.error('Error fetching discount policy detail:', error);
      return null;
    }
  }
}

export const discountPolicyService = new DiscountPolicyService();
