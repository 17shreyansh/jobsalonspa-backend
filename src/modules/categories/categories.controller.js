const Category = require('./category.model');
const { ok, created, fail, notFound } = require('../../utils/response');

const list = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const filter = {};
        if (status !== undefined) filter.status = status === 'true';

        const [categories, total] = await Promise.all([
            Category.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
            Category.countDocuments(filter),
        ]);

        return ok(res, { categories, total, page: Number(page), pages: Math.ceil(total / limit) });
    } catch (err) { next(err); }
};

const listActive = async (req, res, next) => {
    try {
        const categories = await Category.find({ status: true }).sort({ name: 1 });
        return ok(res, { categories });
    } catch (err) { next(err); }
};

const create = async (req, res, next) => {
    try {
        const { name, type } = req.body;
        if (!name || !type) return fail(res, 'name and type are required');
        const category = await Category.create({ name, type });
        return created(res, { category });
    } catch (err) { next(err); }
};

const update = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!category) return notFound(res);
        return ok(res, { category });
    } catch (err) { next(err); }
};

const toggleStatus = async (req, res, next) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return notFound(res);
        category.status = !category.status;
        await category.save();
        return ok(res, { category });
    } catch (err) { next(err); }
};

const remove = async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return notFound(res);
        return ok(res, {}, 'Category deleted');
    } catch (err) { next(err); }
};

module.exports = { list, listActive, create, update, toggleStatus, remove };
