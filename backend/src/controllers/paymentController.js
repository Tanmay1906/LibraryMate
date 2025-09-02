const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getPaymentHistory = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({ include: { student: true } });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch payment history.' });
  }
};
