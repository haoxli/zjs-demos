console.log("Minicar using IR infrared sensor avoid obstacle");

var gpio = require("gpio");
var pwm = require("pwm");
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

// Check output value of IR induction sensor
var pinA, aValue, tmpValue, driverState;
var handleFlag = false;
var handleCount = 0;
var speed = 35;
var angle = 30;

pinA = gpio.open({
    pin: pins.IO2,
    direction: "in"
});

var IRItimer = setInterval(function () {
    aValue = pinA.read();

    driverState = driver.getDriverState();

    // find obstacle and stop to avoid
    if ((driverState === "forward" || driverState === "park") &&
        handleFlag === false &&
        aValue === false) {
        handleFlag = true;

        driver.brake();

        var handleTimer = setInterval(function () {
            handleCount = handleCount + 1;
            if (handleCount === 2) {
                steerer.right(angle);
                driver.reverse(speed);
            }

            if (handleCount === 3) {
                driver.brake();
                steerer.front();
            }

            if (handleCount === 4) {
                handleCount = 0;
                handleFlag = false;
                clearInterval(handleTimer);
            }
        }, 2000);
    }

    // continue to move forward
    if (driverState === "park" &&
        handleFlag === false &&
        aValue === true) {
        driver.forward(speed);
    }
}, 100);

driver.forward(speed);
