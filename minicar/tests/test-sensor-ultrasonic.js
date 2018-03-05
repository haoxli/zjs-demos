console.log("Mini Car avoid obstacle using ultrasonic sensor");

var gpio = require("gpio");
var gpio = require("gpio");
var pwm = require("pwm");
var pins = require("arduino101_pins");
var steerer = require("Steerer.js");
var driver = require("Driver.js");

// Car Init
var steerPin = pwm.open({ channel: pins.IO3 });
steerer.setSteerPin(steerPin);
steerer.init();

var forwardPin = pwm.open({ channel: pins.IO6 });
var reversePin = pwm.open({ channel: pins.IO5 });
driver.setForwadPin(forwardPin);
driver.setReversePin(reversePin);
driver.init();

driver.forward(70);

var pin2 = gpio.open({
    pin: 2,
    mode: "in",
    edge: "any"
});

var pin13 = gpio.open({ pin: 13 });
pin13.write(0);

var count = 0;
setInterval(function () {
    console.log("output----");
    count = 0;
    pin13.write(1);
    pin13.write(0);
    for (var i = 0; i < 100; i++) {
        if (pin2.read()) {
            count++;
        }
    }
    if (count < 15 && count !== 0) {
        if (driver.getDriverState() !== "park") {
            driver.brake();
        }

        console.log("obstacles: yes - " + count);
    } else {
        if (driver.getDriverState() !== "forward") {
            driver.forward(70);
        }

        console.log("obstacles: no - " + count);
    }
}, 200);
