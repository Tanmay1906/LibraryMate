/**
 * Type definitions for LibraryMate application
 */

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'owner' | 'student';
  libraryId?: string;
  registrationNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Student specific type
export interface Student extends User {
  role: 'student';
  registrationNumber: string;
  libraryId: string;
  subscriptionPlan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  paymentStatus: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  aadharReference?: string;
}

// Library owner specific type
export interface LibraryOwner extends User {
  role: 'owner' | 'admin';
  libraryId: string;
}

// Library information
export interface Library {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  ownerId: string;
  monthlyRevenue?: number;
  totalBooks?: number;
  operatingHours?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Book related types
export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  genre: string;
  category?: string; // For backward compatibility
  description?: string;
  libraryId: string;
  available: boolean;
  totalCopies: number;
  availableCopies: number;
  imageUrl?: string;
  readingProgress?: number; // For reading tracking
  createdAt: string;
  updatedAt: string;
}

// Payment related types
export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  plan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  method: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  dueDate: string;
  paidDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Subscription plan types
export interface SubscriptionPlan {
  id: string;
  name: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  duration: string;
  price: number;
  features: string[];
  description?: string;
}

// Borrow history types
export interface BorrowHistory {
  id: string;
  studentId: string;
  bookId: string;
  borrowDate: string;
  returnDate?: string;
  dueDate: string;
  status: 'BORROWED' | 'RETURNED' | 'OVERDUE';
  fineAmount?: number;
  student?: Student;
  book?: Book;
}

// Notification types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  recipientId: string;
  recipientType: 'STUDENT' | 'OWNER' | 'ALL';
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
  role: 'admin' | 'owner' | 'student';
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface SignupRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'student';
  registrationNumber?: string;
  aadharReference?: string;
  libraryId?: string;
}

export interface OTPRequest {
  phone: string;
  code: string;
}

// Form types
export interface StudentFormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  registrationNumber: string;
  subscriptionPlan: 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'emi';
  emiUpgrade?: '' | '3_month' | '6_month' | '12_month';
  startDate: string;
  aadharReference: string;
  aadharFile: File | null;
}

// Dashboard statistics
export interface DashboardStats {
  totalStudents: number;
  activeSubscriptions: number;
  pendingPayments: number;
  monthlyRevenue: number;
  totalBooks?: number;
  borrowedBooks?: number;
  overdueBooks?: number;
}

// Activity types
export interface Activity {
  id: string;
  type: 'STUDENT_REGISTERED' | 'PAYMENT_RECEIVED' | 'BOOK_BORROWED' | 'BOOK_RETURNED' | 'OVERDUE_REMINDER';
  description: string;
  entityId: string;
  entityType: 'STUDENT' | 'BOOK' | 'PAYMENT';
  timestamp: string;
  metadata?: Record<string, any>;
}

// Filter and pagination types
export interface FilterOptions {
  search?: string;
  status?: string;
  plan?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// File upload types
export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  url?: string;
  fileName?: string;
  message?: string;
}
