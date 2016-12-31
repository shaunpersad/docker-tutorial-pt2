"use strict";

const _ = require('lodash');
const async = require('async');
const mongoose = require('mongoose');

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

UserSchema.index({
    firstName: 1,
    lastName: 1
}, {
    unique: true
});

// TODO: Transform these errors to better ones.

UserSchema.post('save', function(err, doc, next) {

    if (err.name === 'MongoError' && err.code === 11000) {

        next(err);

    } else if (err.name === 'ValidationError') {

        next(err);

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

    UserSchema.post('save', function(user, done) {

        async.series([
            (next) => {
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
                app.services.redis.del(`users:${user.id}`, next);
            },
            (next) => {
                app.utils.unRemember(app, 'searches*', next);
            }
        ], done);
    });

    UserSchema.pre('remove', function(next) {

        app.services.elasticsearch.delete({
            index: 'docker-tutorial',
            id: this.id,
            type: 'users'
        }, next);
    });

    return mongoose.model('User', UserSchema);
}

/**
 *
 * @type {getUserModel}
 */
module.exports = getUserModel;