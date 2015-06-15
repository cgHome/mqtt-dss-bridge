'use strict';
/*
 *   bridge.js
 */

var config = require('../config'),
    DigitalStromServer = require('./dss'),
    dSS = new DigitalStromServer();

dSS.on('error', function error(error) {
    console.log(error.message)
});

/*
 *  Publish
 */

dSS.on('ready', function ready() {
    console.log('dssBridge::publish::ready');

    // Init
    dSS.publish('/apartment/getStructure');

    /*
    // Refresh
     setInterval(function () {
        dSS.publish('/apartment/getStructure');
     }, config.baseRefreshInterval * 5);

     setInterval(function () {
     }, config.baseRefreshInterval);
     */
});

/*
 *  Commander
 */

dSS.on('ready', function ready() {
    console.log('dssBridge::commander::ready');
});
