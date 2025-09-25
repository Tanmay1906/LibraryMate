const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getBooks = async (req, res) => {
  try {
    const books = await prisma.book.findMany({ 
      include: { 
        library: {
          select: { name: true, id: true }
        }, 
        borrowHistory: {
          include: {
            student: {
              select: { name: true, id: true }
            }
          }
        }
      } 
    });

    // Add mock data for frontend compatibility
    const booksWithMockData = books.map(book => ({
      ...book,
      isWishlisted: false,
      isCompleted: false,
      readingProgress: 0,
      coverUrl: book.coverUrl || 'https://images.pexels.com/photos/1029141/pexels-photo-1029141.jpeg?auto=compress&cs=tinysrgb&w=300'
    }));

    res.json(booksWithMockData);
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({ error: 'Failed to fetch books.' });
  }
};

exports.getBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: { 
        library: true, 
        borrowHistory: {
          include: {
            student: {
              select: { name: true, id: true }
            }
          }
        }
      }
    });
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found.' });
    }
    
    res.json(book);
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).json({ error: 'Failed to fetch book.' });
  }
};

exports.createBook = async (req, res) => {
  try {
    const book = await prisma.book.create({
      data: req.body,
      include: {
        library: true
      }
    });
    res.json(book);
  } catch (error) {
    console.error('Error creating book:', error);
    res.status(500).json({ error: 'Failed to create book.' });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await prisma.book.update({
      where: { id },
      data: req.body,
      include: {
        library: true
      }
    });
    res.json(book);
  } catch (error) {
    console.error('Error updating book:', error);
    res.status(500).json({ error: 'Failed to update book.' });
  }
};
