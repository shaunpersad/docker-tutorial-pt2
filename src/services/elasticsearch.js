"use strict";

const async = require('async');
const elasticsearch = require('elasticsearch');

/**
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
 *
 * @param callback
 */
function setupElasticsearch(callback) {

    console.log('Setting up Elasticsearch.');

    const client = new elasticsearch.Client({
        host: 'tutorial-elasticsearch:9200',
        //log: 'info'
    });

    async.waterfall([
        (next) => {
            client.ping({
                // ping usually has a 3000ms timeout
                requestTimeout: Infinity
            }, (err) => {
                // we're connected!
                console.log('Connected to Elasticsearch.');
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