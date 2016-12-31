"use strict";

const _ = require('lodash');

/**
 * A bit self-explanatory really.
 *
 * @param app
 * @returns {Function}
 */
function createUser(app) {

    return function(req, res) {

        const user = _.get(req, 'body', {});

        app.models.User.create(user, (err, user) => {

            app.utils.apiResponse(res, err, user);
        });
    };
}

/**
 *
 * @type {createUser}
 */
module.exports = createUser;
