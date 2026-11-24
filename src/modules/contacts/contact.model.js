const mongoose = require('mongoose');

const deviceOwnerSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true, index: true },
    userName: { type: String, default: 'Dear Client' },
    // Which app this device's contacts came from. Existing Job Salon records
    // predate this field (undefined) and are treated as 'jobsalon'.
    appSource: { type: String, default: 'jobsalon', index: true },
}, { timestamps: true });

const contactSchema = new mongoose.Schema({
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DeviceOwner', required: true, index: true },
    name: { type: String },
    phone: { type: String, required: true },
    email: { type: String },
    notes: { type: String },
}, { timestamps: true });

contactSchema.index({ ownerId: 1, phone: 1 }, { unique: true });

const DeviceOwner = mongoose.model('DeviceOwner', deviceOwnerSchema);
const Contact = mongoose.model('Contact', contactSchema);

module.exports = { DeviceOwner, Contact };
