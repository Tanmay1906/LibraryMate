const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getLibraries = async (req, res) => {
  const libraries = await prisma.library.findMany({ where: { adminId: req.user.id } });
  res.json(libraries);
};

exports.createLibrary = async (req, res) => {
  const { name, location } = req.body;
  const library = await prisma.library.create({ data: { name, location, adminId: req.user.id } });
  res.json(library);
};

exports.updateLibrary = async (req, res) => {
  const { id } = req.params;
  const { name, location } = req.body;
  const library = await prisma.library.update({ where: { id }, data: { name, location } });
  res.json(library);
};

exports.deleteLibrary = async (req, res) => {
  const { id } = req.params;
  await prisma.library.delete({ where: { id } });
  res.json({ success: true });
};
// ...existing code for other admin features
