const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    // Check for Authorization header
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // Verify the token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'fallback_secret_key'
        );
        
        // Attach user info to the request object
        req.user = decoded;
        next();
    } catch (error) {
        console.error('[AUTH ERROR]', error.message, '| JWT_SECRET:', process.env.JWT_SECRET);
        return res.status(401).json({ message: 'Token is invalid or expired' });
    }
};

/**
 * requireRole — Platform-level guard.
 * Both SUPER_ADMIN and COMPANY_ADMIN automatically bypass (for platform-wide read/view ops).
 * Use this for READ operations or platform-level features accessible to both admin types.
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // SUPER_ADMIN and COMPANY_ADMIN have full platform read rights
        if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'COMPANY_ADMIN') {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
};

/**
 * requireCompanyRole — Company-level operational guard.
 * COMPANY_ADMIN automatically bypasses (they run company operations).
 * SUPER_ADMIN does NOT automatically bypass — they must be explicitly listed in roles.
 *
 * Use this for WRITE operations on company data:
 *   employees, payroll processing, leave approval, attendance management,
 *   holidays, assets, departments, designations, salary structures.
 *
 * SUPER_ADMIN = Platform/tenant manager. They have VIEW/support access only
 * for company-level HR modules, not daily HR operational control.
 */
const requireCompanyRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Only COMPANY_ADMIN gets automatic bypass for company-level operations
        if (req.user.role === 'COMPANY_ADMIN') {
            return next();
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Forbidden: This operation is restricted to company-level administrators.'
            });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    requireRole,
    requireCompanyRole
};
