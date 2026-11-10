const router = require('express').Router();
const { login, refresh, me, seed } = require('./auth.controller');
const { requireAdmin } = require('../../middleware/auth');

router.post('/login', login);
router.post('/refresh', refresh);
router.get('/me', requireAdmin, me);
router.post('/seed', seed);

module.exports = router;
