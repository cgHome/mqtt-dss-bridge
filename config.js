/**
 *
 *  config.js
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
'use strict'

// ToDo: Temp dSS using a self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var dssTopic = 'dss';

var dssAPI = {
    initModel: '/property/query?query=/apartment/*/*(*,ZoneID,name,powerConsumption,energyMeterValue)/groups/*(*,lastCalledScene)/scenes/*(*)',
    initDevice: '/apartment/getDevices',
    initGroupDevice: '/property/query?query=/apartment/*/*(*,ZoneID,name,powerConsumption,powerConsumptionAge)/groups/*(group,name,valid,lastCalledScene)/devices/*(dSID)',

    refreshModel: '/property/query?query=/apartment/*/*(ZoneID,dSID,name,powerConsumption,powerConsumptionAge)/groups/*(group,name,valid,lastCalledScene)',
    refreshDevice: '/apartment/getDevices',

    // Get Value

    // Set Value
    setApartmentScene: '/apartment/callScene?sceneNumber=%s&force=true',
    setZoneScene: '/zone/callScene?id=%s&sceneNumber=%s&force=true',
    setGroupScene: '/zone/callScene?id=%s&groupID=%s&sceneNumber=%s&force=true',
    setDeviceScene: '/device/callScene?dsid=%s&sceneNumber=%s&category=manual',
    setDeviceValue: '/device/setConfig?&dsuid=%1&class=%2&index=%3&value=%4&category=manual'
};

var config = {
    log: false,
    //log: true,

    // Common
    name: 'dssBridget',
    refreshInterval: 5000,

    // MQTT-Client
    client: {
        url: 'mqtt://127.0.0.1:1883',
        baseTopic: dssTopic
    },

    // DigitalSTROM-Server
    server: {
        // Important: use IP-Address for performance reason
        url: 'https://192.168.1.5:8080',
        //url: 'https://192.168.1.47:8080',

        /** Obtaining appToken: https://dss.local:8080/json/system/requestApplicationToken?applicationName=dssBridget **/
        appToken: 'e840aba0336717f7d4b4d9c7d638d055a5308cfde99b54cccb143175cac48d9c',

        initModel: [
            {fn: 'publish', prefixTopic: '/apartment', url: dssAPI.initModel},
            {fn: 'publish', prefixTopic: '/apartment/devices', url: dssAPI.initDevice},
            {fn: 'publish', prefixTopic: '/apartment', url: dssAPI.initGroupDevice},
            {fn: 'publishMissingValues', prefixTopic: '/apartment', url: dssAPI.initGroupDevice},
        ],
        refreshModel: [
            {fn: 'publish', prefixTopic: '/apartment', url: dssAPI.refreshModel},
            {fn: 'publish', prefixTopic: '/apartment/devices', url: dssAPI.refreshDevice}
        ],

        subscriptions: [
            {
                pattern: 'set/' + dssTopic + '/apartment/zones/0/groups/+groupID/lastCalledScene',
                fn: 'setApartmentScene',
                url: dssAPI.setApartmentScene
            },
            {
                pattern: 'set/' + dssTopic + '/apartment/zones/+zone/groups/+groupID/lastCalledScene',
                fn: 'setGroupScene',
                url: dssAPI.setGroupScene
            },
            {
                pattern: 'set/' + dssTopic + '/apartment/devices/+dSID/on',
                fn: 'setDeviceOn',
                url: dssAPI.setDeviceScene
            },
            {
                pattern: 'set/' + dssTopic + '/apartment/devices/+dSID/value',
                fn: 'setDeviceScene',
                url: dssAPI.setDeviceValue
            }
        ]
    }
};
module.exports = config;