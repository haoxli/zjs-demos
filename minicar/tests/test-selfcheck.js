console.log("Minicar selfcheck - start");

var driver = require("Driver.js");
var steerer = require("Steerer.js");
var pwm = require("pwm");
var pins = require("arduino101_pins");

// Minicar init
var steerPin = pwm.open({ channel: pins.IO3 });
var forwardPin = pwm.open({ channel: pins.IO6 });
var reversePin = pwm.open({ channel: pins.IO5 });

steerer.init(steerPin);
driver.init(forwardPin, reversePin);

// Minicar Self-check
console.log("Minicar selfcheck - steerer start");

var checkNum = 0;
var checkTimer = setInterval(function() {
    checkNum++;

    if (checkNum === 1 || checkNum === 5) {
        steerer.left(45);

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 2 || checkNum === 6 ||
        checkNum === 4 || checkNum === 8) {
        steerer.front();

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 3 || checkNum === 7) {
        steerer.right(45);

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 9) {
        console.log("Minicar selfcheck - steerer complete");
        console.log("Minicar selfcheck - driver start");
    }

    if (checkNum === 10 || checkNum === 14) {
        driver.forward(70);

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 11 || checkNum === 13) {
        driver.coast();

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 15 || checkNum === 17) {
        driver.brake();

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 12 || checkNum === 16) {
        driver.reverse(70);

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 18) {
        console.log("Minicar selfcheck - driver complete");
        console.log("Minicar selfcheck - complete");
        clearInterval(checkTimer);
    }
}, 1000);
