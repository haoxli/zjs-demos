console.log("Minicar driver - start");

var driver = require("Driver.js");

// Minicar driver init
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
