const { DeviceOwner, Contact } = require('./contact.model');
const Application = require('../applications/application.model');
const { ok, created, fail, notFound } = require('../../utils/response');

// Public (mobile app): upload contacts
const store = async (req, res, next) => {
    try {
        const { device_id, userName, contacts, appSource } = req.body;
        const source = appSource === 'pinkcastle' ? 'pinkcastle' : 'jobsalon';
        console.log('[contacts/store] device_id:', device_id, '| source:', source, '| contacts count:', Array.isArray(contacts) ? contacts.length : contacts);
        if (!device_id) return fail(res, 'device_id is required');
        if (!Array.isArray(contacts)) return fail(res, 'contacts must be an array');

        let owner = await DeviceOwner.findOneAndUpdate(
            { deviceId: device_id },
            { $setOnInsert: { deviceId: device_id, userName: userName || 'Dear Client', appSource: source } },
            { upsert: true, new: true }
        );

        const ops = contacts
            .map((c) => ({ name: (c.name || '').trim(), phone: (c.phone || '').replace(/[^0-9]/g, '') }))
            .filter((c) => c.phone)
            .map((c) => ({
                updateOne: {
                    filter: { ownerId: owner._id, phone: c.phone },
                    update: { $setOnInsert: { ownerId: owner._id, name: c.name || c.phone, phone: c.phone } },
                    upsert: true,
                },
            }));

        if (!ops.length) return ok(res, { owner_id: owner._id, inserted_count: 0, updated_count: 0 }, 'No valid contacts');

        const result = await Contact.bulkWrite(ops, { ordered: false });

        return ok(res, {
            owner_id: owner._id,
            inserted_count: result.upsertedCount,
            updated_count: result.modifiedCount,
        }, 'Contacts processed successfully');
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
        const { page = 1, limit = 10, search, appSource } = req.query;
        // 'pinkcastle' -> only pinkcastle; anything else -> Job Salon (includes legacy records with no appSource)
        const filter = appSource === 'pinkcastle'
            ? { appSource: 'pinkcastle' }
            : { appSource: { $ne: 'pinkcastle' } };
        if (search) filter.userName = { $regex: search, $options: 'i' };

        const [owners, total] = await Promise.all([
            DeviceOwner.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            DeviceOwner.countDocuments(filter),
        ]);

        const ownerIds = owners.map((o) => o._id);
        const counts = await Contact.aggregate([
            { $match: { ownerId: { $in: ownerIds } } },
            { $group: { _id: '$ownerId', count: { $sum: 1 } } },
        ]);
        const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));

        const ownersWithCount = owners.map((o) => ({
            ...o.toObject(),
            contactCount: countMap[o._id.toString()] || 0,
        }));

        return ok(res, { owners: ownersWithCount, total, page: Number(page), pages: Math.ceil(total / limit) });
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

// Admin: get single owner
const getOwner = async (req, res, next) => {
    try {
        const owner = await DeviceOwner.findById(req.params.ownerId);
        if (!owner) return notFound(res);
        return ok(res, { owner });
    } catch (err) { next(err); }
};

// Admin: overall stats
const getStats = async (req, res, next) => {
    try {
        const { appSource } = req.query;
        const ownerFilter = appSource === 'pinkcastle'
            ? { appSource: 'pinkcastle' }
            : { appSource: { $ne: 'pinkcastle' } };
        const ownerIds = (await DeviceOwner.find(ownerFilter).select('_id')).map((o) => o._id);
        const [totalDevices, totalContacts] = await Promise.all([
            Promise.resolve(ownerIds.length),
            Contact.countDocuments({ ownerId: { $in: ownerIds } }),
        ]);
        return ok(res, { totalDevices, totalContacts });
    } catch (err) { next(err); }
};

module.exports = { store, findMatches, listOwners, listContacts, deleteOwner, deleteContact, getStats, getOwner };
