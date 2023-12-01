import { SchemaError } from '@sprucelabs/schema'
import { CHANNEL_FORMATS, ChannelFormat } from './consts'
import {
	isGreaterThanOrEqualToZero,
	isPositiveInteger,
	isPositiveIntegerOrZero,
	isStringInArray,
} from './validations'

export function assertValidMaxBufferred(maxBuffered: number): void {
	if (!isPositiveIntegerOrZero(maxBuffered)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['maxBuffered'],
			friendlyMessage: 'Max buffered must be a positive integer or zero.',
		})
	}
}

export function assertValidChunkSize(chunkSize: number): void {
	if (!isPositiveIntegerOrZero(chunkSize)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['chunkSize'],
			friendlyMessage: 'Chunk size must be a positive integer or zero.',
		})
	}
}

export function assertValidChannelFormat(channelFormat: ChannelFormat): void {
	if (!isStringInArray(channelFormat, CHANNEL_FORMATS)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['channelFormat'],
			friendlyMessage: `Invalid `,
		})
	}
}

export function assertValidSampleRate(sampleRate: number): void {
	if (!isGreaterThanOrEqualToZero(sampleRate)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['sampleRate'],
			friendlyMessage: 'Sample rate must be a positive number or zero.',
		})
	}
}

export function assertValidChannelCount(channelCount: number): void {
	if (!isPositiveInteger(channelCount)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['channelNames'],
			friendlyMessage: 'channelNames must have 1 or more labels.',
		})
	}
}
