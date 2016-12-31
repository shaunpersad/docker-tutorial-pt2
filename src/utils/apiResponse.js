"use strict";

const _ = require('lodash');

/**
 *
 * @param res
 * @param err
 * @param result
 * @returns {*}
 */
function apiResponse(res, err, result) {

    if (err) {
        return res.status(500).json({
            message: _.get(err, 'message', 'An unknown error occurred.')
        });
    }
    return res.json(result);
}


/**
 *
 * @type {apiResponse}
 */
module.exports = apiResponse;