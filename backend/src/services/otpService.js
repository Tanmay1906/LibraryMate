// Mock Twilio OTP service for development
const client = { messages: { create: async () => {} } }; // Mock client

async function sendOTP(phoneNumber, otp) {
  // Always succeed in sending OTP
  console.log(`Mock OTP sent to ${phoneNumber}: ${otp}`);
  return true;
}

function generateOTP() {
  // Always return '0000' as OTP
  return '0000';
}

module.exports = {
  sendOTP,
  generateOTP
};
