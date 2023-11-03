export interface OutletArgs {
	name: string
	type: string
	channelCount: number
	sampleRate: number
	channelFormat: ChannelFormat
	sourceId: string
	manufacturer: string
	unit: string
	chunkSize: number
	maxBuffered: number
}

class Outlet {
	protected name: string
	protected type: string
	protected channelCount: number
	protected sampleRate: number
	protected channelFormat: number
	protected sourceId: string
	protected manufacturer: string
	protected unit: string
	protected chunkSize: number
	protected maxBuffered: number

	private channelFormats: { [key in ChannelFormat]: number } = {
		undefined: 0,
		float32: 1,
		double64: 2,
		string: 3,
		int32: 4,
		int16: 5,
		int8: 6,
		int64: 7,
	}

	public constructor({
		name,
		type,
		channelCount,
		sampleRate,
		channelFormat,
		sourceId,
		manufacturer,
		unit,
		chunkSize,
		maxBuffered,
	}: OutletArgs) {
		this.validateChannelCount(channelCount)
		this.validateSampleRate(sampleRate)
		this.validateChannelFormat(channelFormat)
		this.validateChunkSize(chunkSize)
		this.validateMaxBuffered(maxBuffered)

		this.name = name
		this.type = type
		this.channelCount = channelCount
		this.sampleRate = sampleRate
		this.channelFormat = this.channelFormats[channelFormat]
		this.sourceId = sourceId
		this.manufacturer = manufacturer
		this.unit = unit
		this.chunkSize = chunkSize
		this.maxBuffered = maxBuffered
	}

	private validateChannelCount(channelCount: number) {
		if (!isPositiveInteger(channelCount)) {
			throw new Error(
				`Invalid channelCount: must be a positive integer, not ${channelCount}!`
			)
		}
	}

	private validateSampleRate(sampleRate: number) {
		if (!isPositiveNumber(sampleRate)) {
			throw new Error(
				`Invalid sampleRate: must be a positive number, not ${sampleRate}!`
			)
		}
	}

	private validateChannelFormat(channelFormat: string) {
		const validChannelFormats = Object.keys(this.channelFormats).join(', ')
		if (!(channelFormat in this.channelFormats)) {
			throw new Error(
				`Invalid channelFormat: must be one of ${validChannelFormats}, not ${channelFormat}!`
			)
		}
	}

	private validateChunkSize(chunkSize: number) {
		if (!isPositiveIntegerOrZero(chunkSize)) {
			throw new Error(
				`Invalid chunkSize: must be a positive integer or zero, not ${chunkSize}!`
			)
		}
	}

	private validateMaxBuffered(maxBuffered: number) {
		if (!isPositiveIntegerOrZero(maxBuffered)) {
			throw new Error(
				`Invalid maxBuffered: must be a positive integer or zero, not ${maxBuffered}!`
			)
		}
	}
}

export type ChannelFormat =
	| 'undefined'
	| 'float32'
	| 'double64'
	| 'string'
	| 'int32'
	| 'int16'
	| 'int8'
	| 'int64'

const isPositiveNumber = (value: number) => {
	return value > 0
}

const isPositiveInteger = (value: number) => {
	return value > 0 && Number.isInteger(value)
}

const isPositiveIntegerOrZero = (value: number) => {
	return value >= 0 && Number.isInteger(value)
}

export default Outlet
