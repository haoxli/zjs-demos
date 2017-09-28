# !usr/bin/python
# coding:utf-8

import time
import socket
import threading
import commands

def main():
    print "TCP Adapter - start init...."

    commands.getoutput("modprobe bluetooth_6lowpan")
    time.sleep(2)
    commands.getoutput("echo 1 > /sys/kernel/debug/bluetooth/6lowpan_enable")
    time.sleep(2)
    commands.getoutput("echo 'connect F1:E2:D3:C4:B5:A6 2' > /sys/kernel/debug/bluetooth/6lowpan_control")
    time.sleep(2)
    commands.getoutput("ip -6 route add 2001:db8::/64 dev bt0")
    time.sleep(2)
    commands.getoutput("ip -6 addr add 2001:db8::2/64 dev bt0")
    time.sleep(2)
    commands.getoutput("ip -4 route add 192.0.2/24 dev eno1")
    time.sleep(2)
    commands.getoutput("ip -4 addr add 192.0.2.2/24 dev eno1")
    time.sleep(2)

    CMD = "f30b5000"
    event_car_write = threading.Event()

    def func_car():
        print "Mini Car - start init...."

        host_car = "2001:db8::10"
        port = 9876
        bufSize = 1024
        addr_car = (host_car, port)
        Timeout = 300

        try :
            socket_car = socket.socket(socket.AF_INET6, socket.SOCK_STREAM)
            socket_car.settimeout(Timeout)
            socket_car.connect(addr_car)
            print "TCP Adapter - connect to mini car"
        except :
            print "Mini Car - please reboot A101 board"

        while 1:
            global CMD
            event_car_write.wait()

            try:
                socket_car.sendall(CMD)
                print "Mini Car - send data '%s'" %CMD
            except :
                print "Mini Car - please reboot A101 board"

            event_car_write.clear()

    def func_joystick():
        print "Joy Stick - start init...."

        host_JS = "192.0.2.1"
        port = 9876
        bufSize = 1024
        addr_JS = (host_JS, port)
        Timeout = 300

        try :
            socket_JS = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            socket_JS.settimeout(Timeout)
            socket_JS.connect(addr_JS)
            print "TCP Adapter - connect to joy stick"
        except :
            print "Joy Stick - please reboot A101 board"

        while 1:
            try :
                global CMD
                CMD = socket_JS.recv(bufSize)
                CMD = CMD.strip()
                event_car_write.set()
                print "Joy Stick - get data '%s'" %CMD
            except KeyboardInterrupt :
                print "Joy Stick - exit client"
                break
            except :
                print "Joy Stick - time out"
                continue

    thread_car = threading.Thread(target=func_car)
    thread_joystick = threading.Thread(target=func_joystick)

    thread_car.setDaemon(True)
    thread_car.start()

    thread_joystick.setDaemon(True)
    thread_joystick.start()

    while 1:
        try :
            time.sleep(2)
        except KeyboardInterrupt :
            print "TCP Adapter - exit"
            break
        except :
            print "TCP Adapter - error"
            continue

if __name__ == "__main__" :
    main()
