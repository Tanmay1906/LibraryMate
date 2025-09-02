const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBorrowStatus = async (req, res) => {
  try {
    const borrows = await prisma.borrow_History.findMany({ include: { student: true, book: true } });
    res.json(borrows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch borrow status.' });
  }
};
