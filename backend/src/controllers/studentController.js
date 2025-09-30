const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const { catchAsync, NotFoundError, ConflictError } = require('../middlewares/errorHandler');

const prisma = new PrismaClient();

exports.getStudents = catchAsync(async (req, res) => {
  const students = await prisma.student.findMany({
    include: {
      library: true,
      payments: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      registrationNumber: true,
      subscriptionPlan: true,
      paymentStatus: true,
      joinDate: true,
      library: true,
      payments: true,
      // Exclude password from response
    }
  });
  
  res.json({
    success: true,
    data: students,
    count: students.length
  });
});

exports.createStudent = catchAsync(async (req, res) => {
  const { 
    name, 
    email, 
    phone, 
    password, 
    registrationNumber, 
    aadharReference, 
    libraryId,
    subscriptionPlan = 'MONTHLY',
    paymentStatus = 'PENDING'
  } = req.body;

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  const student = await prisma.student.create({
    data: {
      name,
      email,
      phone,
      password: hashedPassword,
      registrationNumber,
      aadharReference,
      libraryId,
      subscriptionPlan,
      paymentStatus
    },
    include: {
      library: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      registrationNumber: true,
      subscriptionPlan: true,
      paymentStatus: true,
      joinDate: true,
      library: true,
      // Exclude password from response
    }
  });

  res.status(201).json({
    success: true,
    data: student,
    message: 'Student created successfully'
  });
});

exports.updateStudent = catchAsync(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // Hash password if it's being updated
  if (updateData.password) {
    updateData.password = await bcrypt.hash(updateData.password, 10);
  }

  const student = await prisma.student.update({
    where: { id },
    data: updateData,
    include: {
      library: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      registrationNumber: true,
      subscriptionPlan: true,
      paymentStatus: true,
      joinDate: true,
      library: true,
      // Exclude password from response
    }
  });

  if (!student) {
    throw new NotFoundError('Student not found');
  }

  res.json({
    success: true,
    data: student,
    message: 'Student updated successfully'
  });
});

exports.deleteStudent = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const student = await prisma.student.findUnique({ where: { id } });
  if (!student) {
    throw new NotFoundError('Student not found');
  }

  await prisma.student.delete({ where: { id } });
  
  res.json({
    success: true,
    message: 'Student deleted successfully'
  });
});