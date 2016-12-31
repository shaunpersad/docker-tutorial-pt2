"use strict";

const redis = require('redis');

/**
 * Attempt to connect.
 *
 * @param callback
 */
function setupRedis(callback) {

    console.log('Attempting to connect to Redis.');

    const client = redis.createClient({
        host: 'tutorial-redis' // Docker allows our service name to act as the URL to connect to that container!
    });

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