#!/usr/bin/env node
/**
 * 🔐 LibraryMate Authentication Flow Test
 * Tests the complete authentication system end-to-end
 */

const axios = require('axios');
const colors = require('colors');

// Test configuration
const BASE_URL = 'http://localhost:4001';
const TEST_TIMEOUT = 30000;

// Test data
const testAdmin = {
  name: 'Test Admin',
  email: 'testadmin@librarymate.com',
  phone: '+919876543211',
  password: 'TestAdmin@123',
  role: 'admin'
};

const testStudent = {
  name: 'Test Student',
  email: 'teststudent@librarymate.com',
  phone: '+919876543212',
  password: 'TestStudent@123',
  role: 'student',
  registrationNumber: 'STU001',
  aadharReference: 'ABCD1234',
  libraryId: 1 // Assuming library with ID 1 exists
};

class AuthTester {
  constructor() {
    this.tokens = {};
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    switch (type) {
      case 'success':
        console.log(`[${timestamp}] ✅ ${message}`.green);
        break;
      case 'error':
        console.log(`[${timestamp}] ❌ ${message}`.red);
        break;
      case 'info':
        console.log(`[${timestamp}] ℹ️  ${message}`.blue);
        break;
      case 'warning':
        console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
        break;
      default:
        console.log(`[${timestamp}] ${message}`);
    }
  }

  async test(description, testFn) {
    this.results.total++;
    this.log(`Testing: ${description}`, 'info');
    
    try {
      await testFn();
      this.results.passed++;
      this.results.tests.push({ description, status: 'PASSED' });
      this.log(`PASSED: ${description}`, 'success');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ description, status: 'FAILED', error: error.message });
      this.log(`FAILED: ${description} - ${error.message}`, 'error');
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        timeout: TEST_TIMEOUT,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response;
    } catch (error) {
      if (error.response) {
        throw new Error(`HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`);
      } else {
        throw new Error(`Network Error: ${error.message}`);
      }
    }
  }

  async testServerHealth() {
    await this.test('Server Health Check', async () => {
      const response = await this.makeRequest('GET', '/health');
      if (response.status !== 200) {
        throw new Error('Health check failed');
      }
      if (!response.data.status || response.data.status !== 'success') {
        throw new Error('Health check returned invalid status');
      }
    });
  }

  async testAdminSignup() {
    await this.test('Admin Signup', async () => {
      const response = await this.makeRequest('POST', '/api/auth/signup', testAdmin);
      if (response.status !== 200 && response.status !== 201) {
        throw new Error('Admin signup failed');
      }
      if (!response.data.success) {
        throw new Error('Admin signup response indicates failure');
      }
    });
  }

  async testAdminLogin() {
    await this.test('Admin Login', async () => {
      const loginData = {
        email: testAdmin.email,
        password: testAdmin.password,
        role: testAdmin.role
      };
      
      const response = await this.makeRequest('POST', '/api/auth/login', loginData);
      if (response.status !== 200) {
        throw new Error('Admin login failed');
      }
      if (!response.data.success || !response.data.token) {
        throw new Error('Admin login did not return token');
      }
      
      this.tokens.admin = response.data.token;
      this.log('Admin token obtained', 'info');
    });
  }

  async testTokenVerification() {
    await this.test('Token Verification', async () => {
      if (!this.tokens.admin) {
        throw new Error('No admin token available for verification');
      }

      const response = await this.makeRequest('GET', '/api/auth/verify', null, {
        'Authorization': `Bearer ${this.tokens.admin}`
      });
      
      if (response.status !== 200) {
        throw new Error('Token verification failed');
      }
      if (!response.data.success) {
        throw new Error('Token verification response indicates failure');
      }
    });
  }

  async testProtectedRoute() {
    await this.test('Protected Route Access', async () => {
      if (!this.tokens.admin) {
        throw new Error('No admin token available for protected route test');
      }

      const response = await this.makeRequest('GET', '/api/admin/profile', null, {
        'Authorization': `Bearer ${this.tokens.admin}`
      });
      
      if (response.status !== 200) {
        throw new Error('Protected route access failed');
      }
    });
  }

  async testUnauthorizedAccess() {
    await this.test('Unauthorized Access Rejection', async () => {
      try {
        await this.makeRequest('GET', '/api/admin/profile');
        throw new Error('Unauthorized access should have been rejected');
      } catch (error) {
        if (!error.message.includes('401') && !error.message.includes('403')) {
          throw new Error('Expected 401/403 error for unauthorized access');
        }
        // This is expected behavior
      }
    });
  }

  async testInvalidCredentials() {
    await this.test('Invalid Credentials Rejection', async () => {
      const invalidLogin = {
        email: testAdmin.email,
        password: 'wrongpassword',
        role: testAdmin.role
      };
      
      try {
        await this.makeRequest('POST', '/api/auth/login', invalidLogin);
        throw new Error('Invalid credentials should have been rejected');
      } catch (error) {
        if (!error.message.includes('401') && !error.message.includes('400')) {
          throw new Error('Expected 401/400 error for invalid credentials');
        }
        // This is expected behavior
      }
    });
  }

  async testResponseFormats() {
    await this.test('Response Format Consistency', async () => {
      const loginData = {
        email: testAdmin.email,
        password: testAdmin.password,
        role: testAdmin.role
      };
      
      const response = await this.makeRequest('POST', '/api/auth/login', loginData);
      
      if (!response.data.hasOwnProperty('success')) {
        throw new Error('Response missing success property');
      }
      if (!response.data.hasOwnProperty('message')) {
        throw new Error('Response missing message property');
      }
      if (response.data.success && !response.data.token) {
        throw new Error('Successful login response missing token');
      }
    });
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🔐 AUTHENTICATION TEST RESULTS'.bold);
    console.log('='.repeat(60));
    
    console.log(`📊 Total Tests: ${this.results.total}`);
    console.log(`✅ Passed: ${this.results.passed}`.green);
    console.log(`❌ Failed: ${this.results.failed}`.red);
    console.log(`📈 Success Rate: ${((this.results.passed / this.results.total) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:'.red);
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.description}: ${test.error}`.red);
        });
    }
    
    console.log('\n✅ Passed Tests:'.green);
    this.results.tests
      .filter(test => test.status === 'PASSED')
      .forEach(test => {
        console.log(`  • ${test.description}`.green);
      });
    
    console.log('\n' + '='.repeat(60));
    
    if (this.results.passed === this.results.total) {
      console.log('🎉 ALL AUTHENTICATION TESTS PASSED!'.green.bold);
      return true;
    } else {
      console.log('⚠️  Some tests failed. Please review and fix issues.'.yellow.bold);
      return false;
    }
  }

  async runAllTests() {
    console.log('🔐 Starting LibraryMate Authentication Tests...\n'.bold.blue);
    
    try {
      // Basic connectivity tests
      await this.testServerHealth();
      
      // Authentication flow tests
      await this.testAdminSignup();
      await this.testAdminLogin();
      await this.testTokenVerification();
      
      // Authorization tests
      await this.testProtectedRoute();
      await this.testUnauthorizedAccess();
      
      // Security tests
      await this.testInvalidCredentials();
      
      // Response format tests
      await this.testResponseFormats();
      
    } catch (error) {
      this.log(`Critical error during testing: ${error.message}`, 'error');
    }
    
    return this.printResults();
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new AuthTester();
  
  tester.runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = AuthTester;
