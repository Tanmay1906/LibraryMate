// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// API helper function
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// File upload helper
export const uploadFile = async (endpoint: string, file: File, additionalData?: Record<string, string>) => {
  const token = localStorage.getItem('token');
  
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });
  }

  const headers: HeadersInit = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};
