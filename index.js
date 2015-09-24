/**
 *  MQTT to digitalSTROM Server Bridge
 *
 *  Copyright (c) 2015 Chris Gross.
 *
 **/

require("console-stamp")(console, "HH:MM:ss.l");
if (!require('./config').log) {
    // Disable console.log
    console.log = function () {
    }
}

require('./lib/bridge');


