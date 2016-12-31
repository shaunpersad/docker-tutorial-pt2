"use strict";

/**
 * Libraries
 */
const _ = require('lodash');
const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');

/**
 * API
 */
const createUser = require('./src/api/createUser');
const getUser = require('./src/api/getUser');
const getUsers = require('./src/api/getUsers');

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
 * Setup web server
 */

/**
 * {{services:{elasticsearch:*, mongo:*, redis:*}, utils:{apiResponse:*,healthCheck:*,rememberSearch:*}, models:{User:*}}}
 */
const app = express();

utils.healthCheck(services, {}, (err, services) => {

    if (err) {
        throw err;
    }

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());

    app.services = services;
    app.utils = utils;
    app.models = {
        User: getUserModel(app)
    };

    const usersApi = express.Router();

    usersApi.get('/:userId', getUser(app));
    usersApi.get('/', getUsers(app));
    usersApi.post('/', createUser(app));

    app.use('/users', usersApi);

    app.get('/', (req, res) => {
        res.send('Hello World!')
    });

    app.listen(8080, () => {
        console.log('listening on', 8080);
    });
});