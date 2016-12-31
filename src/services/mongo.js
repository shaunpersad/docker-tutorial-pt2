"use strict";

const mongoose = require('mongoose');

/**
 *
 * @param callback
 */
function setupMongo(callback) {

    console.log('Setting up MongoDB.');

    mongoose.connect('mongodb://tutorial-mongo/docker_tutorial:27017');
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