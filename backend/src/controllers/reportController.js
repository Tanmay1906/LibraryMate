const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getReportSummary = async (req, res) => {
  try {
    // Example: Count of books, students, payments
    const bookCount = await prisma.book.count();
    const studentCount = await prisma.student.count();
    const paymentCount = await prisma.payment.count();
    res.json({ bookCount, studentCount, paymentCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch report summary.' });
  }
};
