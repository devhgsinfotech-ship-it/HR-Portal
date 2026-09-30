const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/project-members', verifyToken, async (req, res) => {
    try {
        const companyId = req.user.companyId;

        // Fetch all projects for the company, including members, manager, projectManager, and client
        const projects = await prisma.project.findMany({
            where: { companyId: companyId },
            include: {
                members: {
                    include: {
                        employee: {
                            include: { user: true }
                        }
                    }
                },
                manager: {
                    include: { user: true }
                },
                projectManager: {
                    include: { user: true }
                },
                client: true
            }
        });

        const uniqueUsersMap = new Map();

        const addUser = (id, name, email, createdDate, imageUrl, role) => {
            const key = `user_${id}`;
            if (!uniqueUsersMap.has(key)) {
                uniqueUsersMap.set(key, {
                    id: id,
                    name: name || 'N/A',
                    email: email || 'N/A',
                    created_date: createdDate,
                    image_url: imageUrl || '',
                    roles: new Set([role])
                });
            } else {
                uniqueUsersMap.get(key).roles.add(role);
            }
        };

        const addClient = (client) => {
            const key = `client_${client.id}`;
            if (!uniqueUsersMap.has(key)) {
                uniqueUsersMap.set(key, {
                    id: client.id,
                    name: client.contactPerson || client.companyName || 'N/A',
                    email: client.email || 'N/A',
                    created_date: client.createdAt,
                    image_url: '',
                    roles: new Set(['Client'])
                });
            } else {
                uniqueUsersMap.get(key).roles.add('Client');
            }
        };

        projects.forEach(project => {
            // Add normal project members
            project.members.forEach(pm => {
                if (pm.employee && pm.employee.user) {
                    addUser(
                        pm.employee.user.id,
                        pm.employee.user.name,
                        pm.employee.user.email,
                        pm.employee.user.createdAt,
                        pm.employee.profilePhotoUrl,
                        pm.role || 'Member'
                    );
                }
            });

            // Add manager
            if (project.manager && project.manager.user) {
                addUser(
                    project.manager.user.id,
                    project.manager.user.name,
                    project.manager.user.email,
                    project.manager.user.createdAt,
                    project.manager.profilePhotoUrl,
                    'Manager'
                );
            }

            // Add project manager
            if (project.projectManager && project.projectManager.user) {
                addUser(
                    project.projectManager.user.id,
                    project.projectManager.user.name,
                    project.projectManager.user.email,
                    project.projectManager.user.createdAt,
                    project.projectManager.profilePhotoUrl,
                    'Project Manager'
                );
            }

            // Add client
            if (project.client) {
                addClient(project.client);
            }
        });

        const formattedUsers = Array.from(uniqueUsersMap.values()).map(user => ({
            ...user,
            role: Array.from(user.roles).join(', ')
        }));

        res.json({ success: true, data: formattedUsers });
    } catch (error) {
        console.error('Error fetching project members:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
