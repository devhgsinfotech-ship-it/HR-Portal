const prisma = require('../config/prisma');

// Get all holidays for the current user's company
const getHolidays = async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) return res.status(403).json({ message: 'Company ID missing from token' });

    const holidays = await prisma.holiday.findMany({
      where: { companyId },
      orderBy: { holidayDate: 'asc' },
    });
    res.json(holidays);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create a new holiday
const createHoliday = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { title, holidayDate, description, isNational } = req.body;

    if (!title || !holidayDate) {
      return res.status(400).json({ message: 'Title and holidayDate are required' });
    }

    const newHoliday = await prisma.holiday.create({
      data: {
        title,
        holidayDate: new Date(holidayDate),
        description: description || '',
        isNational: isNational || false,
        company: { connect: { id: companyId } }
      },
    });

    res.status(201).json(newHoliday);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update an existing holiday
const updateHoliday = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;
    const { title, holidayDate, description, isNational } = req.body;

    const existingHoliday = await prisma.holiday.findUnique({
      where: { id: Number(id) }
    });

    if (!existingHoliday || existingHoliday.companyId !== companyId) {
      return res.status(404).json({ message: 'Holiday not found or unauthorized' });
    }

    const updatedHoliday = await prisma.holiday.update({
      where: { id: Number(id) },
      data: {
        title,
        holidayDate: holidayDate ? new Date(holidayDate) : undefined,
        description,
        isNational
      },
    });

    res.json(updatedHoliday);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Delete a holiday
const deleteHoliday = async (req, res) => {
  try {
    const { companyId } = req.user;
    const { id } = req.params;

    const existingHoliday = await prisma.holiday.findUnique({
      where: { id: Number(id) }
    });

    if (!existingHoliday || existingHoliday.companyId !== companyId) {
      return res.status(404).json({ message: 'Holiday not found or unauthorized' });
    }

    await prisma.holiday.delete({
      where: { id: Number(id) }
    });

    res.json({ message: 'Holiday deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

module.exports = {
  getHolidays,
  createHoliday,
  updateHoliday,
  deleteHoliday
};
