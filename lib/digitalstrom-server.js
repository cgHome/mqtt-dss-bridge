'use strict';

// ToDo: Temp dSS using a self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

var _ = require('lodash'),
    util = require('util'),
    events = require('events'),
    request = require('request'),
    mqtt = require('mqtt');

var config = require('../config'),
    mqttClient = mqtt.connect(config.brokerUrl, {keepalive: 10000});


function DigitalStromServer() {
    events.EventEmitter.call(this);

    var self = this;

    this.token = '';
    this.dss = request.defaults({baseUrl: config.dssUrl + '/json', json: true});

    // Login
    this.dss.get('/system/loginApplication?loginToken=' + config.dssAppToken, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            self.token = body.result.token;
            console.log('dSS - login succesful:', self.token);
            self.emit('ready')
        } else {
            self.emit('error', new Error('dSS login failed: ', response.statusCode, ' ', error, 'AppToken: ', dssAppToken))
        }
    });
};
util.inherits(DigitalStromServer, events.EventEmitter);

DigitalStromServer.prototype._publishData = function (topic, value) {
    var self = this;

    _.forOwn(value, function (value, key) {
        if (typeof value === 'object') {
            self._publishData(topic + '/' + key, value)
        } else {
            console.log('MQTT-Publish:', topic + '/' + key, '-', value);
            //mqttClient.publish(topic + '/' + key, value)
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
            self._publishData(config.baseTopic, body.result)
        } else {
            self.emit('error', new Error('dSS-Error: ', response.statusCode, ' ', error, ' ', url))
        }
    })
};

module.exports = DigitalStromServer;
