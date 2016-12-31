"use strict";

const _ = require('lodash');

/**
 * Gets a user from their id in the URL, then edits them.
 *
 * @param app
 * @returns {Function}
 */
function editUser(app) {

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

            const props = _.get(req, 'body', {});

            _.assign(user, _.pick(props, ['firstName', 'lastName']));

            user.save((err) => {

                app.utils.apiResponse(res, err, user);
            });
        });
    };
}

/**
 *
 * @type {editUser}
 */
module.exports = editUser;
