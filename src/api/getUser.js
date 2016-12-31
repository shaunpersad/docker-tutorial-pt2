"use strict";

const _ = require('lodash');

/**
 * Gets a user from their id in the URL.
 *
 * @param app
 * @returns {Function}
 */
function getUser(app) {

    return function(req, res) {

        const userId = _.get(req, 'params.userId');

        if (!userId) {
            return app.utils.apiResponse(res, new Error('User not found.'));
        }

        /**
         * Use our handy remember function to automatically check Redis for this data.
         * If it doesn't find it, then check the database.
         */
        app.utils.remember(app, `users:${userId}`, (callback) => {

            app.models.User.findOne({
                _id: userId
            }).exec(callback);

        }, (err, user) => {

            if (!err && !user) {
                /**
                 * There's still no user?? WTF!
                 * @type {Error}
                 */
                err = new Error('User not found.');
            }

            app.utils.apiResponse(res, err, user);
        });
    };
}

/**
 *
 * @type {getUser}
 */
module.exports = getUser;