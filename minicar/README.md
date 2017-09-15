# ZJS Demo
ZJS Demo, an intelligent car demo based on Zephyr.js [v0.3](https://github.com/01org/zephyr.js/releases/tag/v0.3), using real-time detection of infrared and photoelectric sensor signal, to achieve ble and obstacle avoidance features.

### Required Zephyr.js v0.3 features
- Arduino 101 Pins
- PWM
- AIO
- GIPO
- BLE

## Features
- Turn left/right
- Coast/Brake/Forward/Reverse
- Obstacle aviodance
- Bluetooth/Infrared control

### HW
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
$ git checkout v0.3
$ source zjs-env.sh
$ make update

```
- ZJS Demo to Zephyr.js
```
$ https://github.com/thewebera/zjs-demos
$ cd zjs-demos
$ git checkout 0.3
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
Detailed steps and dependences refer to Zephyr.js [README](https://github.com/01org/zephyr.js/blob/zjs-0.3/README.md).

### Connect with BLE
- https://thewebera.github.io/zjs-demos/minicar/
