const crypto = require("crypto");

class OTPService {
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendOTP(phone, code) {
    // Implement actual sms service
    console.log(`Sending OTP ${code} to ${phone}`);
  }

  async verifyOTP(phone, code) {
    //implement otp verification logic
    //for demo accept 6 digit code
    return code.length === 6;
  }
}

module.exports = new OTPService();
