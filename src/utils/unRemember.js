"use strict";
const _ = require('lodash');
/**
 *
 * @param app
 * @param {string} prefix
 * @param {function} callback
 */
function unRemember(app, prefix, callback) {

    app.services.redis.keys(prefix, (err, keys) => {

        if (err) {
            return callback(err);
        }

        const commands = _.map(keys, (key) => {

            return ['del', key];
        });

        app.services.redis.multi(commands).exec(callback);
    });
}

/**
 *
 * @type {unRemember}
 */
module.exports = unRemember;