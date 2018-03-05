// Driver control:
//     coast, brake, forward, reverse.
// HW:
//   - Arduino 101
//   - PM-R3 expansion board
//   - Motor(JGA25-370)

function Driver() {

    var driver = {};

    var EventEmitter = require('events');
    var driverEmitter = new EventEmitter();

    var period = 20;              // Basic period(ms)
    var forwardPW = 0;
    var reversePW = 0;
    var current_dutycycle = 0;
    var speedRegulation = 60;     // Starting speed
    var delayCoefficient = 15;    // Starting time(*20)
    var pulseFlag = false;
    var pulseTimer = null;

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
        if (pulseFlag === false) {
            console.log("Driver - Coast  (~0%)");
        }
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

        if (pulseFlag === false) {
            if (0 < dutycycle && dutycycle < 30) {
                // low dutycycle, give warning message
                console.log("Driver - Underpowered !");
            }

            if (this.getDriverState() === "forward") {
                if (dutycycle === current_dutycycle) {
                    console.log("Driver - Already be Forward (" +
                                dutycycle + "%)");
                } else {
                    console.log("Driver - Forward from (" + current_dutycycle +
                                "%) to (" + dutycycle + "%)");
                }
            } else {
                console.log("Driver - Forward (" + dutycycle + "%)");
            }
        }

        reversePW = 0;
        setpwm(RPin, reversePW);

        // Starting speed regulation
        if (this.getDriverState() === "park" && pulseFlag === false) {
            forwardPW = speedRegulation / 100 * period;
            setpwm(FPin, forwardPW);

            setTimeout(function () {
                forwardPW = dutycycle / 100 * period;
                setpwm(FPin, forwardPW);
            }, 20 * delayCoefficient);
        } else {
            forwardPW = dutycycle / 100 * period;
            setpwm(FPin, forwardPW);
        }

        current_dutycycle = dutycycle;
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

        if (pulseFlag === false) {
            if (0 < dutycycle && dutycycle <= 30) {
                // low dutycycle, give warning message
                console.log("Driver - Underpowered !");
            }

            if (this.getDriverState() === "reverse") {
                if (dutycycle === current_dutycycle) {
                    console.log("Driver - Already be Reverse (" +
                                dutycycle + "%)");
                } else {
                    console.log("Driver - Reverse from (" + current_dutycycle +
                                "%) to (" + dutycycle + "%)");
                }
            } else {
                console.log("Driver - Reverse (" + dutycycle + "%)");
            }
        }

        forwardPW = 0;
        setpwm(FPin, forwardPW);

        // Starting speed regulation
        if (this.getDriverState() === "park" && pulseFlag === false) {
            reversePW = speedRegulation / 100 * period;
            setpwm(RPin, reversePW);

            setTimeout(function () {
                reversePW = dutycycle / 100 * period;
                setpwm(RPin, reversePW);
            }, 20 * delayCoefficient);
        } else {
            reversePW = dutycycle / 100 * period;
            setpwm(RPin, reversePW);
        }

        current_dutycycle = dutycycle;
        setDriverState("reverse");
    }

    var basicDutycycle = 30;
    var smooth = 2;
    var increaseCount = 1;
    var forwardCount = 1;
    var coastCount = 1;
    driverEmitter.on("driverEvent", function(countEvent) {
        if (countEvent % coastCount < increaseCount) {
            driver.forward((countEvent % coastCount) * smooth + basicDutycycle);
        }

        if (countEvent % coastCount === forwardCount) {
            driver.coast();
        }
    });

    // Module: pulse
    //      dutycycle: peak value
    //   forwardDelay: peak value time
    //     coastDelay: coasting time
    driver.pulseStart = function (dutycycle, forwardDelay, coastDelay) {
        if (!pulseFlag) {
            console.log("Driver - Pulse mode is starting");
            pulseFlag = true;
        }

        smooth = 2;
        increaseCount = ((dutycycle - basicDutycycle) / smooth) | 0;
        forwardCount = (forwardDelay / period + increaseCount) | 0;
        coastCount = (coastDelay / period + forwardCount) | 0;

        if (pulseTimer === null) {
            var count = 0;
            pulseTimer = setInterval(function () {
                driverEmitter.emit("driverEvent", count);
                count++;
            }, period);
        }
    }

    driver.pulseStop = function () {
        if (pulseTimer !== null) {
            console.log("Driver - Pulse mode is stop");
            clearInterval(pulseTimer);
            pulseFlag = false;
            pulseTimer = null;
        }
    }

    driver.getPulseFlag = function () {
        return pulseFlag;
    }

    return driver;
};

module.exports.Driver = new Driver();
