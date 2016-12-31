"use strict";

const redis = require('redis');

/**
 *
 * @param callback
 */
function setupRedis(callback) {

    console.log('Setting up Redis.');

    const client = redis.createClient(6379, 'tutorial-redis');

    client.once('error', callback);

    client.once('ready', () => {
        // we're connected!
        console.log('Connected to Redis.');
        callback(null, client);
    });
}

/**
 *
 * @type {setupRedis}
 */
module.exports = setupRedis;