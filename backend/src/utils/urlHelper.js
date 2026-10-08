// backend/src/utils/urlHelper.js

/**
 * Dynamically resolves the Frontend Base URL for both Local and Production environments.
 * - Respects request origin header from browser fetch/axios calls
 * - Respects request referer header
 * - Handles environment variables (FRONTEND_URL, APP_URL, FRONTEND_DOMAIN)
 * - Dynamically rewrites dev backend port (e.g., 5000 -> 3000)
 * 
 * @param {Object} [req] - Express request object
 * @returns {string} Dynamic Frontend Base URL (e.g. 'http://localhost:3000' or 'https://company.aaups.com')
 */
function getDynamicFrontendUrl(req) {
    // 1. Check req.headers.origin (sent automatically by browser on API requests)
    if (req && req.headers && req.headers.origin) {
        return req.headers.origin.replace(/\/$/, '');
    }

    // 2. Check req.headers.referer (sent on page requests/navigations)
    if (req && req.headers && req.headers.referer) {
        try {
            const urlObj = new URL(req.headers.referer);
            return `${urlObj.protocol}//${urlObj.host}`.replace(/\/$/, '');
        } catch (e) {
            // Ignore parse errors
        }
    }

    // 3. Environment Variables (e.g., in production or Docker setup)
    const envUrl = process.env.FRONTEND_URL || process.env.APP_URL;
    if (envUrl) {
        return envUrl.replace(/\/$/, '');
    }

    // 4. Dynamic derivation from Host header & protocol
    if (req && req.get) {
        const protocol = (req.headers && req.headers['x-forwarded-proto']) || req.protocol || 'http';
        const host = req.get('host') || '';

        if (host) {
            // If backend is on dev port 5000, map to dev frontend port 3000
            if (host.includes(':5000')) {
                return `${protocol}://${host.replace(':5000', ':3000')}`;
            }
            return `${protocol}://${host}`;
        }
    }

    // 5. Fallback if no request context available (e.g. standalone CLI script)
    const domain = process.env.FRONTEND_DOMAIN || 'localhost';
    const port = process.env.NODE_ENV === 'production' ? '' : ':3000';
    return `http://${domain}${port}`;
}

module.exports = {
    getDynamicFrontendUrl
};
