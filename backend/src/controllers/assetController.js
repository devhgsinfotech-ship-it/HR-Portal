// backend/src/controllers/assetController.js
const prisma = require('../config/prisma');

// ============================================================
// ASSET CATEGORIES (CRUD)
// ============================================================

async function getCategories(req, res) {
  try {
    const companyId = req.user.companyId;
    const categories = await prisma.assetCategory.findMany({
      where: { companyId },
      include: {
        _count: { select: { assets: true } }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = categories.map(c => ({
      id: c.id,
      name: c.name,
      totalAssets: c._count.assets
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching asset categories:', error);
    res.status(500).json({ message: 'Error fetching asset categories' });
  }
}

async function createCategory(req, res) {
  try {
    const companyId = req.user.companyId;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }

    const existing = await prisma.assetCategory.findFirst({
      where: { companyId, name: name.trim() }
    });
    if (existing) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await prisma.assetCategory.create({
      data: {
        companyId,
        name: name.trim()
      }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating asset category:', error);
    res.status(500).json({ message: 'Failed to create asset category' });
  }
}

async function updateCategory(req, res) {
  try {
    const companyId = req.user.companyId;
    const id = parseInt(req.params.id, 10);
    const { name } = req.body;

    if (isNaN(id)) return res.status(400).json({ message: 'Invalid category ID' });

    const updated = await prisma.assetCategory.update({
      where: { id },
      data: { name: name.trim() }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating asset category:', error);
    res.status(500).json({ message: 'Failed to update category' });
  }
}

async function deleteCategory(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid category ID' });

    const assetCount = await prisma.asset.count({ where: { categoryId: id } });
    if (assetCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category containing assets' });
    }

    await prisma.assetCategory.delete({ where: { id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset category:', error);
    res.status(500).json({ message: 'Failed to delete category' });
  }
}

// ============================================================
// ASSETS INVENTORY (CRUD & ASSIGNMENT)
// ============================================================

async function getAssets(req, res) {
  try {
    const companyId = req.user.companyId;
    const { status, categoryId } = req.query;

    const where = { companyId };
    if (status) where.status = status;
    if (categoryId) where.categoryId = parseInt(categoryId, 10);

    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
        assignments: {
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: {
            employee: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = assets.map(a => {
      const activeAssignment = a.assignments[0] && !a.assignments[0].returnedAt ? a.assignments[0] : null;
      const emp = activeAssignment?.employee;

      return {
        id: a.id,
        name: a.name,
        assetCode: a.assetCode,
        status: a.status,
        categoryId: a.categoryId,
        categoryName: a.category ? a.category.name : 'Uncategorized',
        purchaseDate: a.purchaseDate ? a.purchaseDate.toISOString().split('T')[0] : null,
        description: a.description,
        assignedTo: emp ? {
          employeeId: emp.id,
          employeeCode: emp.employeeCode,
          name: `${emp.firstName} ${emp.lastName}`,
          email: emp.email,
          avatarUrl: emp.profilePictureUrl,
          assignedAt: activeAssignment.assignedAt
        } : null
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({ message: 'Error fetching assets' });
  }
}

async function createAsset(req, res) {
  try {
    const companyId = req.user.companyId;
    const { name, assetCode, categoryId, purchaseDate, description, status } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Asset name is required' });
    }

    const code = assetCode?.trim() || `AST-${Date.now().toString().slice(-6)}`;

    const existingCode = await prisma.asset.findFirst({
      where: { companyId, assetCode: code }
    });
    if (existingCode) {
      return res.status(400).json({ message: `Asset code "${code}" already exists` });
    }

    const asset = await prisma.asset.create({
      data: {
        companyId,
        name: name.trim(),
        assetCode: code,
        categoryId: categoryId ? parseInt(categoryId, 10) : null,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        description: description || '',
        status: status || 'AVAILABLE'
      },
      include: { category: true }
    });

    res.status(201).json(asset);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({ message: 'Failed to create asset' });
  }
}

async function updateAsset(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid asset ID' });

    const { name, categoryId, purchaseDate, description, status } = req.body;

    const dataToUpdate = {};
    if (name !== undefined) dataToUpdate.name = name.trim();
    if (categoryId !== undefined) dataToUpdate.categoryId = categoryId ? parseInt(categoryId, 10) : null;
    if (purchaseDate !== undefined) dataToUpdate.purchaseDate = purchaseDate ? new Date(purchaseDate) : null;
    if (description !== undefined) dataToUpdate.description = description;
    if (status !== undefined) dataToUpdate.status = status;

    const updated = await prisma.asset.update({
      where: { id },
      data: dataToUpdate,
      include: { category: true }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ message: 'Failed to update asset' });
  }
}

async function deleteAsset(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid asset ID' });

    // Check if asset is currently assigned
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (asset && asset.status === 'ASSIGNED') {
      return res.status(400).json({ message: 'Cannot delete an assigned asset. Please return it first.' });
    }

    await prisma.asset.delete({ where: { id } });
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ message: 'Failed to delete asset' });
  }
}

// ============================================================
// ASSIGN ASSET TO EMPLOYEE
// ============================================================

async function assignAsset(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { employeeId, notes } = req.body;

    if (isNaN(id) || !employeeId) {
      return res.status(400).json({ message: 'Asset ID and Employee ID are required' });
    }

    const empId = parseInt(employeeId, 10);

    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    if (asset.status === 'ASSIGNED') {
      return res.status(400).json({ message: 'Asset is already assigned' });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: empId },
      include: { user: true }
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // Create Assignment
    const assignment = await prisma.assetAssignment.create({
      data: {
        assetId: id,
        employeeId: empId,
        notes: notes || ''
      }
    });

    // Update Asset Status to ASSIGNED
    await prisma.asset.update({
      where: { id },
      data: { status: 'ASSIGNED' }
    });

    // Send Notification to Employee
    if (employee.userId) {
      await prisma.notification.create({
        data: {
          receiverId: employee.userId,
          senderId: req.user.id,
          type: 'ASSET_ASSIGNED',
          title: 'New Asset Assigned',
          message: `Asset "${asset.name}" (${asset.assetCode}) has been assigned to you.`
        }
      });
    }

    res.json({ message: 'Asset assigned successfully', assignment });
  } catch (error) {
    console.error('Error assigning asset:', error);
    res.status(500).json({ message: 'Failed to assign asset' });
  }
}

// ============================================================
// RETURN ASSET (Check-in)
// ============================================================

async function returnAsset(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { returnCondition, notes } = req.body;

    if (isNaN(id)) return res.status(400).json({ message: 'Invalid asset ID' });

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { returnedAt: null },
          orderBy: { assignedAt: 'desc' },
          take: 1,
          include: { employee: true }
        }
      }
    });

    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const activeAssignment = asset.assignments[0];
    if (activeAssignment) {
      await prisma.assetAssignment.update({
        where: { id: activeAssignment.id },
        data: {
          returnedAt: new Date(),
          notes: notes ? `${activeAssignment.notes || ''} | Return Notes: ${notes}` : activeAssignment.notes
        }
      });
    }

    // Determine new asset status: MAINTENANCE if damaged, else AVAILABLE
    const newStatus = returnCondition === 'DAMAGED' ? 'MAINTENANCE' : 'AVAILABLE';

    await prisma.asset.update({
      where: { id },
      data: { status: newStatus }
    });

    // Send notification to employee if active assignment existed
    if (activeAssignment?.employee?.userId) {
      await prisma.notification.create({
        data: {
          receiverId: activeAssignment.employee.userId,
          senderId: req.user.id,
          type: 'ASSET_RETURN_REQUESTED',
          title: 'Asset Return Processed',
          message: `Asset "${asset.name}" (${asset.assetCode}) assigned to you has been marked as returned and processed by HR.`
        }
      });
    }

    res.json({ message: 'Asset returned successfully', status: newStatus });
  } catch (error) {
    console.error('Error returning asset:', error);
    res.status(500).json({ message: 'Failed to return asset' });
  }
}

// ============================================================
// EMPLOYEE MY ASSETS VIEW
// ============================================================

async function getMyAssets(req, res) {
  try {
    const userId = req.user.id;
    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const assignments = await prisma.assetAssignment.findMany({
      where: { employeeId: employee.id },
      include: {
        asset: {
          include: { category: true }
        }
      },
      orderBy: { assignedAt: 'desc' }
    });

    const formatted = assignments.map(asgn => ({
      assignmentId: asgn.id,
      assetId: asgn.asset.id,
      name: asgn.asset.name,
      assetCode: asgn.asset.assetCode,
      status: asgn.asset.status,
      categoryName: asgn.asset.category ? asgn.asset.category.name : 'General',
      assignedAt: asgn.assignedAt,
      returnedAt: asgn.returnedAt,
      isCurrentlyAssigned: !asgn.returnedAt,
      notes: asgn.notes
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching my assets:', error);
    res.status(500).json({ message: 'Error fetching my assets' });
  }
}

// ============================================================
// REQUEST ASSET RETURN (Employee Action)
// ============================================================

async function requestAssetReturn(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { reason, notes } = req.body;
    const userId = req.user.id;

    if (isNaN(id)) return res.status(400).json({ message: 'Invalid asset ID' });

    const employee = await prisma.employee.findUnique({ where: { userId } });
    if (!employee) return res.status(404).json({ message: 'Employee profile not found' });

    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { returnedAt: null },
          orderBy: { assignedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    const activeAssignment = asset.assignments[0];
    if (!activeAssignment || activeAssignment.employeeId !== employee.id) {
      return res.status(403).json({ message: 'You are not assigned to this asset' });
    }

    const returnNotesStr = `[Return Request Reason]: ${reason || 'Return requested'}${notes ? ` | Notes: ${notes}` : ''}`;

    await prisma.asset.update({
      where: { id },
      data: { status: 'RETURN_REQUESTED' }
    });

    await prisma.assetAssignment.update({
      where: { id: activeAssignment.id },
      data: {
        notes: activeAssignment.notes ? `${activeAssignment.notes} | ${returnNotesStr}` : returnNotesStr
      }
    });

    // Notify company Admins, HR, and Managers
    const empName = employee ? `${employee.firstName} ${employee.lastName}` : (req.user.firstName || 'Employee');
    const targetCompanyId = asset.companyId || req.user.companyId;

    const notifyRecipients = await prisma.user.findMany({
      where: {
        companyId: targetCompanyId,
        role: { in: ['COMPANY_ADMIN', 'HR', 'MANAGER'] },
        accountStatus: 'ACTIVE'
      }
    });

    for (const recipient of notifyRecipients) {
      if (recipient.id === userId) continue;

      await prisma.notification.create({
        data: {
          receiverId: recipient.id,
          senderId: userId,
          type: 'ASSET_RETURN_REQUESTED',
          title: 'Asset Return Requested',
          message: `${empName} requested to return asset "${asset.name}" (${asset.assetCode}). Reason: ${reason || 'Return requested'}.`
        }
      });
    }

    res.json({ message: 'Asset return request submitted successfully', status: 'RETURN_REQUESTED' });
  } catch (error) {
    console.error('Error requesting asset return:', error);
    res.status(500).json({ message: 'Failed to request asset return' });
  }
}

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAssets,
  createAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  returnAsset,
  getMyAssets,
  requestAssetReturn
};
