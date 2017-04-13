console.log("Minicar is controlled by Bluetooth");

var gpio = require("gpio");
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
var SteererbufferData = new Buffer(1);
var DriverbufferData = new Buffer(1);

// start BLE
// default value
var defaultSpeed = 50;
var defaultAngle = 30;
var speed = defaultSpeed;
var angle = defaultAngle;

var BuftoNum = function (buf) {
    var Num = 0;
    var checkValue = 0x30;

    for (var j = 0; j < 10; j++) {
        if (buf === checkValue + j) return Num + j;
    }
}

var steererCharacteristic = new ble.Characteristic({
    uuid: "ff10",
    properties: ["notify", "read", "write"],
    descriptors: [
        new ble.Descriptor({
            uuid: "2901",
            value: "steerer"
        })
    ]
});

var driverCharacteristic = new ble.Characteristic({
    uuid: "ff20",
    properties: ["notify", "read", "write"],
    descriptors: [
        new ble.Descriptor({
            uuid: "2901",
            value: "driver"
        })
    ]
});

steererCharacteristic.onReadRequest = function(offset, callback) {
    var SteererstateStr = steerer.getSteererState();
    var tmpStr;
    if (SteererstateStr === "front") {
        tmpStr = 0x66;
    } else if (SteererstateStr === "left") {
        tmpStr = 0x6c;
    } else if (SteererstateStr === "right") {
        tmpStr = 0x72;
    }

    console.log("Minicar BLE - the current steering state '" +
                SteererstateStr + "'");

    SteererbufferData.writeUInt8(tmpStr);
    callback(this.RESULT_SUCCESS, SteererbufferData);
};

steererCharacteristic.onSubscribe = function(maxValueSize, callback) {
    var SteererstateStr = steerer.getSteererState();
    var tmpStr;
    if (SteererstateStr === "front") {
        tmpStr = 0x66;
    } else if (SteererstateStr === "left") {
        tmpStr = 0x6c;
    } else if (SteererstateStr === "right") {
        tmpStr = 0x72;
    }

    console.log("Minicar BLE - steering state transition into '" +
                SteererstateStr + "'");

    SteererbufferData.writeUInt8(tmpStr);
    callback(SteererbufferData);
};

steererCharacteristic.onWriteRequest = function(data, offset, withoutResponse,
                                                callback) {
    // front >>> f >>> 0x66
    // left  >>> l >>> 0x6c
    // right >>> r >>> 0x72
    if (data.length === 3 &&
        ((data.readUInt8() === 0x66 &&
          data.readUInt8(1) === 0x30 &&
          data.readUInt8(2) === 0x30) ||
         ((data.readUInt8() === 0x6c ||
           data.readUInt8() === 0x72) &&
          (0x30 <= data.readUInt8(1) &&
           data.readUInt8(1) <= 0x39 &&
           0x30 <= data.readUInt8(2) &&
           data.readUInt8(2) <= 0x39)))) {
        if (data.readUInt8() === 0x66) {
            steerer.front();
        } else if (data.readUInt8() === 0x6c) {
            var tens = BuftoNum(data.readUInt8(1));
            var ones = BuftoNum(data.readUInt8(2));
            if ((0 <= tens && tens < 4) ||
                (tens === 4 && 0 <= ones && ones <= 5)) {
                angle = tens * 10 + ones;
            } else {
                angle = defaultAngle;
            }

            steerer.left(angle);
        } else if (data.readUInt8() === 0x72) {
            var tens = BuftoNum(data.readUInt8(1));
            var ones = BuftoNum(data.readUInt8(2));
            if ((0 <= tens && tens < 4) ||
                (tens === 4 && 0 <= ones && ones <= 5)) {
                angle = tens * 10 + ones;
            } else {
                angle = defaultAngle;
            }

            steerer.right(angle);
        }
    } else {
        console.log("Minicar BLE - set steering failure, please try again");

        callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
        return;
    }

    console.log("Minicar BLE - control steering success");

    callback(this.RESULT_SUCCESS);
};

driverCharacteristic.onReadRequest = function(offset, callback) {
    var DriverstateStr = driver.getDriverState();
    var tmpStr;
    if (DriverstateStr === "coast") {
        tmpStr = 0x63;
    } else if (DriverstateStr === "brake") {
        tmpStr = 0x62;
    } else if (DriverstateStr === "forward") {
        tmpStr = 0x66;
    } else if (DriverstateStr === "reverse") {
        tmpStr = 0x72;
    }

    console.log("Minicar BLE - the current driving state '" +
                DriverstateStr + "'");

    DriverbufferData.writeUInt8(tmpStr);
    callback(this.RESULT_SUCCESS, DriverbufferData);
};

driverCharacteristic.onSubscribe = function(maxValueSize, callback) {
    var DriverstateStr = driver.getDriverState();
    var tmpStr;
    if (DriverstateStr === "coast") {
        tmpStr = 0x63;
    } else if (DriverstateStr === "brake") {
        tmpStr = 0x62;
    } else if (DriverstateStr === "forward") {
        tmpStr = 0x66;
    } else if (DriverstateStr === "reverse") {
        tmpStr = 0x72;
    }

    console.log("Minicar BLE - driving state transition into '" +
                DriverstateStr + "'");

    DriverbufferData.writeUInt8(tmpStr);
    callback(DriverbufferData);
};

driverCharacteristic.onWriteRequest = function(data, offset, withoutResponse,
                                                callback) {
    // coast   >>> c >>> 0x63
    // brake   >>> b >>> 0x62
    // forward >>> f >>> 0x66
    // reverse >>> r >>> 0x72
    if ((data.length === 3) &&
        (((data.readUInt8() === 0x63 ||
           data.readUInt8() === 0x62) &&
          (data.readUInt8(1) === 0x30 &&
           data.readUInt8(2) === 0x30)) ||
         ((data.readUInt8() === 0x66 ||
           data.readUInt8() === 0x72) &&
          (0x30 <= data.readUInt8(1) &&
           data.readUInt8(1) <= 0x39 &&
           0x30 <= data.readUInt8(2) &&
           data.readUInt8(2) <= 0x39)))) {
        if (data.readUInt8() === 0x63) {
            driver.coast();
        } else if (data.readUInt8() === 0x62) {
            driver.brake();
        }else if (data.readUInt8() === 0x66) {
            var tens = BuftoNum(data.readUInt8(1));
            var ones = BuftoNum(data.readUInt8(2));
            speed = tens * 10 + ones;

            driver.forward(speed);
        } else if (data.readUInt8() === 0x72) {
            var tens = BuftoNum(data.readUInt8(1));
            var ones = BuftoNum(data.readUInt8(2));
            speed = tens * 10 + ones;

            driver.reverse(speed);
        }
    } else {
        console.log("Minicar BLE - set driving failure, please try again");

        callback(this.RESULT_INVALID_ATTRIBUTE_LENGTH);
        return;
    }

    console.log("Minicar BLE - control driving success");

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
                    steererCharacteristic,
                    driverCharacteristic
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
