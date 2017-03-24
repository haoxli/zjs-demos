// Driver control:
//     coast, brake, forward, reverse.
// HW:
//   - Arduino 101
//   - PM-R3 expansion board
//   - Motor(JGA25-370)

function Driver() {

    var driver = {};

    var pins = require("arduino101_pins");
    var pwm = require("pwm");

    // IO5, IO6 are implemented by R3 expansion board
    // for reverse and forward function.
    var forwardPin = pwm.open({ channel: pins.IO6 });
    var reversePin = pwm.open({ channel: pins.IO5 });

    // Basic period(ms)
    var period = 20;
    var forwardPW = 0;
    var reversePW = 0;

    // Test that minimal pulse width for the motor is 30%
    var suggestedPW = 30 / 100 * period;

    var setpwm = function (pinName, PWMvalue) {
        pinName.setPeriod(period);
        pinName.setPulseWidth(PWMvalue);
    }

    // check duty cycle
    var dc_check = function (dutycycle) {
        if (!dutycycle || typeof dutycycle !== "number") {
            throw new Error("TypeError: Not a number!");
        } else if (dutycycle < 0 || dutycycle > 100) {
            throw new Error("RangeError: duty cycle is out of " +
                            "limitation(0-100)!");
        }
    }

    // driver state:
    //     park, forward, reverse
    var driverState = null;
    var setDriverState = function (stateValue) {
        driverState = stateValue;
    }

    driver.getDriverState = function () {
        return driverState;
    }

    driver.init = function () {
        // set forward
        var PWMvalue = 0;
        setpwm(forwardPin, PWMvalue);

        // set reverse
        setpwm(reversePin, PWMvalue);

        setDriverState("park");
    }

    // dutycycle: ~0%
    driver.coast = function () {
        forwardPW = 0;
        reversePW = 0;

        setpwm(forwardPin, forwardPW);
        setpwm(reversePin, reversePW);
        console.log("Driver - Coast  (~0%)");

        setDriverState("park");
    }

    // dutycycle: 0%
    driver.brake = function () {
        forwardPW = period;
        reversePW = period;

        setpwm(forwardPin, forwardPW);
        setpwm(reversePin, reversePW);
        console.log("Driver - Brake  (0%)");

        setDriverState("park");
    }

    // 0% <= dutycycle <= 100%
    // perfect: 70%
    driver.forward = function (dutycycle) {
        dc_check(dutycycle);

        if (0 <= dutycycle && dutycycle <= 30) {
            // low dutycycle, set suggested value
            forwardPW = suggestedPW;
        } else {
            forwardPW = period / 100 * dutycycle;
        }

        reversePW = 0;
        setpwm(forwardPin, forwardPW);
        setpwm(reversePin, reversePW);
        console.log("Driver - Forward(" + dutycycle + "%)");

        setDriverState("forward");
    }

    // 0% <= dutycycle <= 100%
    // perfect: 70%
    driver.reverse = function (dutycycle) {
        dc_check(dutycycle);

        forwardPW = 0;

        if (0 <= dutycycle && dutycycle <= 30) {
            // low dutycycle, set suggested value
            reversePW = suggestedPW;
        } else {
            reversePW = period / 100 * dutycycle;
        }

        setpwm(forwardPin, forwardPW);
        setpwm(reversePin, reversePW);
        console.log("Driver - Reverse(" + dutycycle + "%)");

        setDriverState("reverse");
    }

    return driver;
};

module.exports.Driver = new Driver();
