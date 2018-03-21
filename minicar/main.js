console.log("Mini Car is tracking");

var gpio = require("gpio");
var pwm = require("pwm");
var ble = require("ble");
var steerer = require("Steerer.js");
var driver = require("Driver.js");

// Car init
var steerPin = pwm.open({ pin: "IO3" });
steerer.setSteerPin(steerPin);
steerer.init();

var forwardPin = pwm.open({ pin: "IO6" });
var reversePin = pwm.open({ pin: "IO5" });
driver.setForwadPin(forwardPin);
driver.setReversePin(reversePin);
driver.init();

driver.setSpeedRegulationFlag(false);
driver.setSpeedLogFlag(false);

var bleFlag = false;
var trackFlag = true;
var trackLostFlag = true;
var UltrasonicSensorFlag = false;

// Ultrasonic sensor: IO2 IO13
var UltrasonicSensorIn = gpio.open({ pin: 2, mode: "in", edge: "any" });

var UltrasonicSensorOut = gpio.open(13);
UltrasonicSensorOut.write(0);

var UltrasonicSensorCount = 0;
var UltrasonicSensorCountTmp = 0;
var UltrasonicSensorFlagTmp = false;
var UltrasonicSensorDistance = 10;

var UltrasonicSensorTimer = setInterval(function () {
    UltrasonicSensorCount = 0;
    UltrasonicSensorOut.write(1);
    UltrasonicSensorOut.write(0);

    for (var i = 0; i < 100; i++) {
        if (UltrasonicSensorIn.read()) {
            UltrasonicSensorCount++;
        }
    }

    if (UltrasonicSensorCount < UltrasonicSensorDistance &&
        UltrasonicSensorCount !== 0) {
        UltrasonicSensorFlag = true;
        UltrasonicSensorCountTmp = 0;
    } else {
        UltrasonicSensorCountTmp++;

        if (UltrasonicSensorCountTmp >= 5) {
            UltrasonicSensorFlag = false;
            UltrasonicSensorCountTmp = 0;
        }
    }

    if (UltrasonicSensorFlag) {
        if (!UltrasonicSensorFlagTmp) {
            UltrasonicSensorFlagTmp = true;
            driver.brake();
            steerer.front();
            console.log("Minicar Avoiding - obstacles on the road");
        }
    } else {
        if (UltrasonicSensorFlagTmp) {
            UltrasonicSensorFlagTmp = false;
            console.log("Minicar Avoiding - no obstacles and go");
        }
    }
}, 200);

// Tracking sensor: IO4 IO7 IO8 IO10 IO11
var TrackSensorRight2 = gpio.open({ pin: 4, mode: "in", edge: "any" });
var TrackSensorRight1 = gpio.open({ pin: 7, mode: "in", edge: "any" });
var TrackSensorMiddle = gpio.open({ pin: 8, mode: "in", edge: "any" });
var TrackSensorLeft1 = gpio.open({ pin: 10, mode: "in", edge: "any" });
var TrackSensorLeft2 = gpio.open({ pin: 11, mode: "in", edge: "any" });

var AccSensor = new Accelerometer({
    frequency: 50
});

var AccValueY = 0;
var AccValueYOld = 0;
var AccValueYNew = 0;
var AccValue = 0;

AccSensor.onactivate = function() {
    console.log("Acc sensor: is activated");
};

AccSensor.start();

var loseTime = 100;              // 20 * 100 = 2000ms
var restartCount = 0;
var trackLostCount = 0;

var peakSpeed = 90;
var basicSpeed = 1;
var trackSpeed = basicSpeed;
var thresholdSpeed = 70;
var Increase = 10;

var currentAngle = 0;
var frontAngle = 0;
var turnAngle1 = 25;
var turnAngle2 = 40;

var Right2Value, Right1Value, MiddleValue, Left1Value, Left2Value;

