"use strict";

/**
 * Libraries
 */
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

/**
 * API
 */
const createUser = require('./src/api/createUser');
const editUser = require('./src/api/editUser');
const getUser = require('./src/api/getUser');
const getUsers = require('./src/api/getUsers');
const removeUser = require('./src/api/removeUser');

/**
 * Models
 */
const getUserModel = require('./src/models/getUserModel');

/**
 * Services
 */

const services = {
    elasticsearch: require('./src/services/elasticsearch'),
    mongo: require('./src/services/mongo'),
    redis: require('./src/services/redis')
};

/**
 * Utils
 */
const utils = {
    apiResponse: require('./src/utils/apiResponse'),
    healthCheck: require('./src/utils/healthCheck'),
    remember: require('./src/utils/remember'),
    unRemember: require('./src/utils/unRemember')
};

/**
 * Express!
 */
const app = express();

/**
 * Wait for MongoDB, Elasticsearch, and Redis to start before proceeding.
 */
utils.healthCheck(services, {}, (err, services) => {

    /**
     * If there's still an error even after waiting,
     * something terrible has happened and we should not continue.
     */
    if (err) {
        throw err;
    }

    /**
     * We need these middlewares to be able to parse our incoming POST API requests.
     */
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    /**
     * Set all our src stuff to the app object, so we can just pass that around.
     */
    app.services = services;
    app.utils = utils;
    app.models = {
        User: getUserModel(app)
    };

    /**
     * Modularize the API routes as a separate router.
     */
    const usersApi = express.Router();

    usersApi.post('/create', createUser(app));
    usersApi.put('/:userId/edit', editUser(app));
    usersApi.post('/:userId/edit', editUser(app)); // for browsers
    usersApi.delete('/:userId/remove', removeUser(app));
    usersApi.post('/:userId/remove', removeUser(app)); // for browsers
    usersApi.get('/:userId', getUser(app));
    usersApi.get('/', getUsers(app));

    app.use('/users', usersApi);

    app.get('/', (req, res) => {
        res.send('Hello World!')
    });

    app.listen(8080, () => {
        console.log('Listening on 8080.');
    });
});