const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Extract clean company prefix from company name.
 * e.g.:
 * "HGS Infotech Pvt Ltd" -> "HGS"
 * "Tata Infotech" -> "TATA"
 * "Wipro Technologies" -> "WIPRO"
 * "A B Solutions" -> "ABS"
 */
function extractCompanyPrefix(companyNameOrCode) {
    if (!companyNameOrCode) return 'EMP';

    let str = String(companyNameOrCode).trim().toUpperCase();

    // If input is a hyphenated code like "HGS-502", extract the prefix before '-'
    if (str.includes('-')) {
        const parts = str.split('-').map(s => s.trim()).filter(Boolean);
        if (parts.length >= 1 && parts[0].length >= 2) {
            str = parts[0];
        }
    }

    // Clean name: remove special characters except spaces
    const cleanName = str.replace(/[^A-Z0-9\s]/g, '').trim();
    const allWords = cleanName.split(/\s+/).filter(Boolean);
    if (allWords.length === 0) return 'EMP';

    // Ignore common legal entity suffixes when identifying the company prefix
    const legalSuffixes = new Set(['PVT', 'LTD', 'PRIVATE', 'LIMITED', 'LLC', 'INC', 'CORP', 'CORPORATION', 'CO', 'COMPANY']);
    const meaningfulWords = allWords.filter(w => !legalSuffixes.has(w));
    const words = meaningfulWords.length > 0 ? meaningfulWords : allWords;

    const firstWord = words[0];

    // If first word has 2 or more characters (e.g. "HGS", "TATA", "WIPRO", "INFOSYS")
    // Use the first word (up to 8 characters)
    if (firstWord && firstWord.length >= 2) {
        return firstWord.substring(0, 8);
    }

    // If first word is a single letter (e.g. "A B Tech"), combine initials of meaningful words
    if (words.length >= 2) {
        const initials = words.map(w => w[0]).join('');
        if (initials.length >= 2) {
            return initials.substring(0, 6);
        }
    }

    return firstWord || 'CMP';
}

/**
 * Generate a unique Company Code based on company name (e.g. "HGS Infotech Pvt Ltd" -> "HGS-342")
 * @param {Object} [db] - Prisma client or transaction object
 * @param {string} companyName - Name of the company
 * @returns {Promise<string>} Unique company code
 */
async function generateCompanyCode(db, companyName) {
    const client = db || prisma;
    
    let prefix = extractCompanyPrefix(companyName);
    if (!prefix || prefix.length < 2) {
        prefix = 'CMP';
    }

    // Try generating code with random 3-4 digit number until unique
    let attempts = 0;
    while (attempts < 100) {
        const randomNum = Math.floor(100 + Math.random() * 900); // 3 digit number
        const candidateCode = `${prefix}-${randomNum}`;

        const existing = await client.company.findFirst({
            where: { companyCode: candidateCode }
        });

        if (!existing) {
            return candidateCode;
        }
        attempts++;
    }

    // Fallback if prefix collision high
    return `${prefix}-${Date.now().toString().slice(-4)}`;
}

function getCompanyPrefixFromNameOrCode(input) {
    return extractCompanyPrefix(input);
}

/**
 * Generate a unique Employee Code prefixed with Company Name Prefix (e.g. "HGS-1001", "TATA-3243")
 * @param {Object} [db] - Prisma client or transaction object
 * @param {number} companyId - Target Company ID
 * @param {string} [companyNameOrCode] - Target Company Name or Code (e.g., "HGS Infotech" -> "HGS")
 * @returns {Promise<string>} Unique employee code
 */
