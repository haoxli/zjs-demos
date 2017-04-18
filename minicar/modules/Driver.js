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
    var current_dutycycle = 0;

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
        if (dutycycle === null || typeof dutycycle !== "number") {
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
        if (driverState === null) {
            throw new Error("Please initialize Minicar first");
        }

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
        }

        return FPin;
    }

    driver.setReversePin = function (reversePin) {
        RPin = reversePin;
    }

    driver.getReversePin = function () {
        if (RPin === null) {
            throw new Error("Please defind reverse pin first");
        }

        return RPin;
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

        current_dutycycle = 0;
        setDriverState("park");
        console.log("Driver - Coast  (~0%)");
    }

    // dutycycle: 0%
    driver.brake = function () {
        forwardPW = period;
        reversePW = period;

        setpwm(FPin, forwardPW);
        setpwm(RPin, reversePW);

        current_dutycycle = 0;
        setDriverState("park");
        console.log("Driver - Brake  (0%)");
    }

    // 0% <= dutycycle <= 100%
    // perfect: 70%
    driver.forward = function (dutycycle) {
        dc_check(dutycycle);

        if (dutycycle === 0) {
            this.coast();
            return;
        }

        var DutycycleTmp;
        if (0 < dutycycle && dutycycle <= 30) {
            // low dutycycle, set suggested value
            forwardPW = suggestedPW;
            DutycycleTmp = 30;
            console.log("Driver - Underpowered ! Corrected to (30%)");
        } else {
            forwardPW = period / 100 * dutycycle;
            DutycycleTmp = dutycycle;
        }

        if (this.getDriverState() === "forward") {
            if (DutycycleTmp === current_dutycycle) {
                console.log("Driver - Already be Forward ("
                            + DutycycleTmp + "%)");
            } else {
                console.log("Driver - Forward from (" + current_dutycycle +
                            "%) to (" + DutycycleTmp + "%)");
            }
        } else {
            console.log("Driver - Forward (" + DutycycleTmp + "%)");
        }

        reversePW = 0;
        setpwm(FPin, forwardPW);
        setpwm(RPin, reversePW);

        current_dutycycle = DutycycleTmp;
        setDriverState("forward");
    }

    // 0% <= dutycycle <= 100%
    // perfect: 70%
    driver.reverse = function (dutycycle) {
        dc_check(dutycycle);

        if (dutycycle === 0) {
            this.coast();
            return;
        }

        var DutycycleTmp;
        if (0 < dutycycle && dutycycle <= 30) {
            // low dutycycle, set suggested value
            reversePW = suggestedPW;
            DutycycleTmp = 30;
            console.log("Driver - Underpowered ! Corrected to (30%)");
        } else {
            reversePW = period / 100 * dutycycle;
            DutycycleTmp = dutycycle;
        }

        if (this.getDriverState() === "reverse") {
            if (DutycycleTmp === current_dutycycle) {
                console.log("Driver - Already be Reverse ("
                            + DutycycleTmp + "%)");
            } else {
                console.log("Driver - Reverse from (" + current_dutycycle +
                            "%) to (" + DutycycleTmp + "%)");
            }
        } else {
            console.log("Driver - Reverse (" + DutycycleTmp + "%)");
        }

        forwardPW = 0;
        setpwm(FPin, forwardPW);
        setpwm(RPin, reversePW);

        current_dutycycle = DutycycleTmp;
        setDriverState("reverse");
    }

    return driver;
};

module.exports.Driver = new Driver();
