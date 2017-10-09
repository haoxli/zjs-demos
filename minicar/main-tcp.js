// Minicar TCP communicating protocol:
//     steerer(1byte) + angle(2byte) + driver(1byte) + speed(2byte) + others(2byte)
// steerer:
//     front: f >>> 0x66
//     left : l >>> 0x6c
//     right: r >>> 0x72
// driver:
//     coast(park): c >>> 0x63
//     brake(park): b >>> 0x62
//     forward    : f >>> 0x66
//     reverse    : r >>> 0x72
// flag:
//     true : t >>> 0x74
//     false: f >>> 0x66
// number:
//     0 ~ 9 >>> 0x30 ~ 0x39
// char:
//     a ~ z >>> 0x61 ~ 0x7a

console.log("Minicar is controlled by TCP6 " +
            "using IR infrared sensor avoid obstacle");

var gpio = require("gpio");
var pwm = require("pwm");
var net = require("net");
var pins = require("arduino101_pins");
var steerer = require("Steerer.js");
var driver = require("Driver.js");
var netCfg = require("net-config");

var IPv6Port = 9876;
var IPv6Address = "2001:db8::10";
var IPv6Family = 6;
netCfg.setStaticIP(IPv6Address);
var BLEAddress = "F1:E2:D3:C4:B5:A6";
netCfg.setBleAddress(BLEAddress);

// Minicar init
var steerPin = pwm.open({ channel: pins.IO3 });
steerer.setSteerPin(steerPin);
steerer.init();

var forwardPin = pwm.open({ channel: pins.IO6 });
var reversePin = pwm.open({ channel: pins.IO5 });
driver.setForwadPin(forwardPin);
driver.setReversePin(reversePin);
driver.init();

// Buffer init
var basicBuffer = new Buffer(8);
var sensorBuffer = new Buffer(1);

// IRI sensor init
var sensorPin = gpio.open({
    pin: 2,
    mode: "in",
    edge: "any"
});
var IRISensorFlag = false;
var SensorPinValue, IRItimer;

IRItimer = setInterval(function () {
    SensorPinValue = sensorPin.read();
    IRISensorFlag = !SensorPinValue;

    if (driver.getDriverState() === "forward" && IRISensorFlag) {
        driver.brake();
    }
}, 300);

var server = net.createServer();

var serverOptions = {
    port: IPv6Port,
    host: IPv6Address,
    family: IPv6Family
}

server.listen(serverOptions);

var speed = 50;
var angle = 30;
var CPFlag = true;

var BuftoNum = function (buf) {
    var Num = 0;
    var checkValue = 0x30;

    for (var j = 0; j < 10; j++) {
        if (buf === checkValue + j) return Num + j;
    }
}

server.on("connection", function(sock) {
    console.log("Minicar TCP - accept connection: " + sock.address().address +
                ":" + sock.address().port);

    sock.on("data", function(buf) {
        // filtering invalid BLE communicating protocol
        if (buf.length === 8) {
            if (buf.readUInt8(0) === 0x66 ||
                buf.readUInt8(0) === 0x6c ||
                buf.readUInt8(0) === 0x72) {
                if (((0x30 <= buf.readUInt8(1) &&
                      buf.readUInt8(1) <= 0x33) &&
                     (0x30 <= buf.readUInt8(2) &&
                      buf.readUInt8(2) <= 0x39)) ||
                    (buf.readUInt8(1) === 0x34 &&
                     (0x30 <= buf.readUInt8(2) &&
                      buf.readUInt8(2) <= 0x35))) {
                    if (buf.readUInt8(3) === 0x63 ||
                        buf.readUInt8(3) === 0x62 ||
                        buf.readUInt8(3) === 0x66 ||
                        buf.readUInt8(3) === 0x72) {
                        if ((0x30 <= buf.readUInt8(4) &&
                             buf.readUInt8(4) <= 0x39) &&
                            (0x30 <= buf.readUInt8(5) &&
                             buf.readUInt8(5) <= 0x39)) {
                            CPFlag = true;
                        } else {
                            console.log("Minicar TCP - invalid driving speed");
                            CPFlag = false;
                        }
                    } else {
                        console.log("Minicar TCP - invalid driving operator");
                        CPFlag = false;
                    }
                } else {
                    console.log("Minicar TCP - invalid steering angle");
                    CPFlag = false;
                }
            } else {
                console.log("Minicar TCP - invalid steering operator");
                CPFlag = false;
            }
        } else {
            console.log("Minicar TCP - invalid communicating protocol length");
            CPFlag = false;
        }

        if (CPFlag) {
            // handle TCP communicating protocol
            var angleTens = BuftoNum(buf.readUInt8(1));
            var angleOnes = BuftoNum(buf.readUInt8(2));
            angle = angleTens * 10 + angleOnes;

            var speedTens = BuftoNum(buf.readUInt8(4));
            var speedOnes = BuftoNum(buf.readUInt8(5));
            speed = speedTens * 10 + speedOnes;

            if (buf.readUInt8(0) === 0x66) {
                steerer.front();
            } else if (buf.readUInt8(0) === 0x6c) {
                steerer.left(angle);
            } else if (buf.readUInt8(0) === 0x72) {
                steerer.right(angle);
            }

            if (buf.readUInt8(3) === 0x63) {
                driver.coast();
            } else if (buf.readUInt8(3) === 0x62) {
                driver.brake();
            } else if (buf.readUInt8(3) === 0x66) {
                if (!IRISensorFlag) {
                    driver.forward(speed);
                }
            } else if (buf.readUInt8(3) === 0x72) {
                driver.reverse(speed);
            }

            console.log("Minicar TCP - receive data '" +
                        buf.toString('hex') + "'");
            console.log("Minicar TCP - control success");
        }
    });

    sock.on("error", function(err) {
        console.log("Minicar TCP - connection error: " + err.name);
    });

    sock.on("close", function() {
        console.log("Minicar TCP - connection is closed");
    });
});

server.on("close", function() {
    console.log("Minicar TCP - server is closed");
});

server.on("error", function() {
    console.log("Minicar TCP - create server failed");
});
