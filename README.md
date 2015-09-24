# mqtt-dss-bridge
MQTT digitalSTROM-Server Bridge

## How to Install
To get started, just install the NPM module:

    $ npm install --save mqtt-dss-bridge
    
## Configuration
See : [config](config.js)

## Message
###Format
####Topic

dss/Property/Tree    

####Payload

string || json || {"$value": built-in objects}

### Sample
#### Publish
dss/apartment/devices/3504175fe00000000000de00/id 3504175fe00000000000de00

dss/apartment/zones/Demo/groups/0/lastCalledScene {"$value":0}

#### Subscribe - Set
set/dss/apartment/zones/Demo/groups/0/lastCalledScene {"$value":1}

## ToDo
* Write test's

## License
[MIT License](LICENSE)

