// Simple admin authentication middleware
// Checks for x-admin-token header and compares with a hardcoded value (for demo)
// Improved admin authentication middleware
module.exports = (req, res, next) => {
    const token = req.headers['x-admin-token'];
    if (!token) {
        return res.status(403).json({
            message: 'Missing x-admin-token header. Only admins can perform this action.',
            success: false
        });
    }
    if (token === process.env.ADMIN_TOKEN || token === 'secret_admin_token') {
        return next();
    }
    return res.status(403).json({
        message: 'Invalid x-admin-token. Only admins can perform this action.',
        success: false
    });
};