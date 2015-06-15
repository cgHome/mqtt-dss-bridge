'use strict';
/*
 *   dss.js
 */

var _ = require('lodash'),
    util = require('util'),
    events = require('events'),
    request = require('request'),
    mqtt = require('mqtt');

var config = require('../config'),
    mqttClient = mqtt.connect(config.broker.url, {keepalive: 10000});

mqttClient.on('error', function subscribed(error) {
    console.log('mqttClient:error:', error);
});

function DigitalStromServer() {
    events.EventEmitter.call(this);

    var self = this;

    this.token = '';
    this.dss = request.defaults({baseUrl: config.dss.url + '/json', json: true});

    // Login
    this.dss.get('/system/loginApplication?loginToken=' + config.dss.appToken, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            self.token = body.result.token;
            console.log('dss::login::successful::', self.token);
            self.emit('ready')
        } else {
            self.emit('error', new Error('dss::login::failed::', response.statusCode, '::', error, '::', dss.appToken))
        }
    });
};
util.inherits(DigitalStromServer, events.EventEmitter);

DigitalStromServer.prototype._publishData = function (topic, value) {
    var self = this;

    _.forOwn(value, function (value, key) {
        if (typeof value === 'object') {
            var key = value.dSUID || value.name || key;
            self._publishData(topic + '/' + key, value)
        } else {
            //console.log('dss::publish::', topic + '/' + key, '::', value);
            mqttClient.publish(topic + '/' + key, value)
        }
    });
};

DigitalStromServer.prototype.publish = function (baseURL) {
    var self = this;
    var url = baseURL;

    // Set appToken
    if (url.indexOf('?') < 0) {
        url = url + '?';
    } else {
        url = url + '&';
    }
    url = url + 'token=' + this.token;

    return this.dss.get(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            self._publishData(config.broker.baseTopic, body.result)
        } else {
            self.emit('error', new Error('dss::error::', response.statusCode, '::', error, '::', url))
        }
    })
};

module.exports = DigitalStromServer;