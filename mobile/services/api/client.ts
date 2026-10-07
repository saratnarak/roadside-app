const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api/v1'
).replace(/\/$/, '');

let authTokenGetter: (() => Promise<string | null>) | null = null;

export const setAuthTokenGetter = (getter: () => Promise<string | null>) => {
  authTokenGetter = getter;
};

export const apiClient = {
  get: async (endpoint: string, options?: { token?: string | null }) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = options?.token ?? (authTokenGetter ? await authTokenGetter() : null);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `API Error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Client GET Error:', error);
      throw error;
    }
  },

  post: async (endpoint: string, body: any, options?: { token?: string | null }) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = options?.token ?? (authTokenGetter ? await authTokenGetter() : null);
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || `API Error: ${response.status}`);
      }
      return response.json();
    } catch (error) {
      console.error('API Client POST Error:', error);
      throw error;
    }
  },
};
