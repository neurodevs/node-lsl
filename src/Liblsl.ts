import { assertOptions } from '@sprucelabs/schema'
import ffi from 'ffi-napi'
import ArrayType from 'ref-array-napi'
import ref from 'ref-napi'
import SpruceError from './errors/SpruceError'

export default class LiblslImpl implements Liblsl {
	private static instance?: Liblsl
	public static ffi = ffi
	private bindings: LiblslBindings

	public static getInstance(): Liblsl {
		if (!this.instance) {
			this.setInstance(new this())
		}
		return this.instance!
	}

	public static setInstance(instance: Liblsl): void {
		this.instance = instance
	}

	public static resetInstance(): void {
		delete this.instance
	}

	public constructor() {
		const path = process.env.LIBLSL_PATH!

		if (!path) {
			assertOptions(process, ['env.LIBLSL_PATH'])
		}

		try {
			this.bindings = this.loadBindings(path)
		} catch {
			throw new SpruceError({
				code: 'FAILED_TO_LOAD_LIBLSL',
				liblslPath: path,
			})
		}
	}

	private loadBindings(path: string) {
		//@ts-ignore
		return LiblslImpl.ffi.Library(path!, {
			lsl_create_streaminfo: [
				streamInfo,
				['string', 'string', 'int', 'double', 'int', 'string'],
			],
			lsl_create_outlet: [outletType, [streamInfo, 'int', 'int']],
			lsl_destroy_outlet: ['void', [outletType]],
			lsl_local_clock: ['double', []],
			lsl_push_sample_ft: ['void', [outletType, FloatArray, 'double']],
			lsl_push_sample_strt: ['void', [outletType, StringArray, 'double']],
			lsl_get_desc: [xmlPtr, [streamInfo]],
			lsl_append_child: [xmlPtr, [xmlPtr, 'string']],
			lsl_append_child_value: [xmlPtr, [xmlPtr, 'string', 'string']],
		}) as LiblslBindings
	}

	public createStreamInfo(options: CreateStreamInfoOptions): BoundStreamInfo {
		const { name, type, channelCount, sampleRate, channelFormat, sourceId } =
			assertOptions(options, [
				'name',
				'type',
				'channelCount',
				'sampleRate',
				'channelFormat',
				'sourceId',
			])

		return this.bindings.lsl_create_streaminfo(
			name,
			type,
			channelCount,
			sampleRate,
			channelFormat,
			sourceId
		)
	}

	public appendChannelsToStreamInfo(
		options: AppendChannelsToStreamInfoOptions
	): void {
		const { info, channels } = assertOptions(options, ['info', 'channels'])

		const desc = this.bindings.lsl_get_desc(info)

		const parent = this.bindings.lsl_append_child(desc, 'channels')

		for (const channel of channels) {
			const child = this.bindings.lsl_append_child(parent, 'channel')
			this.bindings.lsl_append_child_value(child, 'label', channel.label)
			this.bindings.lsl_append_child_value(child, 'unit', channel.unit)
			this.bindings.lsl_append_child_value(child, 'type', channel.type)
		}
	}

	public createOutlet(options: CreateOutletOptions): BoundOutlet {
		const { info, chunkSize, maxBuffered } = assertOptions(options, [
			'info',
			'chunkSize',
			'maxBuffered',
		])

		return this.bindings.lsl_create_outlet(info, chunkSize, maxBuffered)
	}

	public destroyOutlet(options: DestroyOutletOptions): void {
		const { outlet } = assertOptions(options, ['outlet'])
		this.bindings.lsl_destroy_outlet(outlet)
	}

	public pushSampleFt(options: PushSampleFtOptions): void {
		const { outlet, sample, timestamp } = assertOptions(options, [
			'outlet',
			'sample',
			'timestamp',
		])
		this.bindings.lsl_push_sample_ft(outlet, sample, timestamp)
	}

	public pushSampleStrt(options: PushSampleStrtOptions): void {
		const { outlet, sample, timestamp } = assertOptions(options, [
			'outlet',
			'sample',
			'timestamp',
		])
		this.bindings.lsl_push_sample_strt(outlet, sample, timestamp)
	}

	public localClock(): number {
		return this.bindings.lsl_local_clock()
	}
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

const streamInfo = ref.refType(ref.types.void)
const outletType = ref.refType(ref.types.void)
const FloatArray = ArrayType(ref.types.float)
const StringArray = ArrayType(ref.types.CString)
const xmlPtr = ref.refType(ref.types.void)
