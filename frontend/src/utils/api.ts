const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('lendflow_token');
  }
  return null;
};

export const setAuthToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lendflow_token', token);
  }
};

export const clearAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('lendflow_token');
    localStorage.removeItem('lendflow_user');
  }
};

export const getSavedUser = (): any | null => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('lendflow_user');
    try {
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }
  return null;
};

export const saveUser = (user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('lendflow_user', JSON.stringify(user));
  }
};

// Generic Fetch Request Helper
async function request(method: string, endpoint: string, body?: any, isMultipart = false) {
  const token = getAuthToken();
  const headers: HeadersInit = {};

  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (body) {
    config.body = isMultipart ? body : JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.errors?.join(', ') || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: (endpoint: string) => request('GET', endpoint),
  post: (endpoint: string, body?: any) => request('POST', endpoint, body),
  postMultipart: (endpoint: string, body: FormData) => request('POST', endpoint, body, true),
  put: (endpoint: string, body?: any) => request('PUT', endpoint, body),
  delete: (endpoint: string) => request('DELETE', endpoint),
  apiBaseUrl: API_BASE_URL.replace('/api', ''), // base URL for static file serving
};
