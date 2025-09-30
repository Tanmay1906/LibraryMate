const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const otpService = require('../services/otpService');
const catchAsync = require('../middlewares/errorHandler').catchAsync;
const ApiError = require('../middlewares/errorHandler').ApiError;
const prisma = new PrismaClient();

exports.login = catchAsync(async (req, res) => {
    const { email, password, role } = req.body;
    let user;
    
    // Use enum-safe role checking
    if (role === 'admin' || role === 'owner') {
      user = await prisma.admin.findUnique({ where: { email } });
    } else if (role === 'student') {
      user = await prisma.student.findUnique({ 
        where: { email },
        include: { library: true }
      });
    } else {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid role specified' 
      });
    }
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }
    
    const token = jwt.sign(
      { id: user.id, role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      ...(role === 'student' && { 
        libraryId: user.libraryId,
        registrationNumber: user.registrationNumber 
      })
    };
    
    res.status(200).json({ 
      success: true,
      token, 
      user: userData,
      message: 'Login successful'
    });
});

exports.signup = catchAsync(async (req, res) => {
    console.log('Signup request received - req.body:', JSON.stringify(req.body, null, 2));
    const { name, email, phone, password, role, registrationNumber, aadharReference, libraryId } = req.body;
    console.log('Extracted fields:', { name, email, phone, role, registrationNumber, aadharReference, libraryId });
    const hashed = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    
    if (role === 'admin') {
      console.log('Creating admin account...');
      const admin = await prisma.admin.create({ 
        data: { name, email, phone, password: hashed } 
      });
      
      // Generate JWT token for immediate login
      const token = jwt.sign(
        { id: admin.id, role: 'admin' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );

      const userData = {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
        role: 'admin'
      };

      return res.status(201).json({ 
        success: true, 
        token,
        user: userData,
        message: 'Admin registered successfully!' 
      });
    } else {
      // For students, libraryId is required
      if (!libraryId) {
        return res.status(400).json({ error: 'Library ID is required for student registration' });
      }
      
      // Check if library exists, create a demo one if it doesn't
      let library = await prisma.library.findUnique({ where: { id: libraryId } });
      if (!library) {
        // Create demo admin first
        let demoAdmin = await prisma.admin.findUnique({ where: { email: 'demo@library.com' } });
        if (!demoAdmin) {
          demoAdmin = await prisma.admin.create({
            data: {
              name: 'Demo Admin',
              email: 'demo@library.com',
              phone: '9999999999',
              password: await bcrypt.hash('password123', 10)
            }
          });
        }
        
        // Create demo library
        library = await prisma.library.create({
          data: {
            id: libraryId,
            name: 'Demo Library',
            address: '123 Demo Street, Demo City',
            phone: '9999999999',
            adminId: demoAdmin.id
          }
        });
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

      // Generate JWT token for immediate login
      const token = jwt.sign(
        { id: student.id, role: 'student' }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }
      );

      const userData = {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: 'student',
        registrationNumber: student.registrationNumber,
        subscriptionPlan: student.subscriptionPlan,
        libraryId: student.libraryId
      };

      console.log('About to send response...');
      return res.status(201).json({ 
        success: true, 
        token,
        user: userData,
        message: 'Student registered successfully!' 
      });
    }
});

exports.sendOTP = catchAsync(async (req, res) => {
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
    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully' 
    });
});

exports.verifyOTP = catchAsync(async (req, res) => {
    const { phone, code } = req.body;
    
    // Use OTP service for verification
    const verification = await otpService.verifyOTP(phone, code);
    
    if (!verification.success) {
      return res.status(400).json({ 
        success: false,
        message: verification.message 
      });
    }
    
    res.status(200).json({ 
      success: true,
      data: null,
      message: verification.message 
    });
});

// Token verification endpoint
exports.verify = catchAsync(async (req, res) => {
    // Token is already verified in middleware, just return user info
    const userId = req.user.id;
    const role = req.user.role;
    
    let user;
    if (role === 'admin' || role === 'owner') {
      user = await prisma.admin.findUnique({ 
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true }
      });
    } else {
      user = await prisma.student.findUnique({ 
        where: { id: userId },
        select: { id: true, name: true, email: true, phone: true, libraryId: true, registrationNumber: true }
      });
    }
    
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    
    res.status(200).json({ 
      success: true,
      data: { ...user, role },
      message: 'Token verified successfully'
    });
});

// Complete signup after OTP verification
exports.completeSignup = catchAsync(async (req, res) => {
    const { name, email, phone, password, role, registrationNumber, aadharReference, libraryId } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    let newUser;
    
    if (role === 'admin' || role === 'owner') {
      newUser = await prisma.admin.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword
        }
      });
    } else {
      newUser = await prisma.student.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          registrationNumber,
          aadharReference,
          libraryId,
          subscriptionPlan: 'MONTHLY',
          paymentStatus: 'PENDING'
        }
      });
    }
    
    const token = jwt.sign(
      { id: newUser.id, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role
        }
      },
      message: 'Signup completed successfully'
    });
});
