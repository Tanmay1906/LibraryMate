const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otpService = require('../services/otpService');
const prisma = new PrismaClient();

exports.login = async (req, res) => {
  const { email, password, role } = req.body;
  let user;
  if (role === 'admin') {
    user = await prisma.admin.findUnique({ where: { email } });
  } else {
    user = await prisma.student.findUnique({ where: { email } });
  }
  if (!user) return res.status(404).json({ error: 'User not found' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, name: user.name, email: user.email, role } });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password, role, registrationNumber, aadharReference, libraryId } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    
    if (role === 'admin') {
      const admin = await prisma.admin.create({ 
        data: { name, email, phone, password: hashed } 
      });
      return res.json({ success: true, admin });
    } else {
      // For students, libraryId is required
      if (!libraryId) {
        return res.status(400).json({ error: 'Library ID is required for student registration' });
      }
      
      const student = await prisma.student.create({
        data: { 
          name, 
          email, 
          phone, 
          password: hashed, 
          registrationNumber, 
          aadharReference, 
          subscriptionPlan: 'monthly',
          libraryId,
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      });
      return res.json({ success: true, student });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.sendOTP = async (req, res) => {
  try {
    const { phone, role } = req.body;
    const code = otpService.generateOTP();
    await otpService.sendOTP(phone, code);
    
    await prisma.oTP.create({
      data: {
        phone,
        code,
        expiresAt: new Date(Date.now() + 1000 * 60 * (process.env.OTP_EXPIRY_MINUTES || 5)),
        role
      }
    });
    res.json({ success: true, message: 'OTP sent' });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { phone, code } = req.body;
    const otp = await prisma.oTP.findFirst({ 
      where: { phone, code, verified: false } 
    });
    
    if (!otp || otp.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    
    await prisma.oTP.update({ 
      where: { id: otp.id }, 
      data: { verified: true } 
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};
