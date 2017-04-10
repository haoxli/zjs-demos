// Driver control:
//     coast, brake, forward, reverse.
// HW:
//   - Arduino 101
//   - PM-R3 expansion board
//   - Motor(JGA25-370)

function Driver() {

    var driver = {};

    // Basic period(ms)
    var period = 20;
    var forwardPW = 0;
    var reversePW = 0;

    // Test that minimal pulse width for the motor is 30%
    var suggestedPW = 30 / 100 * period;

    var setpwm = function (pinName, PWMvalue) {
        if (typeof pinName !== "object") {
            throw new Error("TypeError: Not a object!");
        } else if (pinName === null) {
            throw new Error("Please defind operate pin");
        }

        pinName.setMilliseconds(period, PWMvalue);
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

    // IO5, IO6 are implemented by R3 expansion board
    // for reverse and forward function.
    var FPin = null;
    var RPin = null;

    driver.setForwadPin = function (forwardPin) {
        FPin = forwardPin;
    }

    driver.getForwadPin = function () {
        if (FPin === null) {
            throw new Error("Please defind forward pin first");
        } else {
            return FPin;
        }
    }

    driver.setReversePin = function (reversePin) {
        RPin = reversePin;
    }

    driver.getReversePin = function () {
        if (RPin === null) {
            throw new Error("Please defind reverse pin first");
        } else {
            return RPin;
        }
    }

    driver.init = function () {
        // set forward
        var PWMvalue = 0;
        setpwm(FPin, PWMvalue);

        // set reverse
        setpwm(RPin, PWMvalue);

        setDriverState("park");
        console.log("Driver - Initialization");
    }

    // dutycycle: ~0%
    driver.coast = function () {
        forwardPW = 0;
        reversePW = 0;

        setpwm(FPin, forwardPW);
        setpwm(RPin, reversePW);

        setDriverState("park");
        console.log("Driver - Coast  (~0%)");
    }

    // dutycycle: 0%
    driver.brake = function () {
        forwardPW = period;
        reversePW = period;

        setpwm(FPin, forwardPW);
        setpwm(RPin, reversePW);

        setDriverState("park");
        console.log("Driver - Brake  (0%)");
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
        setpwm(FPin, forwardPW);
        setpwm(RPin, reversePW);

        setDriverState("forward");
        console.log("Driver - Forward(" + dutycycle + "%)");
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

        setpwm(FPin, forwardPW);
        setpwm(RPin, reversePW);

        setDriverState("reverse");
        console.log("Driver - Reverse(" + dutycycle + "%)");
    }

    return driver;
};

module.exports.Driver = new Driver();
