"use strict";

const async = require('async');

const expires = 60 * 5; // 5 min

/**
 *
 * @param app
 * @param {string} key
 * @param {function} getValue
 * @param {function} callback
 */
function remember(app, key, getValue, callback) {

    app.services.redis.get(key, (err, value) => {

        if (err) {
            return callback(err, null);
        }

        if (value !== undefined && value !== null) {

            return callback(err, JSON.parse(value));
        }

        getValue((err, value) => {

            if (err) {

                return callback(err, value);
            }

            async.series([
                (next) => {
                    app.services.redis.set(key, JSON.stringify(value), next);
                },
                (next) => {
                    app.services.redis.expire(key, expires, next);
                }
            ], (err) => {

                callback(err, value);
            });
        });

    });
}

/**
 *
 * @type {remember}
 */
module.exports = remember;
