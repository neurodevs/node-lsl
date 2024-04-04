import { SchemaError } from '@sprucelabs/schema'
import { CHANNEL_FORMATS } from './consts'
import { ChannelFormat } from './nodeLsl.types'
import {
	isGreaterThanOrEqualToZero,
	isPositiveInteger,
	isPositiveIntegerOrZero,
	isStringInArray,
} from './validations'

export function assertValidMaxBuffered(maxBuffered: number) {
	if (!isPositiveIntegerOrZero(maxBuffered)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['maxBuffered'],
			friendlyMessage: 'Max buffered must be a positive integer or zero.',
		})
	}
}

export function assertValidChunkSize(chunkSize: number) {
	if (!isPositiveIntegerOrZero(chunkSize)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['chunkSize'],
			friendlyMessage: 'Chunk size must be a positive integer or zero.',
		})
	}
}

export function assertValidChannelFormat(channelFormat: ChannelFormat) {
	if (!isStringInArray(channelFormat, CHANNEL_FORMATS)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['channelFormat'],
			friendlyMessage: `Invalid `,
		})
	}
}

export function assertValidSampleRate(sampleRate: number) {
	if (!isGreaterThanOrEqualToZero(sampleRate)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['sampleRate'],
			friendlyMessage: 'Sample rate must be a positive number or zero.',
		})
	}
}

export function assertValidChannelCount(channelCount: number) {
	if (!isPositiveInteger(channelCount)) {
		throw new SchemaError({
			code: 'INVALID_PARAMETERS',
			parameters: ['channelNames'],
			friendlyMessage: 'channelNames must have 1 or more labels.',
		})
	}
}
