require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../modules/auth/admin.model');

const adminData = {
    name: 'Super Admin',
    email: 'admin@jobsalonspa.com',
    password: 'Admin@123456',
    role: 'superadmin',
};

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const exists = await Admin.findOne({ email: adminData.email });
    if (exists) {
        console.log('Admin already exists:', adminData.email);
        process.exit(0);
    }

    await Admin.create(adminData);
    console.log('Admin seeded successfully!');
    console.log('Email   :', adminData.email);
    console.log('Password:', adminData.password);
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err.message);
    process.exit(1);
});
