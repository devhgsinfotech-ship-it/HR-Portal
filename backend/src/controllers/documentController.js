// backend/src/controllers/documentController.js
const prisma = require('../config/prisma');
const path = require('path');
const fs = require('fs');

// ============================================================
// GET DOCUMENTS FOR AN EMPLOYEE
// ============================================================

async function getEmployeeDocuments(req, res) {
  try {
    const { employeeId } = req.params;
    const empId = parseInt(employeeId, 10);
    if (isNaN(empId)) return res.status(400).json({ message: 'Invalid employee ID' });

    const documents = await prisma.document.findMany({
      where: { employeeId: empId },
      orderBy: { createdAt: 'desc' }
    });

    res.json(documents);
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    res.status(500).json({ message: 'Error fetching documents' });
  }
}

// ============================================================
// UPLOAD DOCUMENT FOR AN EMPLOYEE
// ============================================================

async function uploadDocument(req, res) {
  try {
    const { employeeId, name, fileType } = req.body;
    const empId = parseInt(employeeId, 10);
    if (isNaN(empId)) return res.status(400).json({ message: 'Employee ID is required' });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/documents/${req.file.filename}`;

    const document = await prisma.document.create({
      data: {
        employeeId: empId,
        name: name || req.file.originalname,
        fileUrl,
        fileType: fileType || req.file.mimetype,
        status: 'PENDING'
      }
    });

    // Send notification to Company Admins and HRs
    try {
      const emp = await prisma.employee.findUnique({
        where: { id: empId },
        include: { user: true }
      });
      const empName = emp ? `${emp.firstName} ${emp.lastName}` : (req.user.name || 'Employee');
      const targetCompanyId = req.user.companyId || emp?.user?.companyId;

      if (targetCompanyId) {
        const recipients = await prisma.user.findMany({
          where: {
            companyId: targetCompanyId,
            role: { in: ['COMPANY_ADMIN', 'HR', 'SUPER_ADMIN'] },
            accountStatus: 'ACTIVE'
          }
        });

        for (const r of recipients) {
          if (r.id === req.user.id) continue;
          await prisma.notification.create({
            data: {
              receiverId: r.id,
              senderId: req.user.id,
              type: 'DOCUMENT_VERIFIED',
              title: 'New Document Uploaded',
              message: `${empName} uploaded document "${document.name}".`
            }
          });
        }
      }
    } catch (notifErr) {
      console.error('Failed to send document upload notification:', notifErr);
    }

    res.status(201).json(document);
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Failed to upload document' });
  }
}

// ============================================================
// VERIFY OR REJECT DOCUMENT (HR Endpoint)
// ============================================================

async function verifyDocument(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const { status, remarks } = req.body;

    if (isNaN(id) || !['VERIFIED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid document ID or status' });
    }

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { employee: { include: { user: true } } }
    });

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    const updated = await prisma.document.update({
      where: { id },
      data: {
        status,
        verifiedAt: status === 'VERIFIED' ? new Date() : null
      }
    });

    // Send notification to employee
    if (doc.employee.userId) {
      const type = status === 'VERIFIED' ? 'DOCUMENT_VERIFIED' : 'ANNOUNCEMENT';
      const title = status === 'VERIFIED' ? 'Document Approved' : 'Document Verification Update';
      const message = status === 'VERIFIED'
        ? `Your document "${doc.name}" has been verified by HR.`
        : `Your document "${doc.name}" was rejected. ${remarks ? 'Reason: ' + remarks : 'Please re-upload.'}`;

      await prisma.notification.create({
        data: {
          receiverId: doc.employee.userId,
          senderId: req.user.id,
          type,
          title,
          message
        }
      });
    }

    res.json({ message: `Document marked as ${status}`, document: updated });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ message: 'Failed to verify document' });
  }
}

// ============================================================
// DELETE DOCUMENT
// ============================================================

async function deleteDocument(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'Invalid document ID' });

    const doc = await prisma.document.findUnique({ where: { id } });
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // Remove file from disk if exists
    if (doc.fileUrl) {
      const filePath = path.join(__dirname, '../../', doc.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    await prisma.document.delete({ where: { id } });
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document' });
  }
}

module.exports = {
  getEmployeeDocuments,
  uploadDocument,
  verifyDocument,
  deleteDocument
};
