(function() {
  'use strict';

  class CarDemo {
    constructor() {
      this.servUuid = 0xFC00;
      this.driverCharcUuid = 0xFC0A;
      this.iriCharcUuid = 0xFC0B;

      this.btDevice = null;
      this.driverCharacteristic = null;
      this.iriSensorCharacteristic = null;

      this.driverData = null;
      this.steerData = null; 
    }

    connect() {
      return this.requestDevice().then(device => {
        //Connecting to GATT server
        this.btDevice = device;
        return device.gatt.connect();
      })
      .then(server => {
        //Requesting primary service
        return server.getPrimaryService(this.servUuid);
      })
      .then(service => {
        //Requesting characteristics
        return this.fetchDriverCharc(service)
          .then(this.fetchIRISensorCharc(service));
      });
    }

    disconnect() {
      if (!this.btDevice && !this.btDevice.gatt) {
        throw new Error("Internal: No Bluetooth device or connection exists");
      }
      this.btDevice.gatt.disconnect();
    }

    requestDevice() {
      if(this.btDevice) {
        return Promise.resolve(this.btDevice);
      }

      return navigator.bluetooth.requestDevice({
        filters:[
          { name: 'ZJS Demo' },
          { name: 'Arduino101' }
        ],
        optionalServices: [this.servUuid]
      })
      .then(device => {
          this.btDevice = device;
          return device;
      });
    }

    fetchDriverCharc(service) {
      return service.getCharacteristic(this.driverCharcUuid).then(charc => {
        this.driverCharacteristic = charc;
        return this.readDriver();
      });
    }

    fetchIRISensorCharc(service) {
      return service.getCharacteristic(this.iriCharcUuid).then(charc => {
        this.iriSensorCharacteristic = charc;
        return this.readIRISensor();
      });
    }

    readDriver() {
      if(!this.driverCharacteristic)
        return Promise.resolve();

      return this.driverCharacteristic.readValue().then(data => {
        data = data.buffer ? data : new DataView(data);
        this.driverData = data;
      });
    }

    writeDriver(value) {
      if(!this.driverCharacteristic) {
        throw new Error("Invaild Characteristic");
      }
      return this.driverCharacteristic.writeValue(value);
    }

    readIRISensor() {
      if(!this.iriSensorCharacteristic)
        return Promise.resolve();

      return this.iriSensorCharacteristic.readValue().then(data => {
        data = data.buffer ? data : new DataView(data);
        //this.iriData = data;
      });
    }


  }

  window.carDemo = new CarDemo();

})();
