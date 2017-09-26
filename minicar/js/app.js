var $ = window.jQuery;

$(function() {

  let console = function (msg) {
    var $cons = $("#console");
    $cons.html(function (i, oldHtml) {
      return  "<div>" + msg + "</div>" + oldHtml;
    });
  };

  let car = {
    steerDirect: "f",
    angle: 40,
    driverDirect: "b",
    speed: 50,
    // steer directs: Front, Left, Right
    // driver directs: Forward, Reverse, Brake, Coast
    directs: ["f", "l", "r", "b", "c"],

    init: function () {
      this.steerDirect = this.directs[0];
      this.driverDirect = this.directs[4];
      this.sendDirect();
    },

    updateSteer: function (direc) {
      this.steerDirect = direc;
      this.speed = 70;
      this.driverDirect = this.directs[0];

      let str = "";
      switch(this.steerDirect) {
        case this.directs[0]: str = "front"; break;
        case this.directs[1]: str = "left"; break;
        case this.directs[2]: str = "right"; break;
      }
      console("# Turn " + str);
      this.sendDirect();
    },

    updateDriver: function (direc) {
      this.driverDirect = direc;
      this.steerDirect = this.directs[0];

      let str = "";
      switch(this.driverDirect) {
        case this.directs[0]: str = "Forward"; break;
        case this.directs[2]: str = "Backward"; break;
        case this.directs[3]: str = "Brake"; break;
        case this.directs[4]: str = "Coast"; break;
      }
      console("# " + str);
      this.sendDirect();
    },

    stop: function() {
      this.driverDirect = this.directs[3];
      this.sendDirect();
    },

    sendDirect: function () {
      let directArr = [
        this.steerDirect,
        this.angle,
        this.driverDirect,
        this.speed,
        "00"
      ];

      let tmpStr = directArr.toString().replace(/,/g, "");
      let arr = new Array(tmpStr.length);
      for (var i = 0; i < tmpStr.length; i++) {
        arr[i] = tmpStr.charCodeAt(i) & 0xFF;
      }

      carDemo.writeDriver(new Uint8Array(arr));
    }
  }

  // BLE connect
  $("#connectBtn").on("click", function () {
    if ($(this).text() != $(this).attr("data-disc-text")) {
      carDemo.connect().then(() => {
        let deviceName = carDemo.btDevice.name;
        console("Connected to " + deviceName);
        $("#deviceInfo").text(deviceName);
        $("#connectBtn").button("disc");
        car.init();
      }).catch(error => {
        console(error);
      });
    } else {
      $("#connectBtn").button("reset");
      $("#deviceInfo").text("");
      if (!!carDemo.btDevice) {
        carDemo.disconnect();
        console("Disconnect " + carDemo.btDevice.name);
      }
      car.stop();
    }
  });

  $("#leftBtn, #rightBtn, #forwardBtn, #reverseBtn").on({
    "touchstart": function () {
      $(this).css('border-color', '#3af90f');
      $(this).css('color', '#3af90f');

      if ( $(this).attr('id') == "leftBtn"
        || $(this).attr('id') == "rightBtn" ) {
        car.updateSteer($(this).val());
      } else {
        car.updateDriver($(this).val());
      }
    },
    "touchend": function () {
      $(this).css('border-color', '#ccc');
      $(this).css('color', '#333');
      car.stop();
    }
  });

});


