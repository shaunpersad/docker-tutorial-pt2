"use strict";

const _ = require('lodash');

/**
 * Gets a list of users.
 *
 * Allows us to search for users as well.
 * If no search term is found, we just use MongoDB.
 * If it is, use Elasticsearch to find the users.
 * Either way, we cache it!
 *
 * @param app
 * @returns {Function}
 */
function getUsers(app) {

    const limit = 1000; // max number of records to return per page.

    return function(req, res) {

        const query = _.get(req, 'query', {}); // we need this as our cache key.
        query.limit = limit;

        /**
         * Cache the results using the query as the key,
         * so repeat queries will return the cached stuff.
         */
        app.utils.remember(app, `searches:${JSON.stringify(query)}`, (callback) => {

            const search = _.get(query, 'search', '');
            const page = _.get(query, 'page', 1);
            const skip = (page - 1) * limit;

            /**
             * If we're not searching, just get stuff from the database.
             */
            if (!search) {

                return app.models.User
                    .find({})
                    .sort({
                        _id: -1
                    })
                    .skip(skip)
                    .limit(limit)
                    .exec(callback);
            }

            /**
             * Use elasticsearch for search queries.
             */
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

                /**
                 * Elasticsearch gives us a lot of garbage,
                 * so we need to reformat that to look normal.
                 */
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

