/**
 *
 *  bridge.js
 *
 *  Date:       21.06.15
 *
 *  Author:     Chris Gross cgHome@gmx.net
 *
 *  Copyright:  Copyright © 2015 [cgHome]. All rights reserved.
 *
 *  Licence:    MIT
 *
 */
'use strict';

var _ = require('lodash'),
    mqttRegex = require("mqtt-regex"),
    config = require('../config'),
    server = require('./dss');

server.connectServer(function () {
    server.on('error', function (error) {
        console.error('%s::server: %s', config.name, error);
    });

    server.on('connect', function () {
        var interval = null;
        var client = server.connectClient();

        // Error
        client.on('error', function (error) {
            console.error('%s::client::error::%s', config.name, error);
        });

        // Connected
        client.on('connect', function () {
            server
                .login()
                // Publish
                .on('ready', function () {
                    // Init
                    console.log('%s::server::initModel', config.name);
                    config.server.initModel.forEach(function (item) {
                        server[item.fn](item.prefixTopic, item.url);
                    });
                    // Refresh
                    setTimeout(function () {
                        interval = setInterval(function () {
                            console.log('%s::server::refreshModel', config.name);
                            config.server.refreshModel.forEach(function (item) {
                                server[item.fn](item.prefixTopic, item.url);
                            });
                            server.publishOnClient(config.client.baseTopic + '/state/lastDiscovered', new Date(_.now()));
                        }, config.refreshInterval);
                    }, config.refreshInterval);
                })
                // Subscribe
                .on('ready', function () {
                    client
                        .subscribe('get/' + config.client.baseTopic + '/#')
                        .subscribe('set/' + config.client.baseTopic + '/#')
                        .on('message', function (topic, message) {
                            var payload;
                            var message = message.toString();

                            try {
                                payload = JSON.parse(message);
                                payload = _.isUndefined(payload.$value) ? payload : payload.$value;
                            } catch (e) {
                                payload = message
                            }

                            console.log('%s::server::onMessage: %s > %s', config.name, topic, payload);
                            config.server.subscriptions.some(function (item) {
                                var param = (mqttRegex(item.pattern).exec)(topic);
                                if (param) {
                                    server[item.fn](item, param, payload)
                                    return true
                                }
                                return false
                            })
                        });
                });
        });

        // Closed
        client.on('close', function () {
            if (!!interval) {
                clearInterval(interval);
                interval = null;
            }
            client.end();
        });

        console.info('%s::server::connect', config.name);
    });

    console.info(config.name + ' started...');
});