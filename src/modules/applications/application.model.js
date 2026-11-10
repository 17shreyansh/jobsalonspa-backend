const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    type: { type: String, enum: ['candidate', 'salon'], required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    // Candidate fields
    name: { type: String },
    phone: { type: String, index: true },
    whatsapp: { type: String },
    speciality: { type: String },
    gender: { type: String, enum: ['male', 'female', null] },
    experience: { type: String },
    hometown: { type: String },
    state: { type: String },
    currentSalary: { type: String },
    currentCity: { type: String },
    preferredCity: { type: String },
    expectedSalary: { type: String },
    age: { type: Number },
    education: { type: String },
    diploma: { type: String },
    jobStatus: { type: String },
    remark: { type: String },
    photoPath: { type: String },

    // Salon fields
    salonName: { type: String },
    salonAddress: { type: String },
    salonLocation: { type: String },
    inTime: { type: String },
    outTime: { type: String },
    phoneNumber: { type: String },
    whatsappNumber: { type: String },
    salary: { type: String },
    diplomaRequired: { type: String, enum: ['yes', 'no', null] },
    accommodation: { type: String, enum: ['yes', 'no', null] },
    food: { type: String, enum: ['yes', 'no', null] },
    anyQuery: { type: String },
}, { timestamps: true });

applicationSchema.index({ type: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Application', applicationSchema);
