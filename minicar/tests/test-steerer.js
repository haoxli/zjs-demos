console.log("Minicar steerer - start");

var steerer = require("Steerer.js");
var pwm = require("pwm");
var pins = require("arduino101_pins");

// Minicar steerer init
var steerPin = pwm.open({ channel: pins.IO3 });
steerer.setSteerPin(steerPin);
steerer.init();

var checkNum = 0;
var checkTimer = setInterval(function() {
    checkNum++;

    if (checkNum === 1 || checkNum === 5) {
        steerer.left(45);

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 2 || checkNum === 4 ||
        checkNum === 6 || checkNum === 8) {
        steerer.front();

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 3 || checkNum === 7) {
        steerer.right(45);

        console.log("Minicar steerer state - " + steerer.getSteererState());
    }

    if (checkNum === 9) {
        console.log("Minicar steerer - complete");
        clearInterval(checkTimer);
    }
}, 1000);
