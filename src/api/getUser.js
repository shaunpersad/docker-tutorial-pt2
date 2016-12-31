"use strict";

/**
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

        app.utils.remember(app, `users:${userId}`, (callback) => {

            app.models.User.findOne({
                _id: userId
            }).exec(callback);

        }, (err, user) => {

            app.utils.apiResponse(res, err, user);
        });
    };
}

/**
 *
 * @type {getUser}
 */
module.exports = getUser;