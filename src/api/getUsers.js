"use strict";
const _ = require('lodash');

/**
 *
 * @param app
 * @returns {Function}
 */
function getUsers(app) {

    const limit = 1000;

    return function(req, res) {

        const query = _.get(req, 'query', {});
        query.limit = limit;

        app.utils.remember(app, `searches:${JSON.stringify(query)}`, (callback) => {

            const search = _.get(query, 'search', '');
            const page = _.get(query, 'page', 1);
            const skip = (page - 1) * limit;

            if (!search) {

                return app.models.User
                    .find({})
                    .skip(skip)
                    .limit(limit)
                    .exec(callback);
            }

            app.services.elasticsearch.search({
                index: 'docker-tutorial',
                type: 'users',
                body: {
                    query: {
                        bool: {
                            should: [
                                {
                                    match: {
                                        firstName: {
                                            query: search
                                        }
                                    }
                                },
                                {
                                    match: {
                                        lastName: {
                                            query: search
                                        }
                                    }
                                },
                                {
                                    match: {
                                        fullName: {
                                            query: search
                                        }
                                    }
                                }
                            ]
                        }
                    },
                    from: skip,
                    size: limit
                }
            }, (err, results) => {

                const users = _.get(results, 'hits.hits', []);

                callback(err, _.map(users, (user) => {

                    return {
                        _id: user._id,
                        firstName: _.get(user, '_source.firstName'),
                        lastName: _.get(user, '_source.lastName')
                    };
                }));
            });

        }, (err, users) => {

            app.utils.apiResponse(res, err, users);
        });
    };
}

/**
 *
 * @type {getUsers}
 */
module.exports = getUsers;

