/**
 *
 *  config.js
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

// ToDo: Temp dSS using a self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var dssAPI = {
    initModel: '/property/query?query=/apartment/*/*(*,ZoneID,powerConsumption,energyMeterValue)/groups/*(*,lastCalledScene)/scenes/*(*)',
    initDevice: '/apartment/getDevices',
    initGroupDevice: '/property/query?query=/apartment/*/*(*,ZoneID,powerConsumption,powerConsumptionAge)/groups/*(group,lastCalledScene)/devices/*(dSID)',

    refreshModel: '/property/query?query=/apartment/*/*(ZoneID,dSID,powerConsumption,powerConsumptionAge)/groups/*(group,lastCalledScene)',
    refreshDevice: '/apartment/getDevices',
}

module.exports = {
    trace: false,
    // Common
    name: 'dssBridget',
    refreshInterval: 5000,
    // MQTT-Client
    client: {
        url: 'mqtt://localhost:1883',
        baseTopic: 'dss'
    },
    // DigitalSTROM-Server
    server: {
        url: 'https://dss.local:8080',
        // Obtaining appToken: https://dss.local:8080/json/system/requestApplicationToken?applicationName=dssBridget
        appToken: 'e840aba0336717f7d4b4d9c7d638d055a5308cfde99b54cccb143175cac48d9c',
        initModel: [
            {prefixTopic: '/apartment', url: dssAPI.initModel},
            {prefixTopic: '/apartment/devices', url: dssAPI.initDevice},
            {prefixTopic: '/apartment', url: dssAPI.initGroupDevice},
        ],
        refreshModel: [
            {prefixTopic: '/apartment', url: dssAPI.refreshModel},
            {prefixTopic: '/apartment/devices', url: dssAPI.refreshDevice}
        ],
    }
};