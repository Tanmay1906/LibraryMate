const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../middlewares/errorHandler').catchAsync;
const ApiError = require('../middlewares/errorHandler').ApiError;
const prisma = new PrismaClient();

exports.getPaymentHistory = catchAsync(async (req, res) => {
  const { userId } = req.user; // From auth middleware
  
  // If user is LIBRARY_OWNER, get all payments for their library
  // If user is STUDENT, get only their payments
  let payments;
  
  if (req.user.role === 'LIBRARY_OWNER') {
    // Get payments for students in this library owner's library
    payments = await prisma.payment.findMany({
      include: { 
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } else if (req.user.role === 'STUDENT') {
    payments = await prisma.payment.findMany({
      where: { studentId: userId },
      include: { 
        student: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    throw new ApiError(403, 'Unauthorized to view payment history');
  }
  
  res.status(200).json({
    success: true,
    data: payments,
    message: 'Payment history fetched successfully'
  });
});

exports.createPayment = catchAsync(async (req, res) => {
  const { amount, studentId, subscriptionId } = req.body;
  
  // Verify student exists
  const student = await prisma.student.findUnique({
    where: { id: studentId }
  });
  
  if (!student) {
    throw new ApiError(404, 'Student not found');
  }
  
  const payment = await prisma.payment.create({
    data: {
      amount: parseFloat(amount),
      studentId,
      subscriptionId,
      status: 'PENDING',
      transactionId: `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    },
    include: {
      student: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  
  res.status(201).json({
    success: true,
    data: payment,
    message: 'Payment created successfully'
  });
});

exports.updatePaymentStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Invalid status. Valid statuses are: ${validStatuses.join(', ')}`);
  }
  
  const existingPayment = await prisma.payment.findUnique({
    where: { id }
  });
  
  if (!existingPayment) {
    throw new ApiError(404, 'Payment not found');
  }
  
  const payment = await prisma.payment.update({
    where: { id },
    data: { status },
    include: {
      student: {
        select: { id: true, name: true, email: true }
      }
    }
  });
  
  res.status(200).json({
    success: true,
    data: payment,
    message: 'Payment status updated successfully'
  });
});
