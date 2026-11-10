const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    type: { type: String, enum: ['standard', 'spa'], required: true },
    category: {
        _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
        name: { type: String, required: true },
    },
    status: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

jobSchema.index({ 'category._id': 1 });
jobSchema.index({ status: 1 });

module.exports = mongoose.model('Job', jobSchema);
