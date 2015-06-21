/**
 *
 *  test-client.js
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

require("console-stamp")(console, "HH:MM:ss.l");

var mqtt = require('mqtt'),
    config = require('../config');

var client = mqtt.connect(config.client.url, {
    //clean: false,
    clientId: 'testClient'
});

client.on('error', function (error) {
    console.log('%s::client::error::%s', config.name, error);
});

client
    .subscribe(config.client.baseTopic + '/#', {qos: 2})
    .on('message', function (topic, message, packet) {
        console.log('testClient::message %s::%s', topic,  message.toString());
    });

console.log('testClient started...');