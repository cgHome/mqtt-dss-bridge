/**
 *
 *  dss.js
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
        payload: new Buffer('{"$value": "false"}'),
        qos: 1,
        retain: true
    }
};

var serverSettings = {
    baseUrl: config.server.url + '/json',
    json: true
};

function DigitalStromServer() {
    var self = this;

    events.EventEmitter.call(self);

    self.client = null;
    self.server = request.defaults(serverSettings);
    self.token = '';
    self.metaData = {};
    self.deltaCache = {};
}
util.inherits(DigitalStromServer, events.EventEmitter);


DigitalStromServer.prototype.connectClient = function () {
    var self = this;

    if (!self.client) {
        self.client = mqtt.connect(config.client.url, clientSettings);
    }
    return self.client
};

DigitalStromServer.prototype.connectServer = function (callback) {
    var self = this;

    callback();
    self.emit('connect');
};

DigitalStromServer.prototype.login = function () {
    var self = this;

    self.server.get('/system/loginApplication?loginToken=' + config.server.appToken,
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body.ok) {
                    self.token = body.result.token;
                    console.info('%s::dss::login::successful::%s', config.name, self.token);
                    self.publishOnClient(config.client.baseTopic + '/state/online', true);
                    self.emit('ready');
                } else {
                    console.error('%s::dss::login::dssError: %s appToken: %s', config.name, body.message, config.server.appToken);
                }
            } else {
                self.emit('error', new Error(util.format('login: %s', error.code)));
            }
        });

    return self;
};

DigitalStromServer.prototype.publishOnClient = function (topic, message) {
    var self = this;

    var payload = _.isString(message) ? message :
        _.isObject(message) ? JSON.stringify(message) : JSON.stringify({'$value': message});

    if (self.deltaCache[topic] !== payload) {
        console.log('%s::client::publish %s %s', config.name, topic, payload);

        self.deltaCache[topic] = payload;
        self.client.publish(topic, payload, {qos: 1, retain: true});
    }
};

DigitalStromServer.prototype.publish = function (prefixTopic, url) {
    var self = this;

    self._sendToServer(url, function (result) {
        console.log('%s::server::publish: %s', config.name, url);
        self._publishValueKeyMessage(config.client.baseTopic + prefixTopic, self._refactorObject(result))
    });
};

DigitalStromServer.prototype.publishMissingValues = function (prefixTopic, url) {
    var self = this;

    //self.publishOnClient(config.client.baseTopic + '/apartment/lastCalledScene', 0);
};

DigitalStromServer.prototype.setApartmentScene = function (sub, param, value) {
    var self = this;
    var url = util.format(sub.url, value);

    self._sendToServer(url, function (result) {
        console.info('%s::server::setApartmentScene: %s', config.name, url);
    });
};

DigitalStromServer.prototype.setGroupScene = function (sub, param, value) {
    var self = this;
    var url = util.format('/property/query?query=/apartment/zones/*(ZoneID,name)');

    self._getMetaData(url, function (result) {
        var zoneID = _.result(_.find(result.zones, 'name', param.zone), 'ZoneID');
        var url = util.format(sub.url, zoneID, param.groupID, value);

        self._sendToServer(url, function (result) {
            console.info('%s::server::setGroupScene: %s', config.name, url);
        });
    });
};

DigitalStromServer.prototype.setDeviceScene = function (sub, param, value) {
    var self = this;
    var url = util.format(sub.url, param.dSID, value);

    console.warn('%s::server::setDeviceScene: %s', config.name, url);
    //self._sendToServer(url);
};

DigitalStromServer.prototype.setDeviceOn = function (sub, param, value) {
    var self = this;
    var url = value ? util.format(sub.url, param.dSID, '5') : util.format(sub.url, param.dSID, '0');

    self._sendToServer(url, function (result) {
        console.info('%s::server::setDeviceOn: %s', config.name, url);
    });
};

DigitalStromServer.prototype.getDeviceValue = function (sub, param) {
    var self = this;
    var url = util.format(sub.url, param.dSID);
    console.warn('%s::server::getDeviceValue: %s', config.name, url);
/*
    self._sendToServer(url, function (result) {
        console.info('%s::server::getDeviceValue: %s', config.name, url);
    });
*/
};

DigitalStromServer.prototype._getMetaData = function (url, fn) {
    var self = this;

    // Info: For performance reason ;-) !!
    if (self.metaData[url]) {
        fn(self.metaData[url])
    } else {
        self._sendToServer(url, function (result) {
            self.metaData[url] = result;
            fn(result)
        });
    }
};

DigitalStromServer.prototype._sendToServer = function (url, fn) {
    var self = this;
    var lFn = fn || function () {
        };
    var lUrl = (url.indexOf('?') < 0 ? url + '?' : url + '&') + 'token=' + self.token;

    self.server.get(lUrl, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            if (body.ok) {
                lFn(body.result)
            } else {
                console.error('%s::dss::send::error: %s url: %s', config.name, body.message, lUrl);
            }
        } else {
            self.emit('error', new Error(util.format('get: %s', error)));
        }
    })
};

DigitalStromServer.prototype._refactorObject = function (object) {
    var self = this;
    var nObject = {};

    _.forOwn(object, function (value, key) {
        var nKey = key;
        var nValue = value;

        if (_.isObject(value)) {
            // Fix dss-Api : Device-Id == dSID
            nKey = value.hasOwnProperty('id') ? value.id :
                value.hasOwnProperty('dSID') ? value.dSID :
                    value.hasOwnProperty('group') ? value.group :
                        value.hasOwnProperty('scene') ? value.scene :
                            value.hasOwnProperty('name') && !_.isEmpty(value.name) ? value.name :
                                value.hasOwnProperty('ZoneID') ? value.ZoneID :
                                    nKey;
            nKey = nKey.toString();

            nValue = self._refactorObject(value);
        }
        nObject[nKey] = nValue;

    }, nObject);

    return nObject;
};

DigitalStromServer.prototype._publishValueKeyMessage = function (topic, value) {
    var self = this;

    _.forOwn(value, function (value, key) {
        if (!_.isUndefined(value)) {
            if (_.isObject(value)) {
                self._publishValueKeyMessage(topic + '/' + key, value);
            } else {
                self.publishOnClient(topic + '/' + key, value);
            }
        }
    });
};

module.exports = new DigitalStromServer;