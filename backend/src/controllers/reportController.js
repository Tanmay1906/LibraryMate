const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getReportSummary = async (req, res) => {
  try {
    // Get comprehensive statistics
    const bookCount = await prisma.book.count();
    const studentCount = await prisma.student.count();
    const paymentCount = await prisma.payment.count();
    const libraryCount = await prisma.library.count();
    
    // Get payment statistics
    const totalRevenue = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'completed' }
    });
    
    const pendingPayments = await prisma.student.count({
      where: { paymentStatus: 'pending' }
    });
    
    const activeStudents = await prisma.student.count({
      where: { paymentStatus: 'paid' }
    });

    // Get recent activities
    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: { name: true }
        }
      }
    });

    const recentStudents = await prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { name: true, createdAt: true, subscriptionPlan: true }
    });

    res.json({ 
      summary: {
        bookCount, 
        studentCount, 
        paymentCount, 
        libraryCount,
        totalRevenue: totalRevenue._sum.amount || 0,
        pendingPayments,
        activeStudents
      },
      recentActivities: {
        payments: recentPayments,
        students: recentStudents
      }
    });
  } catch (error) {
    console.error('Error fetching report summary:', error);
    res.status(500).json({ error: 'Failed to fetch report summary.' });
  }
};

exports.getStudentReport = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        library: {
          select: { name: true }
        },
        payments: true,
        borrowHistory: {
          include: {
            book: {
              select: { title: true }
            }
          }
        }
      }
    });
    
    res.json(students);
  } catch (error) {
    console.error('Error fetching student report:', error);
    res.status(500).json({ error: 'Failed to fetch student report.' });
  }
};

exports.getPaymentReport = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        student: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payment report:', error);
    res.status(500).json({ error: 'Failed to fetch payment report.' });
  }
};
