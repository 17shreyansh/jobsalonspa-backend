const Application = require('./application.model');
const { ok, created, fail, notFound } = require('../../utils/response');

// Public: submit application (candidate or salon)
const submit = async (req, res, next) => {
    try {
        const { type } = req.body;
        if (!['candidate', 'salon'].includes(type)) {
            return fail(res, 'type must be candidate or salon');
        }

        const data = { type };

        if (type === 'candidate') {
            const { name, phone, speciality, gender } = req.body;
            if (!name || !phone || !speciality || !gender) {
                return fail(res, 'name, phone, speciality and gender are required');
            }
            Object.assign(data, {
                name, phone, speciality, gender,
                whatsapp: req.body.whatsapp || null,
                experience: req.body.experience || null,
                hometown: req.body.hometown || null,
                state: req.body.state || null,
                currentSalary: req.body.current_salary || null,
                currentCity: req.body.current_city || null,
                preferredCity: req.body.preferred_city || null,
                expectedSalary: req.body.expected_salary || null,
                age: req.body.age ? Number(req.body.age) : null,
                education: req.body.education || null,
                diploma: req.body.diploma || null,
                jobStatus: req.body.job_status || null,
                remark: req.body.remark || null,
                photoPath: req.file ? req.file.filename : null,
            });
        } else {
            const { salon_name, salon_address, phone_number, speciality } = req.body;
            if (!salon_name || !salon_address || !phone_number || !speciality) {
                return fail(res, 'salon_name, salon_address, phone_number and speciality are required');
            }
            Object.assign(data, {
                salonName: salon_name,
                salonAddress: salon_address,
                phoneNumber: phone_number,
                speciality,
                salonLocation: req.body.salon_location || null,
                inTime: req.body.in_time || null,
                outTime: req.body.out_time || null,
                whatsappNumber: req.body.whatsapp_number || null,
                salary: req.body.salary || null,
                diplomaRequired: req.body.diploma_required || null,
                accommodation: req.body.accommodation || null,
                food: req.body.food || null,
                anyQuery: req.body.any_query || null,
            });
        }

        const application = await Application.create(data);
        return created(res, { application }, 'Application submitted successfully');
    } catch (err) { next(err); }
};

// Admin: list applications
const list = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, type, status, search } = req.query;
        const filter = {};
        if (type) filter.type = type;
        if (status) filter.status = status;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { salonName: { $regex: search, $options: 'i' } },
                { speciality: { $regex: search, $options: 'i' } },
            ];
        }

        const [applications, total] = await Promise.all([
            Application.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            Application.countDocuments(filter),
        ]);

        return ok(res, { applications, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

// Admin: get single application
const getOne = async (req, res, next) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) return notFound(res);
        return ok(res, { application });
    } catch (err) { next(err); }
};

// Admin: update status
const updateStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return fail(res, 'status must be pending, approved or rejected');
        }
        const application = await Application.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!application) return notFound(res);
        return ok(res, { application }, 'Status updated');
    } catch (err) { next(err); }
};

// Admin: delete
const remove = async (req, res, next) => {
    try {
        const application = await Application.findByIdAndDelete(req.params.id);
        if (!application) return notFound(res);
        return ok(res, {}, 'Application deleted');
    } catch (err) { next(err); }
};

module.exports = { submit, list, getOne, updateStatus, remove };
