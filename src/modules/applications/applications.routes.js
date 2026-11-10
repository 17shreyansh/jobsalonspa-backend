const router = require('express').Router();
const c = require('./applications.controller');
const { requireAdmin } = require('../../middleware/auth');
const upload = require('../../middleware/upload');

// Public: submit application
router.post('/', upload.single('photo'), c.submit);

// Admin protected
router.get('/', requireAdmin, c.list);
router.get('/:id', requireAdmin, c.getOne);
router.patch('/:id/status', requireAdmin, c.updateStatus);
router.delete('/:id', requireAdmin, c.remove);

module.exports = router;
