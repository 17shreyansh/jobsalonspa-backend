const router = require('express').Router();
const { stats } = require('./dashboard.controller');
const { requireAdmin } = require('../../middleware/auth');

router.get('/stats', requireAdmin, stats);

module.exports = router;
