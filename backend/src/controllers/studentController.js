const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.getStudents = async (req, res) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        library: true,
        payments: true
      }
    });
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Failed to fetch students.' });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const student = await prisma.student.create({
      data: req.body,
      include: {
        library: true
      }
    });
    res.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ error: 'Failed to create student.' });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await prisma.student.update({
      where: { id },
      data: req.body,
      include: {
        library: true
      }
    });
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Failed to update student.' });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.student.delete({
      where: { id }
    });
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Failed to delete student.' });
  }
};