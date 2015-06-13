'use strict';
var config = require('../config'),
    DigitalStromServer = require('./digitalstrom-server'),
    dSS = new DigitalStromServer();

dSS.on('error', function error(error) {
    console.log(error.message)
});

/*
 *  Publish
 */

dSS.on('ready', function ready() {
    console.log('dSS - publish ready');

    dSS.publish('/apartment/getStructure');

    /*
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
    console.log('dSS - commander ready');
});
