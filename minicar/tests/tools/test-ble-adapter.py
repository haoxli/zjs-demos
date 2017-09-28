# !usr/bin/python
# coding:utf-8

# Need pygatt tool for BLE communication:
#     https://github.com/peplin/pygatt

import time
import pygatt
import threading
from pygatt import BLEDevice

class BLEAdapter:

    def __init__(self):
        self.remote_devices_type = pygatt.BLEAddressType.random
        self.adapter = pygatt.GATTToolBackend()
        self.adapter.start()
        self.remote_devices = ""

    def scan_remote_devices(self):
        self.remote_devices = self.adapter.scan()
        return self.remote_devices

    def _scan_device(self, remote_devices, device_name):
        for i in range(len(remote_devices)):
            for key, value in remote_devices[i].items():
                if value == device_name:
                    remote_device = remote_devices[i]

        device_address = remote_device.get("address")
        return device_address

    def get_device_address(self, device_name):
        if self.remote_devices == "":
            self.scan_remote_devices()

        device_address = self._scan_device(self.remote_devices, device_name)
        return device_address

    def connect_device(self, address):
        device_con = self.adapter.connect(address, address_type = self.remote_devices_type)
        return device_con

class RemoteBLEDevice:

    def __init__(self, con_device):
        self.con_device = con_device
        self.characteristics = self.con_device.discover_characteristics()

    def get_uuid_and_handle(self, uuid_short):
        for key, value in self.characteristics.items():
            if uuid_short in value.uuid:
                char_uuid_full = value.uuid
                char_handle = value.handle

        return char_uuid_full, char_handle

    def read_value(self, uuid_full):
        value = (self.con_device.char_read(uuid_full)).decode("utf-8")
        return value

    def write_value(self, handle, value):
        self.con_device.char_write_handle(handle, bytearray(value, "utf-8"))

    def device_bond(self):
        self.con_device.bond()

    def device_subscribe(self, uuid_full, callback):
        self.con_device.subscribe(uuid_full, callback)

def main():
    print "BLE Adapter - start init...."

    CMD = "f30b5000"
    event_car = threading.Event()
    event_joystick = threading.Event()
    event_car_write = threading.Event()

    adapter = BLEAdapter()
    adapter.scan_remote_devices()

    BLE_name_car = "Minicar BLE"
    address_car = adapter.get_device_address(BLE_name_car)
    print "Mini Car - BLE address '%s'" %address_car

    BLE_name_joystick = "JoyStick BLE"
    address_joystick = adapter.get_device_address(BLE_name_joystick)
    print "Joy Stick - BLE address '%s'" %address_joystick

    def func_car(address_car):
        print "Mini Car - start init...."

        adapter_car = BLEAdapter()
        event_car.wait()

        try:
            con_car = adapter_car.connect_device(address_car)
            print "Mini Car - be connected"

            devices_car = RemoteBLEDevice(con_car)
            devices_car.device_bond()

            car_driver_uuid_short = "ff10"
            car_driver_uuid_full, car_driver_handle = devices_car.get_uuid_and_handle(car_driver_uuid_short)
            car_sensor_uuid_short = "ff20"
            car_sensor_uuid_full, car_sensor_handle = devices_car.get_uuid_and_handle(car_sensor_uuid_short)
        except :
            print "Mini Car - please reboot A101 board"

        while 1:
            global CMD
            event_car_write.wait()

            try:
                devices_car.write_value(car_driver_handle, CMD)
                print "Mini Car - send data '%s'" %CMD
            except :
                print "Mini Car - please reboot A101 board"

            event_car_write.clear()

    def func_joystick(address_joystick):
        print "Joy Stick - start init...."

        adapter_joystick = BLEAdapter()
        event_joystick.wait()

        try:
            con_JS = adapter_joystick.connect_device(address_joystick)
            print "Joy Stick - be connected"

            devices_JS = RemoteBLEDevice(con_JS)
            devices_JS.device_bond()

            JS_notify_uuid_short = "fffa"
            JS_notify_uuid_full, JS_notify_handle = devices_JS.get_uuid_and_handle(JS_notify_uuid_short)
            JS_read_uuid_short = "fffb"
            JS_read_uuid_full, JS_read_handle = devices_JS.get_uuid_and_handle(JS_read_uuid_short)
        except :
            print "Joy Stick - please reboot A101 board"

        def _joystick_callback_func(handle, value):
            global CMD
            CMD = value.decode("utf-8")
            event_car_write.set()
            print "Joy Stick - get data '%s'" %CMD

        devices_JS.device_subscribe(JS_notify_uuid_full, _joystick_callback_func)
        print "Joy Stick - subscribe"
        print "BLE Adapter - all init completed"

    thread_car = threading.Thread(target=func_car, args=(address_car,))
    thread_joystick = threading.Thread(target=func_joystick, args=(address_joystick,))

    thread_car.setDaemon(True)
    thread_car.start()

    time.sleep(10)
    thread_joystick.setDaemon(True)
    thread_joystick.start()

    time.sleep(10)
    event_car.set()

    time.sleep(10)
    event_joystick.set()

    while 1:
        try :
            time.sleep(2)
        except KeyboardInterrupt :
            print "BLE Adapter - exit"
            break
        except :
            print "BLE Adapter - error"
            continue

if __name__ == "__main__" :
    print "Test to control mini car using joy stick"
    main()
