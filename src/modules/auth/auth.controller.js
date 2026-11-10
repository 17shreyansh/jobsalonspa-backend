const Admin = require('./admin.model');
const { signAccess, signRefresh, verifyRefresh } = require('../../utils/jwt');
const { ok, fail, unauthorized, created } = require('../../utils/response');

// POST /api/v1/auth/login
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return fail(res, 'Email and password required');

        const admin = await Admin.findOne({ email });
        if (!admin || !(await admin.comparePassword(password))) {
            return unauthorized(res, 'Invalid credentials');
        }
        if (!admin.active) return unauthorized(res, 'Account is deactivated');

        admin.lastLoginAt = new Date();
        admin.lastLoginIp = req.ip;
        await admin.save();

        const payload = { id: admin._id, role: admin.role };
        const accessToken = signAccess(payload);
        const refreshToken = signRefresh(payload);

        return ok(res, { accessToken, refreshToken, admin });
    } catch (err) {
        next(err);
    }
};

// POST /api/v1/auth/refresh
const refresh = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return fail(res, 'Refresh token required');

        const payload = verifyRefresh(refreshToken);
        const admin = await Admin.findById(payload.id);
        if (!admin || !admin.active) return unauthorized(res);

        const newAccess = signAccess({ id: admin._id, role: admin.role });
        const newRefresh = signRefresh({ id: admin._id, role: admin.role });

        return ok(res, { accessToken: newAccess, refreshToken: newRefresh });
    } catch {
        return unauthorized(res, 'Invalid or expired refresh token');
    }
};

// GET /api/v1/auth/me
const me = async (req, res) => ok(res, { admin: req.admin });

// POST /api/v1/auth/seed  — creates first superadmin (only if none exists)
const seed = async (req, res, next) => {
    try {
        const exists = await Admin.findOne({ role: 'superadmin' });
        if (exists) return fail(res, 'Superadmin already exists', 409);

        const admin = await Admin.create({
            name: 'Super Admin',
            email: 'admin@jobsalonspa.in',
            password: 'Admin@1234',
            role: 'superadmin',
        });

        return created(res, { admin }, 'Superadmin created');
    } catch (err) {
        next(err);
    }
};

module.exports = { login, refresh, me, seed };
