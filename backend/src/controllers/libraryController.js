const { PrismaClient } = require('@prisma/client');
const catchAsync = require('../middlewares/errorHandler').catchAsync;
const ApiError = require('../middlewares/errorHandler').ApiError;
const prisma = new PrismaClient();

exports.getLibraries = catchAsync(async (req, res) => {
  // Only admin can see all libraries, library owners see their own
  let libraries;
  
  if (req.user.role === 'ADMIN') {
    libraries = await prisma.library.findMany({
      include: {
        admin: {
          select: { name: true, email: true, phone: true }
        },
        students: true,
        books: true
      }
    });
  } else if (req.user.role === 'LIBRARY_OWNER') {
    libraries = await prisma.library.findMany({
      where: { adminId: req.user.userId },
      include: {
        admin: {
          select: { name: true, email: true, phone: true }
        },
        students: true,
        books: true
      }
    });
  } else {
    throw new ApiError(403, 'Unauthorized to view libraries');
  }
  
  res.status(200).json({
    success: true,
    data: libraries,
    message: 'Libraries fetched successfully'
  });
});

exports.getLibrary = catchAsync(async (req, res) => {
  const { id } = req.params;
  const library = await prisma.library.findUnique({
    where: { id },
    include: {
      admin: {
        select: { name: true, email: true, phone: true }
      },
      students: true,
      books: true
    }
  });
  
  if (!library) {
    throw new ApiError(404, 'Library not found');
  }
  
  // Check permissions - library owner can only see their own library
  if (req.user.role === 'LIBRARY_OWNER' && library.adminId !== req.user.userId) {
    throw new ApiError(403, 'Unauthorized to view this library');
  }
  
  res.status(200).json({
    success: true,
    data: library,
    message: 'Library fetched successfully'
  });
});

exports.createLibrary = catchAsync(async (req, res) => {
  // Only admin can create libraries
  if (req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only admin can create libraries');
  }
  
  const library = await prisma.library.create({
    data: req.body,
    include: {
      admin: {
        select: { name: true, email: true, phone: true }
      }
    }
  });
  
  res.status(201).json({
    success: true,
    data: library,
    message: 'Library created successfully'
  });
});

exports.updateLibrary = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Check if library exists first
  const existingLibrary = await prisma.library.findUnique({
    where: { id }
  });
  
  if (!existingLibrary) {
    throw new ApiError(404, 'Library not found');
  }
  
  // Check permissions - library owner can only update their own library
  if (req.user.role === 'LIBRARY_OWNER' && existingLibrary.adminId !== req.user.userId) {
    throw new ApiError(403, 'Unauthorized to update this library');
  }
  
  const library = await prisma.library.update({
    where: { id },
    data: req.body,
    include: {
      admin: {
        select: { name: true, email: true, phone: true }
      }
    }
  });
  
  res.status(200).json({
    success: true,
    data: library,
    message: 'Library updated successfully'
  });
});

exports.deleteLibrary = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  // Only admin can delete libraries
  if (req.user.role !== 'ADMIN') {
    throw new ApiError(403, 'Only admin can delete libraries');
  }
  
  const existingLibrary = await prisma.library.findUnique({
    where: { id }
  });
  
  if (!existingLibrary) {
    throw new ApiError(404, 'Library not found');
  }
  
  await prisma.library.delete({
    where: { id }
  });
  
  res.status(200).json({
    success: true,
    message: 'Library deleted successfully'
  });
});
