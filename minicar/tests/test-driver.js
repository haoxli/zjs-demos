console.log("Minicar driver - start");

var driver = require("Driver.js");
var pwm = require("pwm");
var pins = require("arduino101_pins");

// Minicar driver init
var forwardPin = pwm.open({ channel: pins.IO6 });
var reversePin = pwm.open({ channel: pins.IO5 });
driver.setForwadPin(forwardPin);
driver.setReversePin(reversePin);
driver.init();

var checkNum = 0;
var checkTimer = setInterval(function() {
    checkNum++;

    if (checkNum === 1 || checkNum === 5) {
        driver.forward(70);

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 2 || checkNum === 4) {
        driver.coast();

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 6 || checkNum === 8) {
        driver.brake();

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 3 || checkNum === 7) {
        driver.reverse(70);

        console.log("Minicar driver state - " + driver.getDriverState());
    }

    if (checkNum === 9) {
        console.log("Minicar drive - complete");
        clearInterval(checkTimer);
    }
}, 1000);
