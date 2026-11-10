const Application = require('../applications/application.model');
const Job = require('../jobs/job.model');
const Category = require('../categories/category.model');
const { DeviceOwner } = require('../contacts/contact.model');
const { ok } = require('../../utils/response');

const stats = async (req, res, next) => {
    try {
        const [
            totalCandidates,
            totalSalons,
            pendingCandidates,
            pendingSalons,
            approvedCandidates,
            rejectedCandidates,
            totalJobs,
            activeJobs,
            totalCategories,
            totalDevices,
            recentApplications,
        ] = await Promise.all([
            Application.countDocuments({ type: 'candidate' }),
            Application.countDocuments({ type: 'salon' }),
            Application.countDocuments({ type: 'candidate', status: 'pending' }),
            Application.countDocuments({ type: 'salon', status: 'pending' }),
            Application.countDocuments({ type: 'candidate', status: 'approved' }),
            Application.countDocuments({ type: 'candidate', status: 'rejected' }),
            Job.countDocuments(),
            Job.countDocuments({ status: true }),
            Category.countDocuments(),
            DeviceOwner.countDocuments(),
            Application.find().sort({ createdAt: -1 }).limit(5)
                .select('type status name salonName speciality createdAt'),
        ]);

        return ok(res, {
            applications: {
                totalCandidates,
                totalSalons,
                pendingCandidates,
                pendingSalons,
                approvedCandidates,
                rejectedCandidates,
            },
            jobs: { total: totalJobs, active: activeJobs },
            categories: { total: totalCategories },
            devices: { total: totalDevices },
            recentApplications,
        });
    } catch (err) { next(err); }
};

module.exports = { stats };
