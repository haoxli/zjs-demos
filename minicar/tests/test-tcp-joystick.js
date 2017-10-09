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
// number:
//     0 ~ 9 >>> 0x30 ~ 0x39
// char:
//     a ~ z >>> 0x61 ~ 0x7a

// Software requirements:
//     main-tcp.js on Mini car using 6LowPan BLE.
//     test-tcp-joystick.js on another Arduino 101 board using ENC28J60 ethernet board.
//     test-tcp-adapter.py on Ubuntu 16.04.
// Hardware Requirements:
//     A BLE adapter.
//     A Joy Stick.
//     Mini car board and another Arduino 101 board.
// Wiring:
//     For Joy Stick:
//         Wire all G on the JoyStick to GND on the Arduino 101
//         Wire all V on the JoyStick to Vcc(5v) on the Arduino 101
//         Wire X on the JoyStick to A0 on the Arduino 101
//         Wire Y on the JoyStick to A1 on the Arduino 101
//         Wire K on the JoyStick to A2 on the Arduino 101

console.log("Test toy stick mode");

var aio = require("aio");
var pins = require("arduino101_pins");
var net = require("net");

var IPv4Port = 9876;
var IPv4Address = "0.0.0.0";
var IPv4Family = 4;

var pinA = aio.open({pin: pins.A0});
var pinB = aio.open({pin: pins.A1});
var pinC = aio.open({pin: pins.A2});

var Xstatus = "f";
var Xstatustmp = "f";
var Ystatus = "b";
var Ystatustmp = "b";
var upLine = 3500;
var downLine = 500;
var precision = 50;
var speed = 70;
var angle = 40;

var NumtoBuf = function (num) {
    var buf = 0x30;
    var checkValue = 0;

    for (var j = 0; j < 10; j++) {
        if (num === checkValue + j) return buf + j;
    }
}

var StrtoBuf = function (Str) {
    if (Str === "b") return 0x62;
    if (Str === "f") return 0x66;
    if (Str === "l") return 0x6c;
    if (Str === "r") return 0x72;
}

var CMDBuf = function (steerer, driver) {
    var JSBuffer = new Buffer(8);

    var SteererbufData = StrtoBuf(steerer);
    JSBuffer.writeUInt8(SteererbufData, 0);

    var angleTens = (angle / 10) | 0;
    var AngleTensbufData = NumtoBuf(angleTens);
    JSBuffer.writeUInt8(AngleTensbufData, 1);

    var angleOens = angle - angleTens * 10;
    var AngleOensbufData = NumtoBuf(angleOens);
    JSBuffer.writeUInt8(AngleOensbufData, 2);

    var DriverbufData = StrtoBuf(driver);
    JSBuffer.writeUInt8(DriverbufData, 3);

    var speedTens = (speed / 10) | 0;
    var SpeedTensbufData = NumtoBuf(speedTens);
    JSBuffer.writeUInt8(SpeedTensbufData, 4);

    var speedOens = speed - speedTens * 10;
    var SpeedOensbufData = NumtoBuf(speedOens);
    JSBuffer.writeUInt8(SpeedOensbufData, 5);

    var NullbufData = 0x00;
    JSBuffer.writeUInt8(NullbufData, 6);
    JSBuffer.writeUInt8(NullbufData, 7);

    return JSBuffer
}

var server = net.createServer();

var serverOptions = {
    port: IPv4Port,
    host: IPv4Address,
    family: IPv4Family
}

server.listen(serverOptions);

server.on("connection", function(sock) {
    console.log("JoyStick TCP - accept connection: " + sock.address().address +
                ":" + sock.address().port);

    sock.on("data", function(buf) {
        console.log("JoyStick TCP - receive data '" + buf.toString('hex') + "'");
    });

    sock.on("error", function(err) {
        console.log("JoyStick TCP - connection error: " + err.name);
    });

    sock.on("close", function() {
        console.log("JoyStick TCP - connection is closed");
        clearInterval(getValue);
    });

    var getValue = setInterval(function () {
        if (0 <= pinA.read() && pinA.read() <= downLine) {
            if (Xstatus !== "r") {
                Xstatus = "r";
            }
        } else if (upLine <= pinA.read() && pinA.read() <= 5000) {
            if (Xstatus !== "l") {
                Xstatus = "l";
            }
        } else {
            if (Xstatus !== "f") {
                Xstatus = "f";
            }
        }

        if (0 <= pinB.read() && pinB.read() <= downLine) {
            if (Ystatus !== "f") {
                Ystatus = "f";
            }
        } else if (upLine <= pinB.read() && pinB.read() <= 5000) {
            if (Ystatus !== "r") {
                Ystatus = "r";
            }
        } else {
            if (Ystatus !== "b") {
                Ystatus = "b";
            }
        }

        if (Xstatus !== Xstatustmp || Ystatus !== Ystatustmp) {
            console.log("JoyStick TCP - CMD '" + Xstatus +
                        speed + Ystatus + angle + "00'");

            Xstatustmp = Xstatus;
            Ystatustmp = Ystatus;

            var sendBuf = CMDBuf(Xstatus, Ystatus);
            sock.write(sendBuf);
        }
    }, precision);
});

server.on("close", function() {
    console.log("JoyStick TCP - server is closed");
});

server.on("error", function() {
    console.log("JoyStick TCP - create server failed");
});
