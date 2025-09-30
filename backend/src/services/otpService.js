const crypto = require("crypto");

class OTPService {
  constructor() {
    // Store OTPs with expiration times in memory (use Redis in production)
    this.otpStore = new Map();
    this.OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes
    this.MAX_ATTEMPTS = 3;
    this.attemptStore = new Map();
  }

  generateOTP() {
    return crypto.randomInt(1000, 9999).toString();
  }

  async sendOTP(phone, code) {
    try {
      // Store OTP with expiration time
      const expiryTime = Date.now() + this.OTP_EXPIRY_TIME;
      this.otpStore.set(phone, {
        code: code,
        expiryTime: expiryTime,
        attempts: 0
      });

      // Reset attempt counter for this phone
      this.attemptStore.set(phone, 0);

      // TODO: Implement actual SMS service (Twilio, AWS SNS, etc.)
      console.log(`Sending OTP ${code} to ${phone} (expires in 5 minutes)`);
      
      return {
        success: true,
        message: 'OTP sent successfully',
        expiryTime: expiryTime
      };
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  }

  async verifyOTP(phone, inputCode) {
    try {
      // Demo mode: accept "0000" as valid OTP for any phone number
      if (inputCode === '0000') {
        console.log(`Demo OTP verification successful for ${phone}`);
        return {
          success: true,
          message: 'OTP verified successfully (demo mode)'
        };
      }

      const storedOTP = this.otpStore.get(phone);
      
      if (!storedOTP) {
        return {
          success: false,
          message: 'No OTP found for this phone number. Please request a new OTP.'
        };
      }

      // Check if OTP has expired
      if (Date.now() > storedOTP.expiryTime) {
        this.otpStore.delete(phone);
        return {
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        };
      }

      // Check attempt limits
      const attempts = this.attemptStore.get(phone) || 0;
      if (attempts >= this.MAX_ATTEMPTS) {
        this.otpStore.delete(phone);
        this.attemptStore.delete(phone);
        return {
          success: false,
          message: 'Maximum attempts exceeded. Please request a new OTP.'
        };
      }

      // Verify OTP
      if (storedOTP.code === inputCode) {
        // OTP is correct, remove from store
        this.otpStore.delete(phone);
        this.attemptStore.delete(phone);
        
        return {
          success: true,
          message: 'OTP verified successfully'
        };
      } else {
        // Increment attempt counter
        this.attemptStore.set(phone, attempts + 1);
        const remainingAttempts = this.MAX_ATTEMPTS - (attempts + 1);
        
        return {
          success: false,
          message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
        };
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      return {
        success: false,
        message: 'OTP verification failed'
      };
    }
  }

  // Clean up expired OTPs (call this periodically)
  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [phone, otpData] of this.otpStore.entries()) {
      if (now > otpData.expiryTime) {
        this.otpStore.delete(phone);
        this.attemptStore.delete(phone);
      }
    }
  }
}

module.exports = new OTPService();
