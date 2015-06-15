/*
 *   Configuration
 */

// ToDo: Temp dSS using a self-signed certificate
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

module.exports = {
    // Internal
    baseRefreshInterval: 5000,

    broker: {
        url: 'mqtt://localhost:1883',
        baseTopic: 'dss',
    },
    dss: {
        // DigitalSTROM-Server
        url: 'https://dss.local:8080',
        // Obtaining dssAppToken: https://dss.local:8080/json/system/requestApplicationToken?applicationName=mqttBridge
        appToken: 'e840aba0336717f7d4b4d9c7d638d055a5308cfde99b54cccb143175cac48d9c',
    }
};