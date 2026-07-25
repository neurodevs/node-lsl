import { ChannelFormat } from '@neurodevs/ndx-native'

export const TEST_SUPPORTED_CHANNEL_FORMATS = ['float32', 'string'] as const

export const TEST_UNSUPPORTED_CHANNEL_FORMATS = [
    'undefined',
    'double64',
    'int32',
    'int16',
    'int8',
    'int64',
] as const

export type TestChannelFormat = ChannelFormat
