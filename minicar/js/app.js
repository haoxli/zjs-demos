var $ = window.jQuery;

$(function() {

  $("div.footer").hide();

  let console = function (msg) {
    var $cons = $("#console");
    $cons.html(function (i, oldHtml) {
      return oldHtml + "<div>" + msg + "</div>" ;
    });
    $cons.scrollTop($cons[0].scrollHeight);
  };

  let car = {
    steerDirect: "f",
    angle: 0,
    angleOffset: 5,
    driverDirect: "f",
    speed: 0,
    speedOffset: 5,
    initSpeed: 30,
    maxSpeed: 95,
    // steer directs: Front, Left, Right
    // driver directs: Forwad, Reverse, Brake, Coast
    directs: ["f", "l", "r", "b", "c"],

    init: function () {
      this.steerDirect = this.directs[0];
      this.angle = 0; //initial angle
      this.driverDirect = this.directs[0];
      this.speed = this.initSpeed; //initial speed
      this.sendDirect();
    },

    updateSteer: function (direc) {
      var changed = false;
      if(direc != this.steerDirect) {
        if (direc == this.directs[0]) {
          this.angle = 0;
        } else {
          this.angle = this.angleOffset;
        }
        this.steerDirect = direc;
        changed = true;
      } else {
        if (direc != this.directs[0] && this.angle < 45) {
          this.angle += this.angleOffset;
          changed = true;
        }
      }
      if (changed) {
        var str = "";
        switch(this.steerDirect) {
          case this.directs[0]: str = "Front"; break;
          case this.directs[1]: str = "Left"; break;
          case this.directs[2]: str = "Right"; break;
        }
        console("# Turn: " + str + " " + this.angle + "°");
        this.sendDirect();
      }
    },

    updateDriverDirec: function (direc) {
      // direction changed with initial speed
      if (direc != this.driverDirect) {
        this.speed = this.initSpeed;

        this.driverDirect = direc;
        switch(this.driverDirect) {
          case this.directs[0]: str = "Forwad"; break;
          case this.directs[2]: str = "Reverse"; break;
          case this.directs[3]: str = "Brake"; break;
          case this.directs[4]: str = "Coast"; break;
        }
        console("# Direct: " + str + "  #Speed: " + this.speed);
        this.sendDirect();
      }
    },

    updateSpeed: function (offset) {
      var speed  = this.speed + offset;
      // keep speed between 30 ~ 100
      if (speed >= this.initSpeed && speed <= this.maxSpeed) {
        this.speed = speed;
        console("# Speed: " + this.speed);
        this.sendDirect();
      }
    },

    stop: function() {
      console("# Brake...");
      this.driverDirect = this.directs[3];
      this.sendDirect();
    },

    sendDirect: function () {
      let directArr = [
        this.steerDirect,
        this.angle < 10 ? "0" + this.angle 
                        : "" + this.angle,
        this.driverDirect,
        this.speed< 10 ? "0" + this.speed
                       : "" + this.speed,
        "00"
      ];

      let tmpStr = directArr.toString().replace(/,/g, "");
      console(tmpStr);
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
        $("#onSwt").bootstrapSwitch("disabled", false);
      }).catch(error => {
        console(error);
      });
    } else {
      $("#connectBtn").button("reset");
      $("#onSwt").bootstrapSwitch("state", false);
      $("#onSwt").bootstrapSwitch("disabled", true);
      $("#deviceInfo").text("");
      if (!!carDemo.btDevice) {
        carDemo.disconnect();
        console("Disconnect " + carDemo.btDevice.name);
      }
    }
  });

  // On/Off
  $("#onSwt").bootstrapSwitch({
    onColor: "success",
    offColor:"warning",
    size:"small",
    state: false,
    disabled: true,
    onSwitchChange:function(event, state){
      if (state) {
        car.init();
        $("#directionSwt").bootstrapSwitch("state", true);
        $("div.footer").show(1000);
      } else {
        car.stop();
        $("div.footer").hide();
      }
    }
  });

  // steer driection control
  let steerInterval = null;
  $("#leftBtn, #frontBtn, #rightBtn").on({
    "touchstart": function () {
      var sd = $(this).val();
      car.updateSteer(sd);
      if(!!steerInterval || sd === car.directs[0]) {
        return;
      }
      steerInterval = setInterval(function () {
        car.updateSteer(sd);
      }, 200);
    },
    "touchend": function () {
      if(!!steerInterval) {
        clearInterval(steerInterval);
        steerInterval = null;
      }
    }
  });

  // driver direction control
  $("#directionSwt").bootstrapSwitch({
    onText: "Fwd",
    offText: "Rvs",
    state: true,
    disabled: false,
    onSwitchChange: function(event, state){
      if (state) {
        car.updateDriverDirec("f");
      } else {
        car.updateDriverDirec("r");
      }
    }
  });

  // speed control
  let speedInterval = null;
  $("#speedUpBtn").on({
    "touchstart": function () {
      car.updateSpeed(car.speedOffset);
      if(!!speedInterval) {
        return;
      }
      speedInterval = setInterval(function () {
        car.updateSpeed(car.speedOffset);
      }, 500);
    },
    "touchend": function () {
      if(!!speedInterval) {
        clearInterval(speedInterval);
        speedInterval = null;
      }
    }
  });

  $("#speedDownBtn").on({
    "touchstart": function () {
      car.updateSpeed(-(car.speedOffset));
      if(!!speedInterval) {
        return;
      }
      speedInterval = setInterval(function () {
        car.updateSpeed(-(car.speedOffset));
      }, 500);
    },
    "touchend": function () {
      if(!!speedInterval) {
        clearInterval(speedInterval);
        speedInterval = null;
      }
    }
  });

});


