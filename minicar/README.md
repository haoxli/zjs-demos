# ZJS Demo
ZJS Demo, an intelligent car demo based on [Zephyr.js](https://github.com/01org/zephyr.js/tree/master), using real-time detection of infrared and photoelectric sensor signal, to achieve ble and obstacle avoidance features.

### Required Zephyr.js Features
- Arduino 101 Pins
- PWM
- AIO
- GIPO
- BLE

### Demo Features
- Turn left/right
- Coast/Brake/Forward/Reverse
- Obstacle aviodance
- Bluetooth/Infrared control

### Hardwares
- Arduino 101
- PM-R3 Expansion Board
- Motor(JGA25-370)
- Steering Engine(MG996)
- Photoelectric sensor

### Build
- Get Zephyr.js code
```
$ git clone https://github.com/01org/zephyr.js
$ cd zephyr.js
$ source zjs-env.sh
$ make update
```
- ZJS Demo to Zephyr.js
```
$ git clone https://github.com/thewebera/zjs-demos
```
Copy `modules`, `tests` and `main.js` to Zephyr.js

- Build and Flash
```
$ cd zephyr.js
$ source zjs-env.sh
$ source deps/zephyr/zephyr-env.sh
$ make JS=main.js
$ make dfu
```
Detailed steps and dependences refer to Zephyr.js [README](https://github.com/01org/zephyr.js/blob/master/README.md).

### Connect with BLE
- https://thewebera.github.io/zjs-demos/minicar/

