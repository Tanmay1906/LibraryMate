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
  const { name, email, phone, password, role, registration_number, aadhar_reference } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  if (role === 'admin') {
    const admin = await prisma.admin.create({ data: { name, email, phone, password: hashed } });
    return res.json({ success: true, admin });
  } else {
    const student = await prisma.student.create({
      data: { name, email, phone, password: hashed, registration_number, aadhar_reference, subscription_plan: 'monthly', dues: 0 }
    });
    return res.json({ success: true, student });
  }
};

exports.sendOTP = async (req, res) => {
  const { phone, role } = req.body;
  const code = otpService.generateOTP();
  await otpService.sendOTP(phone, code);
  await prisma.oTP.create({
    data: {
      phone,
      code,
      expires_at: new Date(Date.now() + 1000 * 60 * (process.env.OTP_EXPIRY_MINUTES || 5)),
      role
    }
  });
  res.json({ success: true, message: 'OTP sent' });
};

exports.verifyOTP = async (req, res) => {
  const { phone, code } = req.body;
  const otp = await prisma.oTP.findFirst({ where: { phone, code, verified: false } });
  if (!otp || otp.expires_at < new Date()) return res.status(400).json({ error: 'Invalid or expired OTP' });
  await prisma.oTP.update({ where: { id: otp.id }, data: { verified: true } });
  res.json({ success: true });
};
