export * from './types'

// EventMarkerOutlet

export { default as EventMarkerOutlet } from './impl/LslEventMarkerOutlet'
export * from './impl/LslEventMarkerOutlet'

export { default as FakeMarkerOutlet } from './testDoubles/EventMarkerOutlet/FakeEventMarkerOutlet'
export * from './testDoubles/EventMarkerOutlet/FakeEventMarkerOutlet'

export { default as MockMarkerOutlet } from './testDoubles/EventMarkerOutlet/MockEventMarkerOutlet'
export * from './testDoubles/EventMarkerOutlet/MockEventMarkerOutlet'

export { default as SpyMarkerOutlet } from './testDoubles/EventMarkerOutlet/SpyEventMarkerOutlet'
export * from './testDoubles/EventMarkerOutlet/SpyEventMarkerOutlet'

export { default as ThrowingMarkerOutlet } from './testDoubles/EventMarkerOutlet/ThrowingEventMarkerOutlet'
export * from './testDoubles/EventMarkerOutlet/ThrowingEventMarkerOutlet'

// Liblsl

export { default as LiblslAdapter } from './impl/LiblslAdapter'
export * from './impl/LiblslAdapter'

export { default as FakeLiblsl } from './testDoubles/Liblsl/FakeLiblsl'
export * from './testDoubles/Liblsl/FakeLiblsl'

// StreamInfo

export { default as LslStreamInfo } from './impl/LslStreamInfo'
export * from './impl/LslStreamInfo'

export { default as SpyStreamInfo } from './testDoubles/StreamInfo/SpyStreamInfo'
export * from './testDoubles/StreamInfo/SpyStreamInfo'

export { default as FakeStreamInfo } from './testDoubles/StreamInfo/FakeStreamInfo'
export * from './testDoubles/StreamInfo/FakeStreamInfo'

// StreamInlet

export { default as LslStreamInlet } from './impl/LslStreamInlet'
export * from './impl/LslStreamInlet'

export { default as FakeStreamInlet } from './testDoubles/StreamInlet/FakeStreamInlet'
export * from './testDoubles/StreamInlet/FakeStreamInlet'

// StreamOutlet

export { default as LslStreamOutlet } from './impl/LslStreamOutlet'
export * from './impl/LslStreamOutlet'

export { default as FakeStreamOutlet } from './testDoubles/StreamOutlet/FakeStreamOutlet'
export * from './testDoubles/StreamOutlet/FakeStreamOutlet'

// StreamTransportBridge

export { default as LslWebSocketBridge } from './impl/LslWebSocketBridge'
export * from './impl/LslWebSocketBridge'

export { default as FakeStreamTransportBridge } from './testDoubles/StreamTransportBridge/FakeStreamTransportBridge'
export * from './testDoubles/StreamTransportBridge/FakeStreamTransportBridge'

// Utils

export { default as generateRandomOutletOptions } from './testDoubles/generateRandomOutletOptions'
