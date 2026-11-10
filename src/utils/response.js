const ok = (res, data = {}, message = 'Success', status = 200) =>
    res.status(status).json({ success: true, message, data });

const created = (res, data = {}, message = 'Created') =>
    ok(res, data, message, 201);

const fail = (res, message = 'Error', status = 400, errors = null) => {
    const body = { success: false, message };
    if (errors) body.errors = errors;
    return res.status(status).json(body);
};

const notFound = (res, message = 'Not found') => fail(res, message, 404);

const unauthorized = (res, message = 'Unauthorized') => fail(res, message, 401);

const forbidden = (res, message = 'Forbidden') => fail(res, message, 403);

module.exports = { ok, created, fail, notFound, unauthorized, forbidden };
