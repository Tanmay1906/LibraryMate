import React, { useState } from 'react';
import Navbar from '../../components/Layout/Navbar';
import Card from '../../components/UI/Card';
import Input from '../../components/UI/Input';
import Button from '../../components/UI/Button';
import { apiCall, uploadFile } from '../../utils/api';
import { useAuth } from '../../utils/AuthContext';
import { SubscriptionPlan } from '../../types';
/**
 * Add Student Page Component
 * Allows library owners to register new students with subscription plans
 * Features comprehensive form validation and payment configuration
 */
const AddStudent: React.FC = () => {
  const { user } = useAuth();
  
  // Helper to format price in INR
  const formatINR = (amount: number) => `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  
  // Plan pricing data
  const planPrices = {
    MONTHLY: 2499,
    QUARTERLY: 6499,
    YEARLY: 24999,
    monthly: 2499,
    quarterly: 6499,
    yearly: 24999
  };

  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [loadingPlans, setLoadingPlans] = useState(true);
  
  // Load subscription plans from API
  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await apiCall('/subscription/plans');
        setPlans(data);
      } catch (error) {
        console.error('Failed to fetch plans:', error);
        // Fallback to default plans
        setPlans({
          MONTHLY: { id: 'monthly', name: 'MONTHLY', price: 2499, duration: '1 month', features: ['Basic library access', 'Book borrowing', 'Study space'] },
          QUARTERLY: { id: 'quarterly', name: 'QUARTERLY', price: 6499, duration: '3 months', features: ['Extended access', 'Priority booking', 'Digital resources'] },
          YEARLY: { id: 'yearly', name: 'YEARLY', price: 24999, duration: '12 months', features: ['Full access', 'Priority support', 'All premium features'] }
        });
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);
  // Generate registration number (will be assigned by backend)
  const getNextRegNumber = () => {
    return `REG-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    registrationNumber: getNextRegNumber(),
    subscriptionPlan: 'MONTHLY' as 'MONTHLY' | 'QUARTERLY' | 'YEARLY',
    paymentMethod: 'CASH' as 'CASH' | 'CARD' | 'UPI' | 'NET_BANKING' | 'emi',
    emiUpgrade: '' as '' | '3_month' | '6_month' | '12_month',
    startDate: new Date().toISOString().split('T')[0],
    aadharReference: '',
    aadharFile: null as File | null
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  /**
   * Handle input changes
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, files } = e.target as HTMLInputElement;
    if (type === 'file' && files) {
      setFormData(prev => ({ ...prev, [name]: files[0] }));
    } else {
      // Prevent manual change of registrationNumber
      if (name === 'registrationNumber') return;
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError('');
    setSuccess(false);
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Student name is required');
      return false;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    
    // Phone validation (Indian format)
    const phoneRegex = /^(\+91[-\s]?)?[0]?(91)?[789]\d{9}$/;
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
      setError('Please enter a valid Indian phone number');
      return false;
    }
    
    // Password validation
    if (!formData.password.trim()) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    
    // Password confirmation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    
    // Aadhar validation (if provided as text)
    if (formData.aadharReference && !/^\d{12}$/.test(formData.aadharReference)) {
      setError('Aadhar number must be exactly 12 digits');
      return false;
    }
    
    return true;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      let aadharReference = formData.aadharReference;
      
      // Upload Aadhar file if provided
      if (formData.aadharFile) {
        try {
          const uploadResponse = await uploadFile('/upload/aadhar', formData.aadharFile);
          aadharReference = uploadResponse.fileId || uploadResponse.url;
        } catch (uploadError) {
          console.error('Aadhar upload failed:', uploadError);
          setError('Failed to upload Aadhar document. Please try again.');
          return;
        }
      }

      // Prepare student data
      const studentData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
        registrationNumber: formData.registrationNumber,
        aadharReference: aadharReference,
        subscriptionPlan: formData.subscriptionPlan,
        libraryId: user?.libraryId, // Associate with current library owner's library
        role: 'student'
      };

      // Create student account
      const response = await apiCall('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(studentData),
      });

      if (response.success) {
        // Create initial payment record if needed
        if (formData.paymentMethod && formData.paymentMethod !== 'emi') {
          try {
            await apiCall('/payment', {
              method: 'POST',
              body: JSON.stringify({
                studentId: response.student?.id || response.data?.student?.id,
                amount: planPrices[formData.subscriptionPlan] || 0,
                plan: formData.subscriptionPlan,
                method: formData.paymentMethod,
                status: 'PENDING'
              }),
            });
          } catch (paymentError) {
            console.error('Payment record creation failed:', paymentError);
            // Don't block student creation if payment record fails
          }
        }

        // Reset form and show success
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          registrationNumber: getNextRegNumber(),
          subscriptionPlan: 'MONTHLY',
          paymentMethod: 'CASH',
          emiUpgrade: '',
          startDate: new Date().toISOString().split('T')[0],
          aadharReference: '',
          aadharFile: null
        });
        setSuccess(true);

        // Hide success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to add student');
      }
    } catch (err) {
      console.error('Student creation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to add student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedPlan = plans[formData.subscriptionPlan] || { 
    duration: formData.subscriptionPlan === 'MONTHLY' ? '1 month' : 
             formData.subscriptionPlan === 'QUARTERLY' ? '3 months' : '12 months',
    price: planPrices[formData.subscriptionPlan] || 0, 
    features: ['Basic library access', 'Book borrowing', 'Study space'] 
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-indigo-50 to-emerald-50 relative">
      <Navbar />
      {/* Glassmorphism background accent */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl absolute top-0 left-0" />
        <div className="w-72 h-72 bg-emerald-200/30 rounded-full blur-2xl absolute bottom-0 right-0" />
      </div>
      <div className="relative z-10 max-w-screen-xl mx-auto px-2 sm:px-6 lg:px-16 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight drop-shadow-lg">Add New Student</h1>
          <p className="text-lg text-slate-600 mt-3">Register a new student and <span className="font-semibold text-indigo-600">set up their subscription.</span></p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl shadow">
            Student added successfully! You can add another student or manage existing ones.
          </div>
        )}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow">
            {error}
          </div>
        )}

        {loadingPlans ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-lg text-slate-600">Loading subscription plans...</div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-0 lg:gap-0">
            {/* Sidebar - Subscription Summary & Features */}
            <aside className="lg:w-96 flex-shrink-0 space-y-12 lg:sticky lg:top-24 h-fit bg-transparent lg:border-r lg:border-slate-200 lg:pr-12 pb-12 mb-12 lg:mb-0">
            {/* Subscription Summary */}
            <Card className="bg-white/80 backdrop-blur-lg border border-slate-100 shadow-2xl p-8 rounded-2xl mb-10">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Subscription Summary</h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Plan</span>
                  <span className="font-semibold text-slate-900 capitalize">{formData.subscriptionPlan}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Duration</span>
                  <span className="font-semibold text-slate-900">{selectedPlan.duration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Price</span>
                  <span className="font-semibold text-slate-900">{formatINR(planPrices[formData.subscriptionPlan] || 0)}</span>
                </div>
                {formData.paymentMethod === 'emi' && formData.emiUpgrade && (
                  <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-600">EMI Option</span>
                      <span className="font-semibold text-indigo-700">{
                        formData.emiUpgrade === '3_month' ? '3 Months - No Interest'
                          : formData.emiUpgrade === '6_month' ? '6 Months - 5% Interest'
                            : formData.emiUpgrade === '12_month' ? '12 Months - 10% Interest'
                              : ''
                      }</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Installment Amount</span>
                      <span className="font-semibold text-indigo-700">
                        {(() => {
                          const base = planPrices[formData.subscriptionPlan] || 0;
                          let months = 1;
                          let interest = 0;
                          if (formData.emiUpgrade === '3_month') { months = 3; interest = 0; }
                          if (formData.emiUpgrade === '6_month') { months = 6; interest = 0.05; }
                          if (formData.emiUpgrade === '12_month') { months = 12; interest = 0.10; }
                          const total = base * (1 + interest);
                          return `${formatINR(total / months)} x ${months} months`;
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2 font-bold text-lg">
                      <span className="text-slate-900">Total Payable</span>
                      <span className="text-indigo-600">
                        {(() => {
                          const base = planPrices[formData.subscriptionPlan] || 0;
                          let interest = 0;
                          if (formData.emiUpgrade === '3_month') interest = 0;
                          if (formData.emiUpgrade === '6_month') interest = 0.05;
                          if (formData.emiUpgrade === '12_month') interest = 0.10;
                          return formatINR(base * (1 + interest));
                        })()}
                      </span>
                    </div>
                  </div>
                )}
                <div className="border-t pt-5">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span className="text-slate-900">Total</span>
                    <span className="text-indigo-600">{formatINR(planPrices[formData.subscriptionPlan] || 0)}</span>
                  </div>
                </div>
              </div>
            </Card>
            {/* Plan Features */}
            <Card className="bg-white/80 backdrop-blur-lg border border-slate-100 shadow-2xl p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Plan Features</h3>
              <ul className="space-y-4">
                {selectedPlan.features.map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-base text-slate-600">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3" />
                    {feature}
                  </li>
                ))}
              </ul>
            </Card>
          </aside>
          {/* Main Form */}
          <main className="flex-1 flex flex-col items-center justify-center py-2 px-0 lg:px-16">
            <div className="w-full max-w-4xl space-y-12">
              {/* Student Information */}
              <Card className="bg-white/80 backdrop-blur-lg border border-slate-100 shadow-2xl p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-900 mb-6">Student Information</h3>
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Input
                      name="name"
                      label="Full Name"
                      placeholder="Enter student's full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="bg-white/60 border border-indigo-200 rounded-lg"
                    />
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Aadhar Card (PDF or Image)</label>
                      <input
                        type="file"
                        name="aadharFile"
                        accept=".pdf,image/*"
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-indigo-200 rounded-xl text-slate-900 bg-white/80 shadow"
                      />
                      {formData.aadharFile && (
                        <span className="text-xs text-emerald-700 mt-1 block">Selected: {formData.aadharFile.name}</span>
                      )}
                    </div>
                    <Input
                      name="registrationNumber"
                      label="Registration Number"
                      value={formData.registrationNumber}
                      readOnly
                      className="bg-white/60 border border-indigo-200 rounded-lg cursor-not-allowed"
                    />
                    <Input
                      name="email"
                      type="email"
                      label="Email Address"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="bg-white/60 border border-indigo-200 rounded-lg"
                    />
                    <Input
                      name="phone"
                      type="tel"
                      label="Phone Number"
                      placeholder="Enter phone number"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="bg-white/60 border border-indigo-200 rounded-lg"
                    />
                    <Input
                      name="password"
                      type="password"
                      label="Password"
                      placeholder="Enter password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="bg-white/60 border border-indigo-200 rounded-lg"
                    />
                    <Input
                      name="confirmPassword"
                      type="password"
                      label="Confirm Password"
                      placeholder="Confirm password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="bg-white/60 border border-indigo-200 rounded-lg"
                    />
                  </div>
                  {/* Subscription Setup */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Subscription Setup</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Subscription Plan
                        </label>
                        <select
                          name="subscriptionPlan"
                          value={formData.subscriptionPlan}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-indigo-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 shadow"
                        >
                          <option value="MONTHLY">Monthly - ₹2,499.00</option>
                          <option value="QUARTERLY">Quarterly - ₹6,499.00 (10% off)</option>
                          <option value="YEARLY">Yearly - ₹24,999.00 (20% off)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Payment Method
                        </label>
                        <select
                          name="paymentMethod"
                          value={formData.paymentMethod}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-indigo-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 bg-white/80 shadow"
                        >
                          <option value="CASH">Cash Payment</option>
                          <option value="CARD">Card Payment</option>
                          <option value="UPI">UPI Payment</option>
                          <option value="NET_BANKING">Net Banking</option>
                          <option value="emi">EMI (Installments)</option>
                        </select>
                        {formData.paymentMethod === 'emi' && (
                          <div className="mt-4">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">EMI Upgrade Options</label>
                            <select
                              name="emiUpgrade"
                              value={formData.emiUpgrade || ''}
                              onChange={handleChange}
                              className="w-full px-4 py-3 border border-indigo-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white/80 shadow"
                            >
                              <option value="">Select EMI Option</option>
                              <option value="3_month">3 Months - No Interest</option>
                              <option value="6_month">6 Months - 5% Interest</option>
                              <option value="12_month">12 Months - 10% Interest</option>
                            </select>
                          </div>
                        )}
                      </div>
                      <Input
                        name="startDate"
                        type="date"
                        label="Start Date"
                        value={formData.startDate}
                        onChange={handleChange}
                        required
                        className="bg-white/60 border border-indigo-200 rounded-lg"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={loading || loadingPlans}
                    className="w-full md:w-auto mt-4 shadow-lg hover:scale-[1.03] transition-transform"
                  >
                    {loading ? 'Adding Student...' : 'Add Student'}
                  </Button>
                </form>
              </Card>
            </div>
          </main>
        </div>
        )}
      </div>
    </div>
  );
};

export default AddStudent;