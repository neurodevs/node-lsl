import { SchemaError, assertOptions } from '@sprucelabs/schema'
import LiblslImpl, {
	BoundOutlet,
	BoundStreamInfo,
	Liblsl,
	LslSample,
} from './Liblsl'

export default class LslOutletImpl implements LslOutlet {
	public static Class?: new (options: LslOutletOptions) => LslOutlet
	private options: LslOutletOptions
	private streamInfo: BoundStreamInfo
	private outlet: BoundOutlet

	protected constructor(options: LslOutletOptions) {
		const { sampleRate, channelFormat } = assertOptions(options, [
			'name',
			'type',
			'channelNames',
			'sampleRate',
			'channelFormat',
			'sourceId',
			'manufacturer',
			'unit',
			'chunkSize',
			'maxBuffered',
		])

		this.options = options

		const { chunkSize, maxBuffered, channelNames, ...streamInfoOptions } = this
			.options as any

		const channelCount = channelNames.length

		this.assertValidChannelCount(channelCount)
		this.assertValidSampleRate(sampleRate)
		this.assertValidChannelFormat(channelFormat)
		this.assertValidChunkSize(chunkSize)
		this.assertValidMaxBufferred(maxBuffered)

		delete streamInfoOptions.manufacturer
		delete streamInfoOptions.unit

		this.streamInfo = this.lsl.createStreamInfo({
			...streamInfoOptions,
			channelCount,
			channelFormat: this.lookupChannelFormat(channelFormat),
		})

		this.lsl.appendChannelsToStreamInfo({
			info: this.streamInfo,
			channels: channelNames.map((label: string) => ({
				label,
				unit: this.options.unit,
				type: this.options.type,
			})),
		})

		this.outlet = this.lsl.createOutlet({
			info: this.streamInfo,
			chunkSize: this.options.chunkSize,
			maxBuffered: this.options.maxBuffered,
		})
	}

	public static Outlet(options: LslOutletOptions): LslOutlet {
		return new (this.Class ?? this)(options)
	}

	public destroy(): void {
		this.lsl.destroyOutlet({ outlet: this.outlet })
	}

	public pushSample(sample: LslSample): void {
		const timestamp = this.lsl.localClock()

		const method = this.getPushMethod()

		this.lsl[method]({
			outlet: this.outlet,
			sample,
			timestamp,
		} as any)
	}

	private getPushMethod() {
		const channelFormat = this.options.channelFormat

		const methodMap: Record<string, keyof Liblsl> = {
			float32: 'pushSampleFt',
			string: 'pushSampleStrt',
		}

		const method = methodMap[channelFormat]

		if (!this.lsl[method]) {
			throw new Error(
				`This method currently does not support the ${this.options.channelFormat} type! Please implement it.`
			)
		}
		return method
	}

	private lookupChannelFormat(channelFormat: ChannelFormat): number {
		return CHANNEL_FORMATS.indexOf(channelFormat)
	}

	private assertValidMaxBufferred(maxBuffered: number): void {
		if (!this.isPositiveIntegerOrZero(maxBuffered)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['maxBuffered'],
				friendlyMessage: 'Max buffered must be a positive integer or zero.',
			})
		}
	}

	private assertValidChunkSize(chunkSize: number): void {
		if (!this.isPositiveIntegerOrZero(chunkSize)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['chunkSize'],
				friendlyMessage: 'Chunk size must be a positive integer or zero.',
			})
		}
	}

	private assertValidChannelFormat(channelFormat: ChannelFormat): void {
		const validFormats = CHANNEL_FORMATS
		if (validFormats.indexOf(channelFormat) === -1) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['channelFormat'],
				friendlyMessage: 'Channel format must be a valid format.',
			})
		}
	}

	private assertValidSampleRate(sampleRate: number): void {
		if (!this.isGreaterThanZero(sampleRate)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['sampleRate'],
				friendlyMessage: 'Sample rate must be a positive number or zero.',
			})
		}
	}

	private assertValidChannelCount(channelCount: number): void {
		if (!this.isPositiveInteger(channelCount)) {
			throw new SchemaError({
				code: 'INVALID_PARAMETERS',
				parameters: ['channelNames'],
				friendlyMessage: 'channelNames must have 1 or more labels.',
			})
		}
	}

	private isGreaterThanZero(value: number): boolean {
		return value >= 0
	}

	private isPositiveInteger(value: number): boolean {
		return Number.isInteger(value) && value > 0
	}

	private isPositiveIntegerOrZero(value: number): boolean {
		return Number.isInteger(value) && value >= 0
	}

	private get lsl(): Liblsl {
		return LiblslImpl.getInstance()
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

export interface LslOutlet {
	destroy(): void
	pushSample(sample: LslSample): void
}

export interface LslOutletOptions {
	name: string
	type: string
	channelNames: string[]
	sampleRate: number
	channelFormat: ChannelFormat
	sourceId: string
	manufacturer: string
	unit: string
	chunkSize: number
	maxBuffered: number
}
