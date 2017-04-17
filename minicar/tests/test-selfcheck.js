console.log("Minicar selfcheck - start");

var driver = require("Driver.js");
var steerer = require("Steerer.js");
var pwm = require("pwm");
var pins = require("arduino101_pins");

// Minicar init
var steerPin = pwm.open({ channel: pins.IO3 });
steerer.setSteerPin(steerPin);
steerer.init();

var forwardPin = pwm.open({ channel: pins.IO6 });
var reversePin = pwm.open({ channel: pins.IO5 });
driver.setForwadPin(forwardPin);
driver.setReversePin(reversePin);
driver.init();

// Minicar Self-check
console.log("Minicar selfcheck - steerer start");

var checkNum = 0;
var checkTimer = setInterval(function() {
    checkNum++;

    if (checkNum === 3 || checkNum === 4) {
        steerer.left(45);

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 1 || checkNum === 2 ||
        checkNum === 5 ||checkNum === 6) {
        steerer.left(30);

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 7 || checkNum === 14) {
        steerer.front();

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 8 || checkNum === 9 ||
        checkNum === 12 ||checkNum === 13) {
        steerer.right(30);

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 10 || checkNum === 11) {
        steerer.right(45);

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 15) {
        console.log("Minicar selfcheck - steerer complete");
        console.log("Minicar selfcheck - driver start");
    }

    if (checkNum === 18 || checkNum === 19) {
        driver.forward(70);

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 16 || checkNum === 17 || checkNum === 20 ||checkNum === 21) {
        driver.forward(10);

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 22) {
        driver.coast();

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 29) {
        driver.brake();

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 25 || checkNum === 26) {
        driver.reverse(70);

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 23 || checkNum === 24 || checkNum === 27 ||checkNum === 28) {
        driver.reverse(10);

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 30) {
        console.log("Minicar selfcheck - driver complete");
        console.log("Minicar selfcheck - complete");
        clearInterval(checkTimer);
    }
}, 1000);