var TrackTimer = setInterval(function () {
    // Accelerator Sensor
    AccValueYNew = AccSensor.y;
    AccValueY = (AccValueYNew - AccValueYOld) / 2;
    AccValueYOld = AccValueYNew;
    AccValue = (AccValue + AccValueY * 20) | 0;

    Right2Value = TrackSensorRight2.read();
    Right1Value = TrackSensorRight1.read();
    MiddleValue = TrackSensorMiddle.read();
    Left1Value = TrackSensorLeft1.read();
    Left2Value = TrackSensorLeft2.read();

    // Tracking: steer control
    if (!UltrasonicSensorFlag && !bleFlag && trackFlag) {
        if (MiddleValue === 1) {
            trackLostFlag = false;
            trackLostCount = 0;

            if (steerer.getSteererState() !== "front") {
                currentAngle = frontAngle;
                steerer.front();
            }
        } else {
            if (Right1Value === 1) {
                trackLostFlag = false;
                trackLostCount = 0;

                if (currentAngle !== turnAngle1) {
                    currentAngle = turnAngle1;
                    steerer.right(currentAngle);
                    console.log("Minicar Tracking - turn right " +
                                currentAngle + "c");
                }
            } else if (Left1Value === 1) {
                trackLostFlag = false;
                trackLostCount = 0;

                if (currentAngle !== turnAngle1) {
                    currentAngle = turnAngle1;
                    steerer.left(currentAngle);
                    console.log("Minicar Tracking - turn left " +
                                currentAngle + "c");
                }
            } else if (Right2Value === 1) {
                trackLostFlag = false;
                trackLostCount = 0;

                if (currentAngle !== turnAngle2) {
                    currentAngle = turnAngle2;
                    steerer.right(currentAngle);
                    console.log("Minicar Tracking - turn right " +
                                currentAngle + "c");
                }
            } else if (Left2Value === 1) {
                trackLostFlag = false;
                trackLostCount = 0;

                if (currentAngle !== turnAngle2) {
                    currentAngle = turnAngle2;
                    steerer.left(currentAngle);
                    console.log("Minicar Tracking - turn left " +
                                currentAngle + "c");
                }
            }
        }
    }

    // Tracking: speed control
    if (!UltrasonicSensorFlag && !bleFlag && trackFlag && !trackLostFlag) {
        if (driver.getDriverState() === "park") {
            if (AccValue === 0) {
                if (Right2Value || Right1Value || MiddleValue ||
                    Left1Value || Left2Value) {
                    if (restartCount === 5) {
                        driver.forward(basicSpeed);
                        restartCount = 0;
                    }

                    restartCount++;
                }
            }
        } else {
            restartCount = 0;

            if (trackSpeed < thresholdSpeed) {
                if (AccValue < -6) {
                    trackSpeed = thresholdSpeed;
                    return;
                }

                trackSpeed = trackSpeed + Increase;

                if (trackSpeed >= thresholdSpeed) {
                    trackSpeed = thresholdSpeed;
                }
            } else if (trackSpeed >= thresholdSpeed && trackSpeed <= peakSpeed) {
                if (AccValue > 6) {
                    trackSpeed = basicSpeed;
                    return;
                }

                trackSpeed = trackSpeed + 3;
            } else {
                trackSpeed = basicSpeed;
            }

            driver.forward(trackSpeed);
        }
    }

    // Track lost
    if (!UltrasonicSensorFlag && !bleFlag && trackFlag && !trackLostFlag) {
        if (!Right2Value && !Right1Value && !MiddleValue &&
            !Left1Value && !Left2Value) {
            if (trackLostCount === loseTime + 2) {
                trackLostCount = 0;
            }

            trackLostCount++;
        }

        if (trackLostCount >= loseTime && driver.getDriverState() !== "park") {
            driver.brake();
            steerer.front();
            trackLostFlag = true;
            trackLostCount = 0;
            console.log("Minicar Tracking - lost trace");
        }
    }
}, 20);

// BLE control
var basicBuffer = new Buffer(8);
var sensorBuffer = new Buffer(1);
var bleClient = null;              // Only one client can connect

var bleSpeed = 50;
var bleAngle = 30;

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

var SensorCharacteristic = new ble.Characteristic({
    uuid: "fc0b",
    properties: ["read"],
    descriptors: [
        new ble.Descriptor({
            uuid: "2901",
            value: "Sensor"
        })
    ]
});

