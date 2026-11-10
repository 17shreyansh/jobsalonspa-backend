const router = require('express').Router();
const c = require('./contacts.controller');
const { requireAdmin } = require('../../middleware/auth');

// Public (mobile app)
router.post('/store', c.store);
router.get('/matches', c.findMatches);

// Admin protected
router.get('/owners', requireAdmin, c.listOwners);
router.get('/owners/:ownerId/contacts', requireAdmin, c.listContacts);
router.delete('/owners/:id', requireAdmin, c.deleteOwner);
router.delete('/:id', requireAdmin, c.deleteContact);

module.exports = router;
