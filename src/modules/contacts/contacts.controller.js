const { DeviceOwner, Contact } = require('./contact.model');
const Application = require('../applications/application.model');
const { ok, created, fail, notFound } = require('../../utils/response');

// Public (mobile app): upload contacts
const store = async (req, res, next) => {
    try {
        const { device_id, userName, contacts } = req.body;
        if (!device_id) return fail(res, 'device_id is required');
        if (!Array.isArray(contacts)) return fail(res, 'contacts must be an array');

        let owner = await DeviceOwner.findOne({ deviceId: device_id });
        if (!owner) {
            owner = await DeviceOwner.create({ deviceId: device_id, userName: userName || 'Dear Client' });
        }

        let inserted = 0;
        let updated = 0;

        for (const c of contacts) {
            const phone = (c.phone || '').replace(/[^0-9]/g, '');
            if (!phone) continue;
            const name = (c.name || '').trim();

            const existing = await Contact.findOne({ ownerId: owner._id, phone });
            if (existing) {
                if (name && name !== existing.name) {
                    existing.name = name;
                    await existing.save();
                    updated++;
                }
                continue;
            }

            await Contact.create({ ownerId: owner._id, name: name || phone, phone });
            inserted++;
        }

        return ok(res, { owner_id: owner._id, inserted_count: inserted, updated_count: updated }, 'Contacts processed successfully');
    } catch (err) { next(err); }
};

// Public (mobile app): find matches
const findMatches = async (req, res, next) => {
    try {
        const { device_id } = req.query;
        if (!device_id) return ok(res, { matches: [] });

        const owner = await DeviceOwner.findOne({ deviceId: device_id });
        if (!owner) return ok(res, { matches: [] });

        const contacts = await Contact.find({ ownerId: owner._id }).select('phone');
        const phones = contacts.map((c) => c.phone);

        const matches = await Application.find({
            type: 'candidate',
            phone: { $in: phones },
        }).select('name phone speciality currentCity status photoPath').distinct('phone').then(() =>
            Application.find({ type: 'candidate', phone: { $in: phones } })
                .select('name phone speciality currentCity status photoPath')
                .sort({ createdAt: -1 })
        );

        // Deduplicate by phone
        const seen = new Set();
        const unique = matches.filter((m) => {
            if (seen.has(m.phone)) return false;
            seen.add(m.phone);
            return true;
        });

        return ok(res, { matches: unique });
    } catch (err) { next(err); }
};

// Admin: list device owners
const listOwners = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, search } = req.query;
        const filter = search ? { userName: { $regex: search, $options: 'i' } } : {};

        const [owners, total] = await Promise.all([
            DeviceOwner.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            DeviceOwner.countDocuments(filter),
        ]);

        return ok(res, { owners, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

// Admin: list contacts for an owner
const listContacts = async (req, res, next) => {
    try {
        const { page = 1, limit = 15, search } = req.query;
        const filter = { ownerId: req.params.ownerId };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
            ];
        }

        const [contacts, total] = await Promise.all([
            Contact.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            Contact.countDocuments(filter),
        ]);

        return ok(res, { contacts, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

// Admin: delete owner + all their contacts
const deleteOwner = async (req, res, next) => {
    try {
        const owner = await DeviceOwner.findByIdAndDelete(req.params.id);
        if (!owner) return notFound(res);
        await Contact.deleteMany({ ownerId: req.params.id });
        return ok(res, {}, 'Owner and contacts deleted');
    } catch (err) { next(err); }
};

// Admin: delete single contact
const deleteContact = async (req, res, next) => {
    try {
        const contact = await Contact.findByIdAndDelete(req.params.id);
        if (!contact) return notFound(res);
        return ok(res, {}, 'Contact deleted');
    } catch (err) { next(err); }
};

module.exports = { store, findMatches, listOwners, listContacts, deleteOwner, deleteContact };
