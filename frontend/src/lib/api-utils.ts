// API utility functions for consistent endpoint handling
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = import.meta.env.VITE_API_URL || '/api';
  // Remove leading slash from endpoint if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
};

// Helper function to create fetch options with auth header
export const createFetchOptions = (
  token: string | null,
  options: RequestInit = {}
): RequestInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }

  return {
    ...options,
    headers,
  };
};

// Convenience function for authenticated fetch calls
export const apiFetch = async (
  endpoint: string,
  token: string | null,
  options: RequestInit = {}
): Promise<Response> => {
  const url = getApiUrl(endpoint);
  const fetchOptions = createFetchOptions(token, options);
  return fetch(url, fetchOptions);
};
