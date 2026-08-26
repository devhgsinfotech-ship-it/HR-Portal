// backend/src/controllers/clientController.js
const prisma = require('../config/prisma');

/**
 * GET /api/clients
 * Returns all clients for the company
 */
const getClients = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { search, isActive } = req.query;

    const where = { companyId };
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (search) {
      where.OR = [
        { companyName: { contains: search } },
        { contactPerson: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const clients = await prisma.client.findMany({
      where,
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: clients });
  } catch (err) {
    console.error('getClients error:', err);
    res.status(500).json({ message: 'Failed to fetch clients.' });
  }
};

/**
 * GET /api/clients/:id
 */
const getClientById = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const client = await prisma.client.findFirst({
      where: { id: Number(req.params.id), companyId },
      include: {
        projects: {
          select: { id: true, name: true, status: true, projectCode: true },
        },
      },
    });

    if (!client) return res.status(404).json({ message: 'Client not found.' });
    res.json({ success: true, data: client });
  } catch (err) {
    console.error('getClientById error:', err);
    res.status(500).json({ message: 'Failed to fetch client.' });
  }
};

/**
 * POST /api/clients
 * Create a new client (Admin/PM only)
 */
const createClient = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const { companyName, contactPerson, email, phone, address, website } = req.body;

    if (!companyName || !email) {
      return res.status(400).json({ message: 'Company name and email are required.' });
    }

    const client = await prisma.client.create({
      data: { companyId, companyName, contactPerson, email, phone, address, website },
    });

    res.status(201).json({ success: true, message: 'Client created successfully.', data: client });
  } catch (err) {
    console.error('createClient error:', err);
    res.status(500).json({ message: 'Failed to create client.' });
  }
};

/**
 * PUT /api/clients/:id
 */
const updateClient = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const clientId = Number(req.params.id);
    const { companyName, contactPerson, email, phone, address, website, isActive } = req.body;

    const existing = await prisma.client.findFirst({ where: { id: clientId, companyId } });
    if (!existing) return res.status(404).json({ message: 'Client not found.' });

    const client = await prisma.client.update({
      where: { id: clientId },
      data: { companyName, contactPerson, email, phone, address, website, isActive },
    });

    res.json({ success: true, message: 'Client updated.', data: client });
  } catch (err) {
    console.error('updateClient error:', err);
    res.status(500).json({ message: 'Failed to update client.' });
  }
};

/**
 * DELETE /api/clients/:id
 */
const deleteClient = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const clientId = Number(req.params.id);

    const existing = await prisma.client.findFirst({ where: { id: clientId, companyId } });
    if (!existing) return res.status(404).json({ message: 'Client not found.' });

    await prisma.client.delete({ where: { id: clientId } });
    res.json({ success: true, message: 'Client deleted.' });
  } catch (err) {
    console.error('deleteClient error:', err);
    res.status(500).json({ message: 'Failed to delete client.' });
  }
};

module.exports = { getClients, getClientById, createClient, updateClient, deleteClient };
