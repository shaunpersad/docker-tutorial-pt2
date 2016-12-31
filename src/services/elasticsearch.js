"use strict";

const async = require('async');
const elasticsearch = require('elasticsearch');

/**
 * Our schema for Elasticsearch
 *
 * @param client
 * @param callback
 */
function createUserIndex(client, callback) {

    client.indices.exists({
        index: 'docker-tutorial'
    }, (err, exists) => {

        if (exists || err) {
            return callback(err, false);
        }

        client.indices.create({
            index: 'docker-tutorial',
            body: {
                settings: {
                    number_of_shards: 1,
                    analysis: {
                        filter: {
                            autocomplete_filter: {
                                type: 'edge_ngram',
                                min_gram: 1,
                                max_gram: 20
                            }
                        },
                        analyzer: {
                            autocomplete: {
                                type: 'custom',
                                tokenizer: 'standard',
                                filter: [
                                    'lowercase',
                                    'autocomplete_filter'
                                ]
                            }
                        }
                    }
                },
                mappings: {
                    users: {
                        properties: {
                            firstName: {
                                type: 'text',
                                analyzer: 'autocomplete',
                                search_analyzer: 'standard'
                            },
                            lastName: {
                                type: 'text',
                                analyzer: 'autocomplete',
                                search_analyzer: 'standard'
                            },
                            firstNameStrict: {
                                type: 'keyword'
                            },
                            lastNameStrict: {
                                type: 'keyword'
                            },
                            fullName: {
                                type: 'text',
                                analyzer: 'autocomplete',
                                search_analyzer: 'standard'
                            }
                        }
                    }
                }
            }
        }, (err) => {
            callback(err, true);
        });
    });
}

/**
 * Attempt to connect.
 *
 * @param callback
 */
function setupElasticsearch(callback) {

    console.log('Attempting to connect to Elasticsearch.');

    /**
     * P.S. It's okay that we've hard-coded the 9200 port.
     * With Docker, we can forward to that port from any other port.
     */
    const client = new elasticsearch.Client({
        host: 'tutorial-elasticsearch:9200', // Docker allows our service name to act as the URL to connect to that container!
        log: []
    });

    async.waterfall([
        (next) => {
            client.ping({
                // ping usually has a 3000ms timeout
                requestTimeout: Infinity
            }, (err) => {
                if (!err) {
                    // we're connected!
                    console.log('Connected to Elasticsearch.');
                }
                next(err, client);
            });
        },
        (client, next) => {

            createUserIndex(client, (err, created) => {

                if (created) {
                    console.log('Created Map.');
                }
                next(err, client);
            });
        }
    ], callback);
}

/**
 *
 * @type {setupElasticsearch}
 */
module.exports = setupElasticsearch;