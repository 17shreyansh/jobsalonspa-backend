const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    status: { type: Boolean, default: true },
}, { timestamps: true });

categorySchema.index({ name: 1 });

module.exports = mongoose.model('Category', categorySchema);
