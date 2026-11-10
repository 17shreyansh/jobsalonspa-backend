const Job = require('./job.model');
const Category = require('../categories/category.model');
const { ok, created, fail, notFound } = require('../../utils/response');

const list = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status, categoryId } = req.query;
        const filter = {};
        if (status !== undefined) filter.status = status === 'true';
        if (categoryId) filter['category._id'] = categoryId;

        const [jobs, total] = await Promise.all([
            Job.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            Job.countDocuments(filter),
        ]);

        return ok(res, { jobs, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

const getOne = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return notFound(res);
        return ok(res, { job });
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { title, description, type, categoryId } = req.body;
        if (!title || !description || !type || !categoryId) {
            return fail(res, 'title, description, type and categoryId are required');
        }
        const category = await Category.findById(categoryId);
        if (!category) return fail(res, 'Category not found', 404);

        const job = await Job.create({
            title, description, type,
            category: { _id: category._id, name: category.name },
            createdBy: req.admin._id,
        });
        return created(res, { job });
    } catch (err) { next(err); }
};

const update = async (req, res, next) => {
    try {
        const { title, description, type, categoryId, status } = req.body;
        const job = await Job.findById(req.params.id);
        if (!job) return notFound(res);

        if (categoryId && categoryId !== String(job.category._id)) {
            const category = await Category.findById(categoryId);
            if (!category) return fail(res, 'Category not found', 404);
            job.category = { _id: category._id, name: category.name };
        }

        if (title !== undefined) job.title = title;
        if (description !== undefined) job.description = description;
        if (type !== undefined) job.type = type;
        if (status !== undefined) job.status = status;

        await job.save();
        return ok(res, { job });
    } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) return notFound(res);
        job.status = !job.status;
        await job.save();
        return ok(res, { job });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const job = await Job.findByIdAndDelete(req.params.id);
        if (!job) return notFound(res);
        return ok(res, {}, 'Job deleted');
    } catch (err) { next(err); }
};

// Public: jobs by category
const byCategory = async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const filter = { 'category._id': req.params.categoryId, status: true };
        const [jobs, total] = await Promise.all([
            Job.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            Job.countDocuments(filter),
        ]);
        return ok(res, { jobs, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

module.exports = { list, getOne, create, update, toggleStatus, remove, byCategory };
