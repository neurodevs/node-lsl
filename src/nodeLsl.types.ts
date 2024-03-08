import ArrayType from 'ref-array-napi'
import ref from 'ref-napi'
import { CHANNEL_FORMATS } from './consts'

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

export type ChannelFormat = (typeof CHANNEL_FORMATS)[number]

export interface TimeMarkerOutlet extends LslOutlet {
	pushMarkers(markers: DurationMarker[]): Promise<void>
	stop(): void
}

export type TimeMarkerOutletConstructor = new () => TimeMarkerOutlet

export interface DurationMarker {
	name: string
	durationMs: number
}

export interface Liblsl {
	createStreamInfo(options: CreateStreamInfoOptions): BoundStreamInfo
	appendChannelsToStreamInfo(options: AppendChannelsToStreamInfoOptions): void
	createOutlet(options: CreateOutletOptions): BoundOutlet
	destroyOutlet(options: DestroyOutletOptions): void
	pushSampleFt(options: PushSampleFtOptions): void
	pushSampleStrt(options: PushSampleStrtOptions): void
	localClock(): number
}

export interface CreateStreamInfoOptions {
	name: string
	type: string
	channelCount: number
	sampleRate: number
	channelFormat: number
	sourceId: string
	manufacturer?: string
	unit?: string
}

export interface AppendChannelsToStreamInfoOptions {
	info: BoundStreamInfo
	channels: LslChannel[]
}

export interface CreateOutletOptions {
	info: BoundStreamInfo
	chunkSize: number
	maxBuffered: number
}

export interface DestroyOutletOptions {
	outlet: BoundOutlet
}

export interface PushSampleFtOptions {
	outlet: BoundOutlet
	sample: number[]
	timestamp: number
}

export interface PushSampleStrtOptions {
	outlet: BoundOutlet
	sample: string[]
	timestamp: number
}

export interface LslChannel {
	label: string
	unit: string
	type: string
}
export type LslSample = (number | string | undefined)[]

export interface LiblslBindings {
	lsl_create_streaminfo(
		name: string,
		type: string,
		channelCount: number,
		sampleRate: number,
		channelFormat: number,
		sourceId: string
	): BoundStreamInfo

	lsl_create_outlet(
		info: BoundStreamInfo,
		chunkSize: number,
		maxBuffered: number
	): BoundOutlet

	lsl_destroy_outlet(outlet: BoundOutlet): void

	lsl_push_sample_ft(
		outlet: BoundOutlet,
		sample: LslSample,
		timestamp: number
	): void

	lsl_push_sample_strt(
		outlet: BoundOutlet,
		sample: LslSample,
		timestamp: number
	): void

	lsl_local_clock(): number
	lsl_get_desc(info: BoundStreamInfo): BoundDesc
	lsl_append_child(desc: BoundDesc, name: string): BoundChild
	lsl_append_child_value(child: BoundChild, name: string, value: string): void
}

export interface BoundStreamInfo {}
export interface BoundOutlet {}
export interface BoundDesc {}
export interface BoundChild {}

export const streamInfo = ref.refType(ref.types.void)
export const outletType = ref.refType(ref.types.void)
export const FloatArray = ArrayType(ref.types.float)
export const StringArray = ArrayType(ref.types.CString)
export const xmlPtr = ref.refType(ref.types.void)
