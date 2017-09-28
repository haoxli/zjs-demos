// Minicar BLE communicating protocol:
//     steerer(1byte) + angle(2byte) + driver(1byte) + speed(2byte) + others(2byte)
// steerer:
//     front: f >>> 0x66
//     left : l >>> 0x6c
//     right: r >>> 0x72
// driver:
//     coast(park): c >>> 0x63
//     brake(park): b >>> 0x62
//     forward    : f >>> 0x66
//     reverse    : r >>> 0x72
// number:
//     0 ~ 9 >>> 0x30 ~ 0x39
// char:
//     a ~ z >>> 0x61 ~ 0x7a

// Software requirements:
//     main.js on Mini car
//     test-ble-joystick.js on another Arduino 101 board
//     test-ble-adapter.py on Ubuntu 16.04
// Hardware Requirements:
//     A BLE adapter.
//     A Joy Stick.
//     Mini car board and another Arduino 101 board.
// Wiring:
//     For Joy Stick:
//         Wire all G on the JoyStick to GND on the Arduino 101
//         Wire all V on the JoyStick to Vcc(5v) on the Arduino 101
//         Wire X on the JoyStick to A0 on the Arduino 101
//         Wire Y on the JoyStick to A1 on the Arduino 101
//         Wire K on the JoyStick to A2 on the Arduino 101

console.log("Test toy stick mode");

var aio = require("aio");
var pins = require("arduino101_pins");
var ble = require("ble");

var pinA = aio.open({pin: pins.A0});
var pinB = aio.open({pin: pins.A1});
var pinC = aio.open({pin: pins.A2});

var Xstatus = "f";
var Xstatustmp = "f";
var Ystatus = "b";
var Ystatustmp = "b";
var upLine = 2500;
var downLine = 1500;
var precision = 50;
var speed = 70;
var angle = 40;

var NumtoBuf = function (num) {
    var buf = 0x30;
    var checkValue = 0;

    for (var j = 0; j < 10; j++) {
        if (num === checkValue + j) return buf + j;
    }
}

var StrtoBuf = function (Str) {
    if (Str === "b") return 0x62;
    if (Str === "f") return 0x66;
    if (Str === "l") return 0x6c;
    if (Str === "r") return 0x72;
}

var CMDBuf = function (steerer, driver) {
    var JSBuffer = new Buffer(8);

    var SteererbufData = StrtoBuf(steerer);
    JSBuffer.writeUInt8(SteererbufData, 0);

    var angleTens = (angle / 10) | 0;
    var AngleTensbufData = NumtoBuf(angleTens);
    JSBuffer.writeUInt8(AngleTensbufData, 1);

    var angleOens = angle - angleTens * 10;
    var AngleOensbufData = NumtoBuf(angleOens);
    JSBuffer.writeUInt8(AngleOensbufData, 2);

    var DriverbufData = StrtoBuf(driver);
    JSBuffer.writeUInt8(DriverbufData, 3);

    var speedTens = (speed / 10) | 0;
    var SpeedTensbufData = NumtoBuf(speedTens);
    JSBuffer.writeUInt8(SpeedTensbufData, 4);

    var speedOens = speed - speedTens * 10;
    var SpeedOensbufData = NumtoBuf(speedOens);
    JSBuffer.writeUInt8(SpeedOensbufData, 5);

    var NullbufData = 0x00;
    JSBuffer.writeUInt8(NullbufData, 6);
    JSBuffer.writeUInt8(NullbufData, 7);

    return JSBuffer
}

var getValue = setInterval(function () {
    if (0 <= pinA.read() && pinA.read() <= downLine) {
        if (Xstatus !== "r") {
            Xstatus = "r";
        }
    } else if (upLine <= pinA.read() && pinA.read() <= 5000) {
        if (Xstatus !== "l") {
            Xstatus = "l";
        }
    } else {
        if (Xstatus !== "f") {
            Xstatus = "f";
        }
    }

    if (0 <= pinB.read() && pinB.read() <= downLine) {
        if (Ystatus !== "f") {
            Ystatus = "f";
        }
    } else if (upLine <= pinB.read() && pinB.read() <= 5000) {
        if (Ystatus !== "r") {
            Ystatus = "r";
        }
    } else {
        if (Ystatus !== "b") {
            Ystatus = "b";
        }
    }

    if (Xstatus !== Xstatustmp || Ystatus !== Ystatustmp) {
        console.log("JoyStick BLE - CMD '" + Xstatus +
                    speed + Ystatus + angle + "00'");

        Xstatustmp = Xstatus;
        Ystatustmp = Ystatus;
        JSSCharacteristic.valueChange(Xstatus, Ystatus);
    }
}, precision);

var JSSCharacteristic = new ble.Characteristic({
    uuid: "fffa",
    properties: ["notify"],
    descriptors: [
        new ble.Descriptor({
            uuid: "2902",
            value: "Joy Stick Notify"
        })
    ]
});

var JSRCharacteristic = new ble.Characteristic({
    uuid: "fffb",
    properties: ["read"],
    descriptors: [
        new ble.Descriptor({
            uuid: "2901",
            value: "Joy Stick Read"
        })
    ]
});

JSRCharacteristic.onReadRequest = function(offset, callback) {
    var JSBuffer = CMDBuf(Xstatus, Ystatus);

    console.log("JoyStick BLE - send sensor data '" +
                JSBuffer.toString("hex") + "'");

    callback(this.RESULT_SUCCESS, JSBuffer);
};

JSSCharacteristic._onChange = null;

JSSCharacteristic.onSubscribe = function(maxValueSize, updateValueCallback) {
    console.log("JoyStick BLE - Subscribe");
    this._onChange = updateValueCallback;
};

JSSCharacteristic.onUnsubscribe = function() {
    console.log("JoyStick BLE - Unsubscribe");
    this._onChange = null;
};

JSSCharacteristic.valueChange = function(steerer, driver) {
    var JSBuffer = CMDBuf(steerer, driver);

    if (this._onChange) {
        this._onChange(JSBuffer);
    }
};

ble.on("stateChange", function(state) {
    if (state === "poweredOn") {
        console.log("JoyStick BLE - start BLE server");
        deviceName = "JoyStick BLE";
        ble.startAdvertising(deviceName, ["fff0"]);

        console.log("JoyStick BLE - device name '" + deviceName + "'");

        ble.updateRssi();

        ble.setServices([
            new ble.PrimaryService({
                uuid: "fff0",
                characteristics: [
                    JSRCharacteristic,
                    JSSCharacteristic
                ]
            })
        ], function (error) {
            if (error) {
                console.log("JoyStick BLE - set services error " + error);
            }
        });
    }
});

ble.on("advertisingStart", function (error) {
    console.log("JoyStick BLE - advertising");
});

ble.on("accept", function (clientAddress) {
    console.log("JoyStick BLE - accept " + clientAddress);
});

ble.on("disconnect", function (clientAddress) {
    console.log("JoyStick BLE - disconnect " + clientAddress);
});

ble.on("rssiUpdate", function (rssi) {
    console.log("JoyStick BLE - RSSI value " + rssi + "dBm");
});
