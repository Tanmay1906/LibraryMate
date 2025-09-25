const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLibraries = async (req, res) => {
  try {
    const libraries = await prisma.library.findMany({
      include: {
        admin: {
          select: { name: true, email: true, phone: true }
        },
        students: true,
        books: true
      }
    });
    res.json(libraries);
  } catch (error) {
    console.error('Error fetching libraries:', error);
    res.status(500).json({ error: 'Failed to fetch libraries.' });
  }
};

exports.getLibrary = async (req, res) => {
  try {
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
      return res.status(404).json({ error: 'Library not found.' });
    }
    
    res.json(library);
  } catch (error) {
    console.error('Error fetching library:', error);
    res.status(500).json({ error: 'Failed to fetch library.' });
  }
};

exports.createLibrary = async (req, res) => {
  try {
    const library = await prisma.library.create({
      data: req.body,
      include: {
        admin: {
          select: { name: true, email: true, phone: true }
        }
      }
    });
    res.json(library);
  } catch (error) {
    console.error('Error creating library:', error);
    res.status(500).json({ error: 'Failed to create library.' });
  }
};

exports.updateLibrary = async (req, res) => {
  try {
    const { id } = req.params;
    const library = await prisma.library.update({
      where: { id },
      data: req.body,
      include: {
        admin: {
          select: { name: true, email: true, phone: true }
        }
      }
    });
    res.json(library);
  } catch (error) {
    console.error('Error updating library:', error);
    res.status(500).json({ error: 'Failed to update library.' });
  }
};
