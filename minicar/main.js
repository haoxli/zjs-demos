// Minicar BLE communicating protocol:
//     steerer(1byte) + angle(2byte) + driver(1byte) + speed(2byte) + others(2byte)
// steerer:
//     front: f >>> 0x66
//     left : l >>> 0x6c
//     right: r >>> 0x72
// driver:
//     coast(park): p >>> 0x70
//     brake(park): p >>> 0x70
//     forward    : f >>> 0x66
//     reverse    : r >>> 0x72
// flag:
//     true : t >>> 0x74
//     false: f >>> 0x66
// number:
//     0 ~ 9 >>> 0x30 ~ 0x39
// char:
//     a ~ z >>> 0x61 ~ 0x7a

console.log("Minicar is controlled by Bluetooth " +
            "using IR infrared sensor avoid obstacle");

var gpio = require("gpio");
var pwm = require("pwm");
var ble = require ("ble");
var pins = require("arduino101_pins");
var steerer = require("Steerer.js");
var driver = require("Driver.js");

//BLE
var DEVICE_NAME = 'ZJS Demo';
var gapUuid = 'fc00';

// Car Init
var steerPin = pwm.open({ channel: pins.IO3 });
steerer.setSteerPin(steerPin);
steerer.init();

var forwardPin = pwm.open({ channel: pins.IO6 });
var reversePin = pwm.open({ channel: pins.IO5 });
driver.setForwadPin(forwardPin);
driver.setReversePin(reversePin);
driver.init();

// Buffer Init
var basicBuffer = new Buffer(8);
var sensorBuffer = new Buffer(1);

// IRI sensor Init
var sensorPin = gpio.open({
    pin: 2,
    mode: "in",
    edge: "any"
});
var IRISensorFlag = false;
var SensorPinValue, IRItimer;
IRItimer = setInterval(function () {
    // false: roadblock
    SensorPinValue = sensorPin.read();
    IRISensorFlag = !SensorPinValue;

    if (driver.getDriverState() === "forward" && IRISensorFlag) {
        driver.brake();
    }
}, 200);

// start BLE
var speed = 50;
var angle = 30;
var CPFlag = true;

var BuftoNum = function (buf) {
    var Num = 0;
    var checkValue = 0x30;

    for (var j = 0; j < 10; j++) {
        if (buf === checkValue + j) return Num + j;
    }
}

var NumtoBuf = function (num) {
    var buf = 0x30;
    var checkValue = 0;

    for (var j = 0; j < 10; j++) {
        if (num === checkValue + j) return buf + j;
    }
}

var StrtoBuf = function (Str) {
    if (Str === "park") return 0x70;
    if (Str === "front" || Str === "forward") return 0x66;
    if (Str === "left") return 0x6c;
    if (Str === "right" || Str === "reverse") return 0x72;
    if (Str === "false") return 0x66;
    if (Str === "true") return 0x74;
}

var BooleantoStr = function (value) {
    if (value) {
        return "true";
    } else {
        return "false";
    }
}

var DriverCharacteristic = new ble.Characteristic({
    uuid: "fc0a",
    properties: ["read", "write"],
    descriptors: [
        new ble.Descriptor({
            uuid: "2901",
            value: "Driver"
        })
    ]
});

var IRISensorCharacteristic = new ble.Characteristic({
    uuid: "fc0b",
    properties: ["read"],
    descriptors: [
        new ble.Descriptor({
            uuid: "2901",
            value: "IRISensor"
        })
    ]
});

DriverCharacteristic.onReadRequest = function(offset, callback) {
    var SteererstateStr = steerer.getSteererState();
    var SteererbufData = StrtoBuf(SteererstateStr);
    basicBuffer.writeUInt8(SteererbufData, 0);

    var angleTens = (angle / 10) | 0;
    var AngleTensbufData = NumtoBuf(angleTens);
    basicBuffer.writeUInt8(AngleTensbufData, 1);

    var angleOens = angle - angleTens * 10;
    var AngleOensbufData = NumtoBuf(angleOens);
    basicBuffer.writeUInt8(AngleOensbufData, 2);

    var DriverstateStr = driver.getDriverState();
    var DriverbufData = StrtoBuf(DriverstateStr);
    basicBuffer.writeUInt8(DriverbufData, 3);

    var speedTens = (speed / 10) | 0;
    var SpeedTensbufData = NumtoBuf(speedTens);
    basicBuffer.writeUInt8(SpeedTensbufData, 4);

    var speedOens = speed - speedTens * 10;
    var SpeedOensbufData = NumtoBuf(speedOens);
    basicBuffer.writeUInt8(SpeedOensbufData, 5);

    var NullbufData = 0x00;
    basicBuffer.writeUInt8(NullbufData, 6);
    basicBuffer.writeUInt8(NullbufData, 7);

    console.log("Minicar BLE - send basic data '" +
                basicBuffer.toString('hex') + "'");

    callback(this.RESULT_SUCCESS, basicBuffer);
};

