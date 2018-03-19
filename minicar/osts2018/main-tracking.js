console.log("Mini Car is tracking");

var gpio = require("gpio");
var pwm = require("pwm");
var pins = require("arduino101_pins");
var steerer = require("Steerer.js");
var driver = require("Driver.js");

// Car init
var steerPin = pwm.open({ channel: pins.IO3 });
steerer.setSteerPin(steerPin);
steerer.init();

var forwardPin = pwm.open({ channel: pins.IO6 });
var reversePin = pwm.open({ channel: pins.IO5 });
driver.setForwadPin(forwardPin);
driver.setReversePin(reversePin);
driver.init();

if (driver.getSpeedRegulationFlag()) {
    driver.setSpeedRegulationFlag(false);
}

if (driver.getSpeedLogFlag()) {
    driver.setSpeedLogFlag(false);
}

var UltrasonicSensorTimer = null;
var TrackTimer = null;
var AccTimer = null;

var bleFlag = false;                     // Working, have clients?
var trackFlag = true;                    // Working?
var trackLostFlag = true;               // Working, but lost track?
var UltrasonicSensorFlag = false;        // Working, have obstacle?

// Ultrasonic sensor: IO2 IO13
var UltrasonicSensorIn = gpio.open({
    pin: 2,
    mode: "in",
    edge: "any"
});

var UltrasonicSensorOut = gpio.open({ pin: 13 });
UltrasonicSensorOut.write(0);

var UltrasonicSensorCount = 0;
var UltrasonicSensorCountTmp = 0;
var UltrasonicSensorFlagTmp = false;
var UltrasonicSensorDistance = 10;

UltrasonicSensorTimer = setInterval(function () {
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
var TrackSensorRight2 = gpio.open({
    pin: 4,
    mode: "in",
    edge: "any"
});

var TrackSensorRight1 = gpio.open({
    pin: 7,
    mode: "in",
    edge: "any"
});

var TrackSensorMiddle = gpio.open({
    pin: 8,
    mode: "in",
    edge: "any"
});

var TrackSensorLeft1 = gpio.open({
    pin: 10,
    mode: "in",
    edge: "any"
});

var TrackSensorLeft2 = gpio.open({
    pin: 11,
    mode: "in",
    edge: "any"
});

var AccSensor = new Accelerometer({
    frequency: 80
});

var AccValueY = 0;
var AccValueYOld = 0;
var AccValueYNew = 0;
var AccValue = 0;

AccTimer = setInterval(function () {
    AccValueYNew = AccSensor.y;
    AccValueY = (AccValueYNew - AccValueYOld) / 2;
    AccValueYOld = AccValueYNew;
    AccValue = (AccValue + AccValueY * 20) | 0;
}, 20);

AccSensor.onactivate = function() {
    console.log("Acc sensor is activated");
};

AccSensor.start();

var loseTime = 100;              // 20 * 100 = 2000ms
var restartCount = 0;
var trackLostCount = 0;

var peakSpeed = 80;
var basicSpeed = 1;
var trackSpeed = basicSpeed;
var thresholdSpeed = 40;
var Increase = 4;

var currentAngle = 0;
var frontAngle = 0;
var turnAngle1 = 25;
var turnAngle2 = 40;

var Right2Value, Right1Value, MiddleValue, Left1Value, Left2Value;

TrackTimer = setInterval(function () {
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
