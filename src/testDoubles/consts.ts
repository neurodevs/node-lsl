export const TEST_SUPPORTED_CHANNEL_FORMATS = ['float32', 'string'] as const

export const TEST_UNSUPPORTED_CHANNEL_FORMATS = [
    'undefined',
    'double64',
    'int32',
    'int16',
    'int8',
    'int64',
] as const

export const TEST_CHANNEL_FORMATS = [
    'undefined',
    'float32',
    'double64',
    'string',
    'int32',
    'int16',
    'int8',
    'int64',
] as const

export const TEST_CHANNEL_FORMATS_MAP = {
    undefined: 0,
    float32: 1,
    double64: 2,
    string: 3,
    int32: 4,
    int16: 5,
    int8: 6,
    int64: 7,
}

export type TestChannelFormat = (typeof TEST_CHANNEL_FORMATS)[number]
