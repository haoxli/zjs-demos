// Copyright (c) 2017, Intel Corporation.
// Wire:
//   Infrared tracking module
//     S5 -> IO10
//     S4 -> IO8
//     S3 -> IO7
//     S2 -> IO4
//     S1 -> IO2
//     GND -> GDN
//     VCC -> 3.3v
//   
//   LED
//     - Wire short leg of green and red led to GND
//     - Wire long leg of green led to IO11
//     - Wire long leg of red led to IO13


console.log("Minicar tracking - start");

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
setTimeout(function () {
  driver.forward(30);
}, 1000);

var greenLED = gpio.open({
    pin: pins.IO11,
    direction: 'out'
});
var redLED = gpio.open({
    pin: pins.IO13,
    direction: 'out'
});

// right -> left: IO8, IO7, IO4, IO2, IO10 
var input1 = gpio.open({
    pin: pins.IO8,
    direction: 'in',
    edge: 'any',
    activeLow: true
});
var input2 = gpio.open({
    pin: pins.IO7,
    direction: 'in',
    edge: 'any',
    activeLow: true
});
var input3 = gpio.open({
    pin: pins.IO4,
    direction: 'in',
    edge: 'any',
    activeLow: true
});
var input4 = gpio.open({
    pin: pins.IO2,
    direction: 'in',
    edge: 'any',
    activeLow: true
});
var input5 = gpio.open({
    pin: pins.IO10,
    direction: 'in',
    edge: 'any',
    activeLow: true
});

input1.onchange = function (event) {
    if (event.value) {
        console.log("1 # right cross the border");
        steerer.left(45);
    }
    redLED.write(event.value);
};

input2.onchange = function (event) {
    if (event.value) {
        console.log("2 # right cross the border");
        steerer.left(30);
    }
    redLED.write(event.value);
};
input3.onchange = function (event) {
    if (event.value) {
        console.log("3 # go ahead");
        steerer.front();
    }
    greenLED.write(event.value);
};

input4.onchange = function (event) {
    if (event.value) {
        console.log("4 # left cross the border");
        steerer.right(30);
    }
    redLED.write(event.value);
};

input5.onchange = function (event) {
    if (event.value) {
        console.log("5 # left cross the border");
        steerer.right(45);
    }
    redLED.write(event.value);
};