DriverCharacteristic.onReadRequest = function(offset, callback) {
    var SteererstateStr = steerer.getSteererState();
    var SteererbufData = StrtoBuf(SteererstateStr);
    basicBuffer.writeUInt8(SteererbufData, 0);

    var angleTens = (bleAngle / 10) | 0;
    var AngleTensbufData = NumtoBuf(angleTens);
    basicBuffer.writeUInt8(AngleTensbufData, 1);

    var angleOens = bleAngle - angleTens * 10;
    var AngleOensbufData = NumtoBuf(angleOens);
    basicBuffer.writeUInt8(AngleOensbufData, 2);

    var DriverstateStr = driver.getDriverState();
    var DriverbufData = StrtoBuf(DriverstateStr);
    basicBuffer.writeUInt8(DriverbufData, 3);

    var speedTens = (bleSpeed / 10) | 0;
    var SpeedTensbufData = NumtoBuf(speedTens);
    basicBuffer.writeUInt8(SpeedTensbufData, 4);

    var speedOens = bleSpeed - speedTens * 10;
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
    // handle BLE communicating protocol
    var angleTens = BuftoNum(data.readUInt8(1));
    var angleOnes = BuftoNum(data.readUInt8(2));
    bleAngle = angleTens * 10 + angleOnes;

    var speedTens = BuftoNum(data.readUInt8(4));
    var speedOnes = BuftoNum(data.readUInt8(5));
    bleSpeed = speedTens * 10 + speedOnes;

    if (data.readUInt8(0) === 0x66) {
        steerer.front();
    } else if (data.readUInt8(0) === 0x6c) {
        steerer.left(bleAngle);
    } else if (data.readUInt8(0) === 0x72) {
        steerer.right(bleAngle);
    }

    if (data.readUInt8(3) === 0x63) {
        driver.coast();
    } else if (data.readUInt8(3) === 0x62) {
        driver.brake();
    } else if (data.readUInt8(3) === 0x66) {
        if (!UltrasonicSensorFlag) {
            driver.forward(bleSpeed);
        }
    } else if (data.readUInt8(3) === 0x72) {
        driver.reverse(bleSpeed);
    }

    console.log("Minicar BLE - receive basic data '" +
                data.toString('hex') + "'");

    callback(this.RESULT_SUCCESS);
};

SensorCharacteristic.onReadRequest = function(offset, callback) {
    var UltrasonicSensorBuffData;
    if (UltrasonicSensorFlag) {
        UltrasonicSensorBuffData = 0x74;
    } else {
        UltrasonicSensorBuffData = 0x66;
    }
    sensorBuffer.writeUInt8(UltrasonicSensorBuffData, 0);

    console.log("Minicar BLE - send sensor data '" +
                sensorBuffer.toString('hex') + "'");

    callback(this.RESULT_SUCCESS, sensorBuffer);
};

ble.on("stateChange", function (state) {
    if (state === "poweredOn") {
        console.log("ZJS Demo: Start BLE server");
        ble.startAdvertising("ZJS Demo", ["fc00"], "https://goo.gl/3u5Iu7");
        ble.setServices([
            new ble.PrimaryService({
                uuid: "fc00",
                characteristics: [
                    DriverCharacteristic,
                    SensorCharacteristic
                ]
            })
        ]);
    }
});

ble.on("advertisingStart", function (error) {
    console.log("ZJS Demo" + ": Advertising as Physical Web Service");
});

ble.on("accept", function (clientAddress) {
    if (bleClient === null) {
        driver.brake();
        steerer.front();
        bleFlag = true;
        trackFlag = false;
        bleClient = clientAddress;
        driver.setSpeedRegulationFlag(true);
        driver.setSpeedLogFlag(true);
        console.log("Client connected: " + clientAddress);
    } else {
        ble.disconnect(clientAddress);
        console.log("There are already client connections: " + bleClient);
    }
});

ble.on("disconnect", function (clientAddress) {
    if (clientAddress === bleClient) {
        driver.brake();
        steerer.front();
        bleFlag = false;
        trackFlag = true;
        bleClient = null;
        driver.setSpeedRegulationFlag(false);
        driver.setSpeedLogFlag(false);
        console.log("Client disconnected: " + clientAddress);
    }
});
