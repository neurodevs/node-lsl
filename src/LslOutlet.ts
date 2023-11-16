import { SchemaError, assertOptions } from '@sprucelabs/schema'
import LiblslImpl, {
	LslBindingsOutlet,
	LslBindingsStreamInfo,
	LslSample,
} from './Liblsl'

export default class LslOutletImpl implements LslOutlet {
	private outletOptions: LslOutletOptions
	public static Class?: new (options: LslOutletOptions) => LslOutlet
	private streamInfo: LslBindingsStreamInfo
	private outlet: LslBindingsOutlet

	protected constructor(options: LslOutletOptions) {
		const { sampleRate, channelFormat } = assertOptions(options, [
			'name',
			'type',
			'channelLabels',
			'sampleRate',
			'channelFormat',
			'sourceId',
			'manufacturer',
			'unit',
			'chunkSize',
			'maxBuffered',
		])

		this.outletOptions = options

		const { chunkSize, maxBuffered, channelLabels, ...streamInfoOptions } = this
			.outletOptions as any

		this.assertValidChannelCount(channelLabels.length)
		this.assertValidSampleRate(sampleRate)
		this.assertValidChannelFormat(channelFormat)
		this.assertValidChunkSize(chunkSize)
		this.assertValidMaxBufferred(maxBuffered)

		delete streamInfoOptions.manufacturer
		delete streamInfoOptions.unit

		this.streamInfo = this.lsl.createStreamInfo({
			...streamInfoOptions,
			channelCount: channelLabels.length,
			channelFormat: CHANNEL_FORMATS.indexOf(this.outletOptions.channelFormat),
		})

		this.lsl.appendChannelsToStreamInfo(
			this.streamInfo,
			channelLabels.map((label: string) => ({
				label,
				unit: this.outletOptions.unit,
				type: this.outletOptions.type,
			}))
		)

		this.outlet = this.lsl.createOutlet({
			info: this.streamInfo,
			chunkSize: this.outletOptions.chunkSize,
			maxBuffered: this.outletOptions.maxBuffered,
		})
	}

	public static Outlet(options: LslOutletOptions) {
		return new (this.Class ?? this)(options)
	}

	private assertValidMaxBufferred(maxBuffered: number) {
		if (!this.isPositiveIntegerOrZero(maxBuffered)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['maxBuffered'],
				friendlyMessage: 'Max buffered must be a positive integer or zero.',
			})
		}
	}

	private assertValidChunkSize(chunkSize: number) {
		if (!this.isPositiveIntegerOrZero(chunkSize)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['chunkSize'],
				friendlyMessage: 'Chunk size must be a positive integer or zero.',
			})
		}
	}

	private assertValidChannelFormat(channelFormat: ChannelFormat) {
		const validFormats = CHANNEL_FORMATS

		if (validFormats.indexOf(channelFormat) === -1) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['channelFormat'],
				friendlyMessage: 'Channel format must be a valid format.',
			})
		}
	}

	private assertValidSampleRate(sampleRate: number) {
		if (!this.isPositiveNumber(sampleRate)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['sampleRate'],
				friendlyMessage: 'Sample rate must be a positive number.',
			})
		}
	}

	private assertValidChannelCount(channelCount: number) {
		if (!this.isPositiveInteger(channelCount)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['channelLabels'],
				friendlyMessage: 'channelLabels must have 1 or more labels.',
			})
		}
	}

	private isPositiveNumber(value: number) {
		return value > 0
	}

	private isPositiveIntegerOrZero(value: number) {
		return Number.isInteger(value) && value >= 0
	}

	private isPositiveInteger(value: number) {
		return Number.isInteger(value) && value > 0
	}

	private get lsl() {
		return LiblslImpl.getInstance()
	}

	public pushSample(sample: LslSample) {
		this.lsl.pushSample(this.outlet, sample)
	}
}

const CHANNEL_FORMATS = [
	'undefined',
	'float32',
	'double64',
	'string',
	'int32',
	'int16',
	'int8',
	'int64',
] as const

export type ChannelFormat = (typeof CHANNEL_FORMATS)[number]
export interface LslOutletOptions {
	name: string
	type: string
	channelLabels: string[]
	sampleRate: number
	channelFormat: ChannelFormat
	sourceId: string
	manufacturer: string
	unit: string
	chunkSize: number
	maxBuffered: number
}

export interface LslOutlet {
	pushSample(sample: LslSample): void
}