DriverCharacteristic.onWriteRequest = function(data, offset, withoutResponse,
                                              callback) {
    // filtering invalid BLE communicating protocol
    if (data.length === 8) {
        if (data.readUInt8(0) === 0x66 ||
            data.readUInt8(0) === 0x6c ||
            data.readUInt8(0) === 0x72) {
            if (((0x30 <= data.readUInt8(1) &&
                  data.readUInt8(1) <= 0x33) &&
                 (0x30 <= data.readUInt8(2) &&
                  data.readUInt8(2) <= 0x39)) ||
                (data.readUInt8(1) === 0x34 &&
                 (0x30 <= data.readUInt8(2) &&
                  data.readUInt8(2) <= 0x35))) {
                if (data.readUInt8(3) === 0x63 ||
                    data.readUInt8(3) === 0x62 ||
                    data.readUInt8(3) === 0x66 ||
                    data.readUInt8(3) === 0x72) {
                    if ((0x30 <= data.readUInt8(4) &&
                         data.readUInt8(4) <= 0x39) &&
                        (0x30 <= data.readUInt8(5) &&
                         data.readUInt8(5) <= 0x39)) {
                        CPFlag = true;
                    } else {
                        console.log("Minicar BLE - invalid driving speed");
                        CPFlag = false;
                    }
                } else {
                    console.log("Minicar BLE - invalid driving operator");
                    CPFlag = false;
                }
            } else {
                console.log("Minicar BLE - invalid steering angle");
                CPFlag = false;
            }
        } else {
            console.log("Minicar BLE - invalid steering operator");
            CPFlag = false;
        }
    } else {
        console.log("Minicar BLE - invalid communicating protocol length");
        CPFlag = false;
    }

    if (!CPFlag) {
        callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
        return;
    }

    // handle BLE communicating protocol
    var angleTens = BuftoNum(data.readUInt8(1));
    var angleOnes = BuftoNum(data.readUInt8(2));
    angle = angleTens * 10 + angleOnes;

    var speedTens = BuftoNum(data.readUInt8(4));
    var speedOnes = BuftoNum(data.readUInt8(5));
    speed = speedTens * 10 + speedOnes;

    if (data.readUInt8(0) === 0x66) {
        steerer.front();
    } else if (data.readUInt8(0) === 0x6c) {
        steerer.left(angle);
    } else if (data.readUInt8(0) === 0x72) {
        steerer.right(angle);
    }

    if (data.readUInt8(3) === 0x63) {
        driver.coast();
    } else if (data.readUInt8(3) === 0x62) {
        driver.brake();
    } else if (data.readUInt8(3) === 0x66) {
        if (!IRISensorFlag) {
            driver.forward(speed);
        }
    } else if (data.readUInt8(3) === 0x72) {
        driver.reverse(speed);
    }

    console.log("Minicar BLE - receive basic data '" +
                data.toString('hex') + "'");
    console.log("Minicar BLE - control success");

    callback(this.RESULT_SUCCESS);
};


IRISensorCharacteristic.onReadRequest = function(offset, callback) {
    var IRISensorFlagStr = BooleantoStr(IRISensorFlag);
    var IRISensorBuffData = StrtoBuf(IRISensorFlagStr);
    sensorBuffer.writeUInt8(IRISensorBuffData, 0);

    console.log("Minicar BLE - send sensor data '" +
                sensorBuffer.toString('hex') + "'");

    callback(this.RESULT_SUCCESS, sensorBuffer);
};

ble.on("stateChange", function (state) {
    if (state === "poweredOn") {
        console.log(DEVICE_NAME + ": Start BLE server");
        ble.startAdvertising(DEVICE_NAME, [gapUuid], "https://goo.gl/3u5Iu7");
    } else {
        if (state === 'unsupported') {
            console.log(DEVICE_NAME + ": BLE not enabled on board");
        }
        ble.stopAdvertising();
    }
});

ble.on("advertisingStart", function (error) {
    if (error) {
        console.log(DEVICE_NAME + ": Fail to advertise Physical Web URL");
        return;
    }

    ble.updateRssi();
    ble.setServices([
        new ble.PrimaryService({
            uuid: gapUuid,
            characteristics: [
                DriverCharacteristic,
                IRISensorCharacteristic
            ]
        })
    ], function (error) {
        if (error) {
            console.log(DEVICE_NAME + ": Set BLE Services Error - " + error);
            return;
        }
    });
    console.log(DEVICE_NAME + ": Advertising as Physical Web Service");
});

ble.on("accept", function (clientAddress) {
    console.log("Client connected: " + clientAddress);
});

ble.on("disconnect", function (clientAddress) {
    console.log("Client disconnected: " + clientAddress);
});

ble.on("rssiUpdate", function (rssi) {
    console.log("RSSI changed: " + rssi + " dBm");
});
