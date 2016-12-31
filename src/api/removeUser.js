"use strict";

const _ = require('lodash');

/**
 * Gets a user from their id in the URL, then removes them.
 *
 * @param app
 * @returns {Function}
 */
function removeUser(app) {

    return function(req, res) {

        const userId = _.get(req, 'params.userId');

        if (!userId) {
            return app.utils.apiResponse(res, new Error('User not found.'));
        }

        app.models.User.findOne({
            _id: userId
        }).exec((err, user) => {

            if (!user) {
                err = new Error('User not found.');
            }
            if (err) {
                return app.utils.apiResponse(res, err);
            }

            user.remove((err) => {

                app.utils.apiResponse(res, err, user);
            });
        });
    };
}

/**
 *
 * @type {removeUser}
 */
module.exports = removeUser;

