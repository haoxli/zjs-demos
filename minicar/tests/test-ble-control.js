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
// number:
//     0 ~ 9 >>> 0x30 ~ 0x39
// char:
//     a ~ z >>> 0x61 ~ 0x7a

console.log("Minicar is controlled by Bluetooth");

var pwm = require("pwm");
var ble = require ("ble");
var pins = require("arduino101_pins");
var steerer = require("Steerer.js");
var driver = require("Driver.js");

// Minicar init
var steerPin = pwm.open({ channel: pins.IO3 });
steerer.setSteerPin(steerPin);
steerer.init();

var forwardPin = pwm.open({ channel: pins.IO6 });
var reversePin = pwm.open({ channel: pins.IO5 });
driver.setForwadPin(forwardPin);
driver.setReversePin(reversePin);
driver.init();

// Buffer init
var basicBuffer = new Buffer(8);

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
}

var BasicCharacteristic = new ble.Characteristic({
    uuid: "ff10",
    properties: ["read", "write"],
    descriptors: [
        new ble.Descriptor({
            uuid: "2901",
            value: "Basic: steerer driver"
        })
    ]
});

BasicCharacteristic.onReadRequest = function(offset, callback) {
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

    callback(this.RESULT_SUCCESS, basicBuffer);
};

BasicCharacteristic.onWriteRequest = function(data, offset, withoutResponse,
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
        driver.forward(speed);
    } else if (data.readUInt8(3) === 0x72) {
        driver.reverse(speed);
    }

    console.log("Minicar BLE - control steering success");
    callback(this.RESULT_SUCCESS);
};

ble.on("stateChange", function (state) {
    if (state === "poweredOn") {
        console.log("Minicar BLE - start BLE server");
        deviceName = "Minicar BLE";
        ble.startAdvertising(deviceName, ["ff00"]);

        ble.updateRssi();

        ble.setServices([
            new ble.PrimaryService({
                uuid: "ff00",
                characteristics: [
                    BasicCharacteristic
                ]
            })
        ], function (error) {
            if (error) {
                console.log("Minicar BLE - set services error " + error);
            }
        });
    }
});

ble.on("advertisingStart", function (error) {
    console.log("Minicar BLE - advertising");
});

ble.on("accept", function (clientAddress) {
    console.log("Minicar BLE - accept " + clientAddress);
});

ble.on("disconnect", function (clientAddress) {
    console.log("Minicar BLE - disconnect " + clientAddress);
});

ble.on("rssiUpdate", function (rssi) {
    console.log("Minicar BLE - RSSI value " + rssi + "dBm");
});
