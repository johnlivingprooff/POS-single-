import { apiFetch } from '../lib/api-utils';

export interface StocktakingStatus {
  isActive: boolean;
  startedAt?: string;
  startedBy?: string;
  organization?: string;
}

export interface StocktakingProduct {
  id: string;
  name: string;
  sku: string;
  stockType: string;
  category: string;
  supplier: string;
  measurementType: string | null;
  measurementValue: number | null;
  availableQuantities: number;
  costPrice: number;
  totalValue: number;
}

export interface StocktakingReport {
  generatedAt: string;
  totalProducts: number;
  totalValue: number;
  products: StocktakingProduct[];
}

export const stocktakingAPI = {
  // Get current stocktaking status
  getStatus: async (token: string | null): Promise<StocktakingStatus> => {
    const response = await apiFetch('/stocktaking/status', token);
    if (!response.ok) {
      throw new Error('Failed to get stocktaking status');
    }
    return response.json();
  },

  // Start stocktaking
  start: async (token: string | null): Promise<{ message: string; startedAt: string }> => {
    const response = await apiFetch('/stocktaking/start', token, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Failed to start stocktaking');
    }
    return response.json();
  },

  // End stocktaking
  end: async (token: string | null): Promise<{ message: string; endedAt: string }> => {
    const response = await apiFetch('/stocktaking/end', token, {
      method: 'POST'
    });
    if (!response.ok) {
      throw new Error('Failed to end stocktaking');
    }
    return response.json();
  },

  // Get stocktaking report data
  getReport: async (token: string | null): Promise<StocktakingReport> => {
    const response = await apiFetch('/stocktaking/report', token);
    if (!response.ok) {
      throw new Error('Failed to get stocktaking report');
    }
    return response.json();
  }
};
