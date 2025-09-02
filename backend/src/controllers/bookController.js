const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({ include: { library: true, borrowHistory: true } });
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books.' });
  }
};
