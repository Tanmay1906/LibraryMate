import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User, SignupRequest } from '../types';

/**
 * Authentication context interface
 */
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  signup: (userData: SignupRequest) => Promise<{ success: boolean; error?: string }>;
  verifyOTP: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  pendingUser: SignupRequest | null;
  setPendingUser: (user: SignupRequest | null) => void;
}

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

// API helper function
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Manages user authentication state and methods throughout the application
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Check for existing token on app load
  React.useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token && storedUser) {
        try {
          // Verify token is still valid
          await apiCall('/auth/verify');
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
        } catch {
          // Token invalid, clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Real login function - authenticates with backend API
   */
  const login = async (email: string, password: string, role: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, role }),
      });

      if (response.token && response.user) {
        // Store token and user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setUser(response.user);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error: any) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real signup function - registers user and sends OTP
   */
  const signup = async (userData: SignupRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const response = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.token && response.user) {
        // Direct login after successful signup
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        
        setUser(response.user);
        setIsAuthenticated(true);
        setPendingUser(null); // Clear any pending user data
        
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Signup failed' };
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      console.error('Signup data sent:', userData);
      return { 
        success: false, 
        error: error.message || error.error || 'Signup failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Real OTP verification function
   */
  const verifyOTP = async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      
      const response = await apiCall('/auth/verifyOTP', {
        method: 'POST',
        body: JSON.stringify({ phone, code: otp }),
      });

      if (response.success) {
        if (pendingUser) {
          // Complete registration process
          const completeSignup = await apiCall('/auth/completeSignup', {
            method: 'POST',
            body: JSON.stringify(pendingUser),
          });

          if (completeSignup.token && completeSignup.user) {
            localStorage.setItem('token', completeSignup.token);
            localStorage.setItem('user', JSON.stringify(completeSignup.user));
            
            setUser(completeSignup.user);
            setIsAuthenticated(true);
            setPendingUser(null);
            
            return { success: true };
          }
        }
        return { success: true };
      } else {
        return { success: false, error: response.message || 'Invalid OTP' };
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      return { 
        success: false, 
        error: error.message || 'OTP verification failed. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout function - clears user state and calls backend
   */
  const logout = async () => {
    try {
      // Call backend logout endpoint if needed
      await apiCall('/auth/logout', { method: 'POST' });
    } catch (error) {
      // Continue with logout even if backend call fails
      console.error('Logout error:', error);
    }
    
    // Clear local state
    setUser(null);
    setIsAuthenticated(false);
    setPendingUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    signup,
    verifyOTP,
    logout,
    pendingUser,
    setPendingUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use authentication context
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};