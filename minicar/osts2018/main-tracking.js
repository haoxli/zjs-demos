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
var UltrasonicSensorFlag = false;
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
        UltrasonicSensorFlagTmp = true;
        UltrasonicSensorCountTmp = 0;
    } else {
        UltrasonicSensorCountTmp++;

        if (UltrasonicSensorCountTmp >= 5) {
            UltrasonicSensorFlagTmp = false;
            UltrasonicSensorCountTmp = 0;
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

var currentAngle = 0;
var frontAngle = 0;
var turnAngle1 = 25;
var turnAngle2 = 40;
// Default value is 0
var compensationAngle = 5;

var trackLostFlag = false;
var trackCount = 0;

var speed, forwardDelay, coastDelay;
var Right2Value, Right1Value, MiddleValue, Left1Value, Left2Value;
var trackTimer = setInterval(function () {
    if (UltrasonicSensorFlagTmp) {
        if (driver.getPulseFlag()) {
            driver.pulseStop();
        }

        if (UltrasonicSensorFlag !== UltrasonicSensorFlagTmp) {
            UltrasonicSensorFlag = true;
            driver.brake();
            currentAngle = 0;
            steerer.front();
            console.log("Minicar Avoiding - obstacles on the road");
        }
    } else {
        if (UltrasonicSensorFlag) {
            UltrasonicSensorFlag = false;
            console.log("Minicar Avoiding - no obstacles and go");
        }

        if (!trackLostFlag) {
            trackCount++;
        }

        Right2Value = TrackSensorRight2.read();
        Right1Value = TrackSensorRight1.read();
        MiddleValue = TrackSensorMiddle.read();
        Left1Value = TrackSensorLeft1.read();
        Left2Value = TrackSensorLeft2.read();

        if (MiddleValue === 1) {
            trackLostFlag = false;
            trackCount = 0;

            // Front(args): 70 20 200
            speed = 70;
            forwardDelay = 20;
            coastDelay = 200;
            driver.pulseStart(speed, forwardDelay, coastDelay);

            if (steerer.getSteererState() !== "front") {
                currentAngle = frontAngle;
                steerer.front();
            }
        } else {
            if (Right1Value === 1) {
                trackLostFlag = false;
                trackCount = 0;

                // Turn1(args): 70 80 100
                speed = 70;
                forwardDelay = 80;
                coastDelay = 100;
                driver.pulseStart(speed, forwardDelay, coastDelay);

                if (currentAngle !== turnAngle1 - compensationAngle) {
                    currentAngle = turnAngle1 - compensationAngle;
                    steerer.right(currentAngle);
                    console.log("Minicar Tracking - turn right " +
                                currentAngle + "c");
                }
            } else if (Left1Value === 1) {
                trackLostFlag = false;
                trackCount = 0;

                // Turn1(args): 70 80 100
                speed = 70;
                forwardDelay = 80;
                coastDelay = 100;
                driver.pulseStart(speed, forwardDelay, coastDelay);

                if (currentAngle !== turnAngle1 + compensationAngle) {
                    currentAngle = turnAngle1 + compensationAngle;
                    steerer.left(currentAngle);
                    console.log("Minicar Tracking - turn left " +
                                currentAngle + "c");
                }
            } else if (Right2Value === 1) {
                trackLostFlag = false;
                trackCount = 0;

                // Turn2(args): 70 160 20
                speed = 70;
                forwardDelay = 160;
                coastDelay = 40;
                driver.pulseStart(speed, forwardDelay, coastDelay);

                if (currentAngle !== turnAngle2 - compensationAngle) {
                    currentAngle = turnAngle2 - compensationAngle;
                    steerer.right(currentAngle);
                    console.log("Minicar Tracking - turn right " +
                                currentAngle + "c");
                }
            } else if (Left2Value === 1) {
                trackLostFlag = false;
                trackCount = 0;

                // Turn2(args): 70 160 20
                speed = 70;
                forwardDelay = 160;
                coastDelay = 40;
                driver.pulseStart(speed, forwardDelay, coastDelay);

                if (currentAngle !== turnAngle2 + compensationAngle) {
                    currentAngle = turnAngle2 + compensationAngle;
                    steerer.left(currentAngle);
                    console.log("Minicar Tracking - turn left " +
                                currentAngle + "c");
                }
            } else {
                if (trackCount >= 100 && driver.getDriverState() !== "park") {
                    driver.pulseStop();
                    driver.brake();
                    currentAngle = frontAngle;
                    steerer.front();
                    trackLostFlag = true;
                    trackCount = 0;
                    console.log("Minicar Tracking - lost trace");
                }
            }
        }
    }
}, 20);
