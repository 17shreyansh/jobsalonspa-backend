const { verifyAccess } = require('../utils/jwt');
const { unauthorized } = require('../utils/response');
const Admin = require('../modules/auth/admin.model');

const requireAdmin = async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) return unauthorized(res);

    try {
        const payload = verifyAccess(header.slice(7));
        const admin = await Admin.findById(payload.id).select('-password');
        if (!admin || !admin.active) return unauthorized(res);
        req.admin = admin;
        next();
    } catch {
        unauthorized(res);
    }
};

module.exports = { requireAdmin };
