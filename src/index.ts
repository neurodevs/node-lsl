export * from './types'

// Liblsl

export { default as LiblslAdapter } from './modules/LiblslAdapter'
export * from './modules/LiblslAdapter'

export { default as FakeLiblsl } from './testDoubles/Liblsl/FakeLiblsl'
export * from './testDoubles/Liblsl/FakeLiblsl'

// LslStreamInfo

export { default as LslStreamInfo } from './modules/LslStreamInfo'
export * from './modules/LslStreamInfo'

export { default as SpyStreamInfo } from './testDoubles/StreamInfo/SpyStreamInfo'
export * from './testDoubles/StreamInfo/SpyStreamInfo'

export { default as FakeStreamInfo } from './testDoubles/StreamInfo/FakeStreamInfo'
export * from './testDoubles/StreamInfo/FakeStreamInfo'

// LslStreamOutlet

export { default as LslStreamOutlet } from './modules/LslStreamOutlet'
export * from './modules/LslStreamOutlet'

export { default as FakeLslOutlet } from './testDoubles/LslOutlet/FakeLslOutlet'
export * from './testDoubles/LslOutlet/FakeLslOutlet'

// EventMarkerOutlet

export { default as EventMarkerOutlet } from './modules/EventMarkerOutlet'
export * from './modules/EventMarkerOutlet'

export { default as FakeMarkerOutlet } from './testDoubles/MarkerOutlet/FakeMarkerOutlet'
export * from './testDoubles/MarkerOutlet/FakeMarkerOutlet'

export { default as MockMarkerOutlet } from './testDoubles/MarkerOutlet/MockMarkerOutlet'
export * from './testDoubles/MarkerOutlet/MockMarkerOutlet'

export { default as SpyMarkerOutlet } from './testDoubles/MarkerOutlet/SpyMarkerOutlet'
export * from './testDoubles/MarkerOutlet/SpyMarkerOutlet'

export { default as ThrowingMarkerOutlet } from './testDoubles/MarkerOutlet/ThrowingMarkerOutlet'
export * from './testDoubles/MarkerOutlet/ThrowingMarkerOutlet'

// Utils

export { default as generateRandomOutletOptions } from './testDoubles/generateRandomOutletOptions'
