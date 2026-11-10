const router = require('express').Router();
const c = require('./categories.controller');
const { requireAdmin } = require('../../middleware/auth');

// Public
router.get('/active', c.listActive);

// Admin protected
router.get('/', requireAdmin, c.list);
router.post('/', requireAdmin, c.create);
router.put('/:id', requireAdmin, c.update);
router.patch('/:id/status', requireAdmin, c.toggleStatus);
router.delete('/:id', requireAdmin, c.remove);

module.exports = router;
