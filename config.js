/*
*   Configuration
*/
module.exports = {
    // DigitalSTROM-Server
    dssUrl: 'https://dss.local:8080',
    // Obtaining dssAppToken: https://dss.local:8080/json/system/requestApplicationToken?applicationName=mqttBridge
    dssAppToken: 'e840aba0336717f7d4b4d9c7d638d055a5308cfde99b54cccb143175cac48d9c',

    // MQTT-Client
    brokerUrl: 'mqtt://localhost:1883',
    baseTopic: 'dSS',

    // Internal
    baseRefreshInterval: 5000,
};