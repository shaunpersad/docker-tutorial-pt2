"use strict";

const _ = require('lodash');
const async = require('async');
const mongoose = require('mongoose');


/**
 * Here's where we define our user database model.
 * We also have our model events here,
 * which are invaluable in synchronizing our data between MongoDB, Elasticsearch, and Redis.
 * Without these events, all is lost.
 * Luckily, we have them, so each call to create, update, or remove a user is automatically
 * reflected in all three services.
 */
const UserSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        index: true
    },
    lastName: {
        type: String,
        required: true,
        index: true
    }
});

/**
 * Only unique people plz.
 */
UserSchema.index({
    firstName: 1,
    lastName: 1
}, {
    unique: true
});

/**
 * Convert mongo errors to nicer errors.
 */
UserSchema.post('save', function(err, doc, next) {

    if (err.name === 'MongoError' && err.code === 11000) {

        next(new Error('This user already exists.'));

    } else if (err.name === 'ValidationError') {

        next(new Error('Please fill out all fields.'));

    } else {
        next(err);
    }
});

/**
 *
 * @param app
 * @returns {*}
 */
function getUserModel(app) {

    /**
     * Each time a new user is successfully created or updated,
     * put them into Elasticsearch, and also delete all caches.
     */
    UserSchema.post('save', function(user, done) {

        async.series([
            (next) => {
                /**
                 * Put them in ES!
                 */
                app.services.elasticsearch.index({
                    index: 'docker-tutorial',
                    type: 'users',
                    id: user.id,
                    body: {
                        firstName: user.firstName,
                        lastName: user.lastName,
                        fullName: `${user.firstName} ${user.lastName}`,
                        firstNameStrict: user.firstName,
                        lastNameStrict: user.lastName
                    }
                }, next);
            },
            (next) => {
                /**
                 * Delete that specific user's entry from Redis.
                 */
                app.services.redis.del(`users:${user.id}`, next);
            },
            (next) => {
                /**
                 * Delete all search results from Redis.
                 */
                app.utils.unRemember(app, 'searches*', next);
            }
        ], done);
    });

    /**
     * If a user is removed from the database,
     * remove them from Elasticsearch and Redis as well plz.
     */
    UserSchema.post('remove', function(user, done) {

        async.series([
            (next) => {
                /**
                 * Get them out of ES!
                 */
                app.services.elasticsearch.delete({
                    index: 'docker-tutorial',
                    id: user.id,
                    type: 'users'
                }, next);
            },
            (next) => {
                /**
                 * Delete that specific user's entry from Redis.
                 */
                app.services.redis.del(`users:${user.id}`, next);
            },
            (next) => {
                /**
                 * Delete all search results from Redis.
                 */
                app.utils.unRemember(app, 'searches*', next);
            }
        ], done);
    });

    return mongoose.model('User', UserSchema);
}

/**
 *
 * @type {getUserModel}
 */
module.exports = getUserModel;