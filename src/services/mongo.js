"use strict";

const mongoose = require('mongoose');

/**
 * Attempt to connect.
 *
 * Isn't that all any of us are really trying to do?
 *
 * @param callback
 */
function setupMongo(callback) {

    console.log('Attempting to connect to MongoDB.');

    mongoose.connect('mongodb://tutorial-mongo/docker_tutorial'); // Docker allows our service name to act as the URL to connect to that container!
    mongoose.connection.once('error', callback);
    mongoose.connection.once('open', () => {
        // we're connected!
        console.log('Connected to MongoDB.');
        callback(null, mongoose.connection);
    });
}

/**
 *
 * @type {setupMongo}
 */
module.exports = setupMongo;