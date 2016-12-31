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

        const props = _.get(req, 'body', {});

        app.models.User.create(props, (err, user) => {

            app.utils.apiResponse(res, err, user);
        });
    };
}

/**
 *
 * @type {createUser}
 */
module.exports = createUser;