async function generateEmployeeCode(db, companyId, companyNameOrCode) {
    const client = db || prisma;

    let basePrefix = 'EMP';
    if (companyId) {
        const comp = await client.company.findUnique({
            where: { id: companyId },
            select: { name: true, companyCode: true }
        });
        if (comp?.name) {
            basePrefix = extractCompanyPrefix(comp.name);
        } else if (comp?.companyCode) {
            basePrefix = extractCompanyPrefix(comp.companyCode);
        }
    } else if (companyNameOrCode) {
        basePrefix = extractCompanyPrefix(companyNameOrCode);
    }

    // Find the current count of employees in this company
    const totalCount = await client.employee.count({
        where: { user: { companyId } }
    });

    let nextSeq = totalCount + 1001; // Start numbers at 1001

    let attempts = 0;
    while (attempts < 100) {
        const candidateCode = `${basePrefix}-${nextSeq}`;

        const existing = await client.employee.findUnique({
            where: { employeeCode: candidateCode }
        });

        if (!existing) {
            return candidateCode;
        }

        nextSeq++;
        attempts++;
    }

    return `${basePrefix}-${Date.now().toString().slice(-4)}`;
}

/**
 * Auto-assigns default Department, Designation, Unique Employee ID, and Username for an employee if missing
 * @param {Object} [db] - Prisma client or transaction object
 * @param {number} userId - Target User ID
 * @param {number} companyId - Target Company ID
 * @returns {Promise<Object>} Object containing assigned values
 */
async function autoAssignEmployeeDefaults(db, userId, companyId) {
    const client = db || prisma;
    const user = await client.user.findUnique({
        where: { id: userId },
        include: { company: true, employee: true }
    });
    if (!user || !user.employee) return null;

    const emp = user.employee;
    const isHR = user.role === 'HR' || user.role === 'COMPANY_ADMIN';

    // 1. Department assignment
    let departmentId = emp.departmentId;
    if (!departmentId) {
        let dept = await client.department.findFirst({
            where: { companyId }
        });
        if (!dept) {
            const deptName = isHR ? 'Human Resources' : 'General Administration';
            dept = await client.department.create({
                data: {
                    companyId,
                    name: deptName,
                    description: `${deptName} Department`
                }
            });
        }
        departmentId = dept.id;
    }

    // 2. Designation assignment
    let designationId = emp.designationId;
    if (!designationId) {
        let desig = await client.designation.findFirst({
            where: { companyId }
        });
        if (!desig) {
            const desigName = isHR ? 'HR Manager' : 'Executive';
            desig = await client.designation.create({
                data: {
                    companyId,
                    name: desigName,
                    description: `${desigName} Role`
                }
            });
        }
        designationId = desig.id;
    }

    // 3. Unique Employee Code
    let finalEmpCode = emp.employeeCode;
    if (!finalEmpCode || finalEmpCode.startsWith('PENDING_HR_') || finalEmpCode.includes('PENDING') || finalEmpCode.startsWith('HIPL-') || finalEmpCode.startsWith('EMP-')) {
        const compName = user.company?.name || user.company?.companyCode || 'EMP';
        finalEmpCode = await generateEmployeeCode(client, companyId, compName);
    }

    // 4. Username / Full name
    let username = user.name;
    if (!username || username.trim() === '') {
        username = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || user.email.split('@')[0];
    }

    // 5. CompanyRole assignment
    let companyRoleId = emp.companyRoleId;
    if (!companyRoleId) {
        const roleNameMap = { HR: 'HR Manager', MANAGER: 'Manager', EMPLOYEE: 'Employee' };
        const targetRoleName = roleNameMap[user.role] || user.role;
        const foundRole = await client.companyRole.findFirst({
            where: { companyId, name: targetRoleName }
        });
        if (foundRole) {
            companyRoleId = foundRole.id;
        }
    }

    // Update Employee
    await client.employee.update({
        where: { id: emp.id },
        data: {
            departmentId,
            designationId,
            companyRoleId,
            employeeCode: finalEmpCode,
            onboardingStatus: 'COMPLETED'
        }
    });

    // Update User
    await client.user.update({
        where: { id: userId },
        data: {
            name: username,
            accountStatus: 'ACTIVE'
        }
    });

    return { departmentId, designationId, employeeCode: finalEmpCode, username };
}

module.exports = {
    generateCompanyCode,
    generateEmployeeCode,
    autoAssignEmployeeDefaults,
    extractCompanyPrefix
};
