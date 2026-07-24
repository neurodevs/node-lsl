// ClockRegressor

export { default as WindowedClockRegressor } from './impl/WindowedClockRegressor.js'
export * from './impl/WindowedClockRegressor.js'

export { default as FakeClockRegressor } from './testDoubles/ClockRegressor/FakeClockRegressor.js'
export * from './testDoubles/ClockRegressor/FakeClockRegressor.js'

// DeviceController

export { default as BleDeviceController } from './impl/controllers/BleDeviceController.js'
export * from './impl/controllers/BleDeviceController.js'

export { default as FakeBleController } from './testDoubles/BleController/FakeBleController.js'
export * from './testDoubles/BleController/FakeBleController.js'

export { default as SpyBleController } from './testDoubles/BleController/SpyBleController.js'
export * from './testDoubles/BleController/SpyBleController.js'

// LslBridge

export { default as LslWebSocketBridge } from './impl/LslWebSocketBridge.js'
export * from './impl/LslWebSocketBridge.js'

export { default as FakeLslBridge } from './testDoubles/LslBridge/FakeLslBridge.js'
export * from './testDoubles/LslBridge/FakeLslBridge.js'

// LslEmitter

export { default as LslEventMarkerEmitter } from './impl/LslEventMarkerEmitter.js'
export * from './impl/LslEventMarkerEmitter.js'

export { default as FakeLslEmitter } from './testDoubles/LslEmitter/FakeLslEmitter.js'
export * from './testDoubles/LslEmitter/FakeLslEmitter.js'

export { default as SpyLslEmitter } from './testDoubles/LslEmitter/SpyLslEmitter.js'
export * from './testDoubles/LslEmitter/SpyLslEmitter.js'

export { default as ThrowingLslEmitter } from './testDoubles/LslEmitter/ThrowingLslEmitter.js'
export * from './testDoubles/LslEmitter/ThrowingLslEmitter.js'

// LslInfo

export { default as LslStreamInfo } from './impl/LslStreamInfo.js'
export * from './impl/LslStreamInfo.js'

export { default as SpyLslInfo } from './testDoubles/LslInfo/SpyLslInfo.js'
export * from './testDoubles/LslInfo/SpyLslInfo.js'

export { default as FakeLslInfo } from './testDoubles/LslInfo/FakeLslInfo.js'
export * from './testDoubles/LslInfo/FakeLslInfo.js'

// LslInlet

export { default as LslStreamInlet } from './impl/LslStreamInlet.js'
export * from './impl/LslStreamInlet.js'

export { default as FakeLslInlet } from './testDoubles/LslInlet/FakeLslInlet.js'
export * from './testDoubles/LslInlet/FakeLslInlet.js'

// LslOutlet

export { default as LslStreamOutlet } from './impl/LslStreamOutlet.js'
export * from './impl/LslStreamOutlet.js'

export { default as FakeLslOutlet } from './testDoubles/LslOutlet/FakeLslOutlet.js'
export * from './testDoubles/LslOutlet/FakeLslOutlet.js'

// UsbController

export { default as UsbDeviceController } from './impl/controllers/UsbDeviceController.js'
export * from './impl/controllers/UsbDeviceController.js'

export { default as FakeUsbController } from './testDoubles/UsbController/FakeUsbController.js'
export * from './testDoubles/UsbController/FakeUsbController.js'

// Utils

export { default as generateRandomOutletOptions } from './testDoubles/generateRandomOutletOptions.js'

// WebSockets

export { default as FakeWebSocket } from './testDoubles/WebSockets/FakeWebSocket.js'
export * from './testDoubles/WebSockets/FakeWebSocket.js'

export { default as FakeWebSocketServer } from './testDoubles/WebSockets/FakeWebSocketServer.js'
export * from './testDoubles/WebSockets/FakeWebSocketServer.js'
