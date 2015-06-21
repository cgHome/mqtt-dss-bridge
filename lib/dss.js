/**
 *
 *  dss.js
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

var _ = require('lodash'),
    util = require('util'),
    events = require('events'),
    request = require('request'),
    mqtt = require('mqtt'),
    config = require('../config');

var clientSettings = {
    keepalive: 10,
    clientId: config.name,
    will: {
        topic: config.client.baseTopic + '/state/online',
        payload: new Buffer('{"value": "false"}'),
        qos: 1,
        retain: true
    }
};

function DigitalStromServer() {
    var self = this;

    events.EventEmitter.call(self);

    self.client = null;
    self.token = '';
    self.dss = request.defaults({baseUrl: config.server.url + '/json', json: true});
};
util.inherits(DigitalStromServer, events.EventEmitter);


DigitalStromServer.prototype.connectServer = function (callback) {
    var self = this;
    callback();
    self.emit('connect');
};

DigitalStromServer.prototype.connectClient = function () {
    var self = this;

    if (!self.client) {
        self.client = mqtt.connect(config.client.url, clientSettings);
    }
    return self.client
};

DigitalStromServer.prototype.login = function () {
    var self = this;

    self.dss.get('/system/loginApplication?loginToken=' + config.server.appToken, function (error, response, body) {
        if (error || response.statusCode != 200) {
            self.emit('error', new Error(util.format('dss::error::%s::%s::%s', config.name, response.statusCode, error, config.server.appToken)));
        } else {
            self.token = body.result.token;
            self._publishOnClient(config.client.baseTopic + '/state/online', {value: true})

            console.log('%s::dss::login::successful::%s', config.name, self.token);
            self.emit('ready');
        }
    });
    return self;
};

DigitalStromServer.prototype.publish = function (prefixTopic, url) {
    var self = this;

    var prefixTopic = config.client.baseTopic + prefixTopic,
        url = (url.indexOf('?') < 0 ? url + '?' : url + '&') + 'token=' + this.token;


    self.dss.get(url, function (error, response, body) {
        if (error || response.statusCode != 200) {
            var statusCode = response.statusCode || 0;
            return self.emit('error', new Error(util.format('dss::error %s %s %s', response.statusCode, error, url)));
        }

        self._publishOnClient(config.client.baseTopic + '/state/lastDiscovered', {value: new Date(Date.now())});
        self._publishData(prefixTopic, body.result)
    })
};

DigitalStromServer.prototype._publishData = function (topic, value) {
    var self = this;

    _.forOwn(value, function (value, key) {
        if (typeof value === 'object') {
            var key = value.dSUID || value.name || key;
            self._publishData(topic + '/' + key, value)
        } else {
            var message = {value: value};
            self._publishOnClient(topic + '/' + key, message);
        }
    });
};

DigitalStromServer.prototype._publishOnClient = function (topic, message) {
    var self = this;

    var message = typeof message == 'string' ? message : JSON.stringify(message);

    if (config.trace)
        console.log('%s::server::publish %s %s', config.name, topic, message);

    self.client.publish(topic, message, {qos: 1, retain: true});
};

module.exports = new DigitalStromServer;