// Prefer Vite env variable, fallback to default '/api' relative path
export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export interface PackageVariant {
  variantId: string;
  packageId: string;
  tier: string;
  price: number;
  description: string;
  items: string[];
}

export interface ApiPackage {
  packageId: string;
  packageName: string;
  description: string;
  vendorProfileId: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  variants?: PackageVariant[];
}

export interface ApiResponse<T> {
  statusCode: string;
  isSucceeded: boolean;
  errorMessages: string[];
  result: T;
}

