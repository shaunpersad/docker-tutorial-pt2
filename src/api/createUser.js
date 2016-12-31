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

        const props = _.pick(_.get(req, 'body', {}), ['firstName', 'lastName']);

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
