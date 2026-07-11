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

// EventMarkerEmitter

export { default as LslEventMarkerEmitter } from './impl/LslEventMarkerEmitter.js'
export * from './impl/LslEventMarkerEmitter.js'

export { default as FakeEventMarkerEmitter } from './testDoubles/EventMarkerEmitter/FakeEventMarkerEmitter.js'
export * from './testDoubles/EventMarkerEmitter/FakeEventMarkerEmitter.js'

export { default as SpyEventMarkerEmitter } from './testDoubles/EventMarkerEmitter/SpyEventMarkerEmitter.js'
export * from './testDoubles/EventMarkerEmitter/SpyEventMarkerEmitter.js'

export { default as ThrowingEventMarkerEmitter } from './testDoubles/EventMarkerEmitter/ThrowingEventMarkerEmitter.js'
export * from './testDoubles/EventMarkerEmitter/ThrowingEventMarkerEmitter.js'

// StreamInfo

export { default as LslStreamInfo } from './impl/LslStreamInfo.js'
export * from './impl/LslStreamInfo.js'

export { default as SpyStreamInfo } from './testDoubles/StreamInfo/SpyStreamInfo.js'
export * from './testDoubles/StreamInfo/SpyStreamInfo.js'

export { default as FakeStreamInfo } from './testDoubles/StreamInfo/FakeStreamInfo.js'
export * from './testDoubles/StreamInfo/FakeStreamInfo.js'

// StreamInlet

export { default as LslStreamInlet } from './impl/LslStreamInlet.js'
export * from './impl/LslStreamInlet.js'

export { default as FakeStreamInlet } from './testDoubles/StreamInlet/FakeStreamInlet.js'
export * from './testDoubles/StreamInlet/FakeStreamInlet.js'

// StreamOutlet

export { default as LslStreamOutlet } from './impl/LslStreamOutlet.js'
export * from './impl/LslStreamOutlet.js'

export { default as FakeStreamOutlet } from './testDoubles/StreamOutlet/FakeStreamOutlet.js'
export * from './testDoubles/StreamOutlet/FakeStreamOutlet.js'

// UsbController

export { default as UsbDeviceController } from './impl/UsbDeviceController.js'
export * from './impl/UsbDeviceController.js'

export { default as FakeUsbController } from './testDoubles/UsbController/FakeUsbController.js'
export * from './testDoubles/UsbController/FakeUsbController.js'

// WebSocketBridge

export { default as LslWebSocketBridge } from './impl/LslWebSocketBridge.js'
export * from './impl/LslWebSocketBridge.js'

export { default as FakeWebSocketBridge } from './testDoubles/WebSocketBridge/FakeWebSocketBridge.js'
export * from './testDoubles/WebSocketBridge/FakeWebSocketBridge.js'

// Utils

export { default as generateRandomOutletOptions } from './testDoubles/generateRandomOutletOptions.js'

// WebSockets

export { default as FakeWebSocket } from './testDoubles/WebSockets/FakeWebSocket.js'
export * from './testDoubles/WebSockets/FakeWebSocket.js'

export { default as FakeWebSocketServer } from './testDoubles/WebSockets/FakeWebSocketServer.js'
export * from './testDoubles/WebSockets/FakeWebSocketServer.js'
