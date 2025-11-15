import { ChannelFormat } from 'impl/LiblslAdapter.js'
import { CHANNEL_FORMATS } from './consts.js'
import {
    isGreaterThanOrEqualToZero,
    isPositiveInteger,
    isPositiveIntegerOrZero,
    isStringInArray,
} from './validations.js'

export function assertValidChunkSize(chunkSize: number) {
    if (!isPositiveIntegerOrZero(chunkSize)) {
        throw new Error(
            `Invalid chunk size! Must be a positive integer or zero, not: ${chunkSize}.`
        )
    }
}

export function assertValidMaxBufferedMs(maxBufferedMs: number) {
    if (!isPositiveIntegerOrZero(maxBufferedMs)) {
        throw new Error(
            `Invalid max buffered! Must be a positive integer or zero, not: ${maxBufferedMs}.`
        )
    }
}

export function assertValidChannelFormat(channelFormat: ChannelFormat) {
    if (!isStringInArray(channelFormat, CHANNEL_FORMATS)) {
        throw new Error(
            `Invalid channel format! Must be one of: ${CHANNEL_FORMATS.join(', ')}, not ${channelFormat}.`
        )
    }
}

export function assertValidSampleRateHz(sampleRateHz: number) {
    if (!isGreaterThanOrEqualToZero(sampleRateHz)) {
        throw new Error(
            `Invalid sample rate! Must be a positive number or zero, not: ${sampleRateHz}.`
        )
    }
}

export function assertValidChannelCount(channelCount: number) {
    if (!isPositiveInteger(channelCount)) {
        throw new Error(
            `Invalid channel count! Must be a positive integer, not: ${channelCount}.`
        )
    }
}
