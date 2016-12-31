"use strict";

const _ = require('lodash');
const async = require('async');

const successfulServices = {};

/**
 *
 * @param services
 * @param config
 * @param callback
 */
function healthCheck(services, config, callback) {

    const numTries = _.get(config, 'numTries', 10);
    const interval = _.get(config, 'interval', 1000);

    async.eachSeries(Object.keys(services), (service, callback) => {

        if (successfulServices[service]) {

            return callback(null);
        }

        const getService = services[service];
        let lastestError = null;
        let count = 0;

        async.whilst(
            () => {

                return !count || (lastestError && count <= numTries);
            },
            (callback) => {

                count++;

                setTimeout(() => {

                    lastestError = null;

                    getService((err, successfulService) => {

                        lastestError = err;
                        if (!err && successfulService) {
                            successfulServices[service] = successfulService;
                        }

                        callback(null, successfulService);
                    });
                }, interval);
            },
            (err) => {

                if (lastestError) {
                    err = lastestError
                }

                callback(err);
            }
        );

    }, (err) => {

        callback(err, successfulServices);
    });
}

/**
 *
 * @type {healthCheck}
 */
module.exports = healthCheck;
