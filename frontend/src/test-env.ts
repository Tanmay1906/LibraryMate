// Test script to verify environment variables and API connectivity
console.log('Testing environment variables...');
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('VITE_UPLOAD_URL:', import.meta.env.VITE_UPLOAD_URL);

// Test API connectivity 
const testAPI = async () => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
    console.log('Testing API connectivity to:', API_BASE_URL);
    
    const response = await fetch(`${API_BASE_URL}/subscription/plans`);
    console.log('API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Response:', data);
      console.log('✅ API connectivity test PASSED');
    } else {
      console.log('❌ API responded with error status:', response.status);
    }
  } catch (error) {
    console.log('❌ API connectivity test FAILED:', error instanceof Error ? error.message : String(error));
  }
};

// Run tests
testAPI();

export default {};
