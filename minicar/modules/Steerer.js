// Steerer control:
//     front, left, right.
// HW:
//   - Arduino 101
//   - PM-R3 expansion board
//   - Steering engine(MG996)
// PW   -----------Angle
// 0.5ms-----------0c
// 1.0ms-----------45c
// 1.5ms-----------90c
// 2.0ms-----------135c
// 2.5ms-----------180c

function Steerer() {

    var steerer = {};

    // Basic period(ms)
    var period = 20;
    var pulseWidth = 1.5;
    // PW/Angle: (2.5-0.5) / 180 (ms/c)
    var pw_angle = 0.011;
    var front_angle = 90;
    var current_angle = 0;

    var setpwm = function (pinName, PWMvalue) {
        if (typeof pinName !== "object") {
            throw new Error("TypeError: Not a object!");
        } else if (pinName === null) {
            throw new Error("Please defind operate pin");
        }

        pinName.setMilliseconds(period, PWMvalue);
    }

    // check angle
    var angle_check = function (angle) {
        if (angle === null || typeof angle !== "number") {
            throw new Error("TypeError: Not a number!");
        } else if (angle < 0 || angle > 45) {
            throw new Error("RangeError: angle is " +
                            "out of limitation(0-45)!");
        }
    }

    // steerer state:
    //     front, left, right
    var steererState = null;
    var setSteererState = function (stateValue) {
        steererState = stateValue;
    }

    steerer.getSteererState = function () {
        if (steererState === null) {
            throw new Error("Please initialize Minicar first");
        }

        return steererState;
    }

    var SPin = null;
    steerer.setSteerPin = function (steerPin) {
        SPin = steerPin;
    }

    steerer.getSteerPin = function () {
        if (SPin === null) {
            throw new Error("Please defind steer pin first");
        }

        return SPin;
    }

    steerer.init = function() {
        pulseWidth = 1.5;
        setpwm(SPin, pulseWidth);

        setSteererState("front");
        console.log("Steerer - Initialization");
    }

    // angle: 90c
    steerer.front = function () {
        pulseWidth = 1.5;
        setpwm(SPin, pulseWidth);

        current_angle = 0;
        setSteererState("front");
        console.log("Steerer - Turn front(90c)");
    }

    // 0c < angle < 45c
    steerer.left = function (angle) {
        angle_check(angle);

        if (angle === 0) {
            this.front();
            return;
        }

        if (this.getSteererState() === "left") {
            if (angle === current_angle) {
                console.log("Steerer - Already be left (" + angle + "c)");
            } else {
                console.log("Steerer - Turn left from (" + current_angle +
                            "c) to (" + angle + "c)");
            }
        } else {
            console.log("Steerer - Turn left (" + angle + "c)");
        }

        pulseWidth = 0.5 + (front_angle - angle) * pw_angle;
        setpwm(SPin, pulseWidth);

        current_angle = angle;
        setSteererState("left");
    }

    // 0c < angle < 45c
    steerer.right = function (angle) {
        angle_check(angle);

        if (angle === 0) {
            this.front();
            return;
        }

        if (this.getSteererState() === "right") {
            if (angle === current_angle) {
                console.log("Steerer - Already be right (" + angle + "c)");
            } else {
                console.log("Steerer - Turn right from (" + current_angle +
                            "c) to (" + angle + "c)");
            }
        } else {
            console.log("Steerer - Turn right (" + angle + "c)");
        }

        pulseWidth = 0.5 + (front_angle + angle) * pw_angle;
        setpwm(SPin, pulseWidth);

        current_angle = angle;
        setSteererState("right");
    }

    return steerer;
};

module.exports.Steerer = new Steerer();
