/**
 *
 *  bridge.js
 *
 *  Date:       21.06.15
 *
 *  Author:     Chris Gross cgHome@gmx.net
 *
 *  Copyright:  [cgHome] © 2015
 *
 *  Licence:    MIT
 *
 */
'use strict';

var util = require('util'),
    server = require('./dss'),
    config = require('../config');

server.connectServer(function () {
    server.on('error', function (error) {
        console.log('%s::server::error %s', config.name, error);
    });

    server.on('connect', function () {
        var interval = null;
        var client = server.connectClient();

        // Error
        client.on('error', function (error) {
            console.log('%s::client::error::%s', config.name, error);
        });

        // Publisher
        client.on('connect', function () {
            server
                .login()
                .on('ready', function () {
                    if (config.trace)
                        console.log('%s::server::initModel', config.name);

                    config.server.initModel.forEach(function (item) {
                        server.publish(item.prefixTopic, item.url);
                    });

                    setTimeout(function () {
                        interval = setInterval(function () {
                            if (config.trace)
                                console.log('%s::server::refreshModel', config.name);
                            config.server.refreshModel.forEach(function (item) {
                                server.publish(item.prefixTopic, item.url);
                            });
                        }, config.refreshInterval);
                    }, config.refreshInterval);
                });
        });

        client.on('close', function () {
            if (!interval) return;

            clearInterval(interval);
            interval = null;
        });

        // Commander
        client.on('connect', function () {
            // Subscribe commands (.../set, dss/cmd/...)
        });

        console.log('%s::server::connect', config.name);
    });

    console.log(config.name + ' started...');
});