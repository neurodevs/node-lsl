import { assertOptions } from '@sprucelabs/schema'
import ffi from 'ffi-napi'
import ArrayType from 'ref-array-napi'
import ref from 'ref-napi'
import SpruceError from './errors/SpruceError'

export default class LiblslImpl implements Liblsl {
	private static instance?: Liblsl
	public static ffi = ffi
	private bindings: LiblslBindings

	public static getInstance() {
		if (!this.instance) {
			this.instance = new this()
		}
		return this.instance!
	}

	public static reset() {
		delete this.instance
	}

	public static setInstance(instance: Liblsl) {
		this.instance = instance
	}

	public constructor() {
		const path = process.env.LIBLSL_PATH!

		if (!path) {
			assertOptions(process, ['env.LIBLSL_PATH'])
		}
		try {
			this.bindings = this.loadBindings(path)
		} catch (err) {
			console.error(err)
			throw new SpruceError({
				code: 'FAILED_TO_LOAD_LIBLSL',
				liblslPath: path,
			})
		}
	}
	public appendChannelsToStreamInfo(
		info: LslBindingsStreamInfo,
		channels: LslChannel[]
	): void {
		assertOptions({ info, channels }, ['info', 'channels'])
		const desc = this.bindings.lsl_get_desc(info)

		const parent = this.bindings.lsl_append_child(desc, 'channels')

		for (const channel of channels) {
			const c = this.bindings.lsl_append_child(parent, 'channel')
			this.bindings.lsl_append_child_value(c, 'label', channel.label)
			this.bindings.lsl_append_child_value(c, 'unit', channel.unit)
			this.bindings.lsl_append_child_value(c, 'type', channel.type)
		}
	}

	private loadBindings(path: string) {
		return LiblslImpl.ffi.Library(path!, {
			lsl_create_streaminfo: [
				streamInfo,
				['string', 'string', 'int', 'double', 'int', 'string'],
			],
			lsl_create_outlet: [outletType, [streamInfo, 'int', 'int']],
			lsl_local_clock: ['double', []],
			lsl_push_sample_ft: ['void', [outletType, FloatArray, 'double']],
			lsl_get_desc: [xmlPtr, [streamInfo]],
			lsl_append_child: [xmlPtr, [xmlPtr, 'string']],
			lsl_append_child_value: [xmlPtr, [xmlPtr, 'string', 'string']],
		}) as unknown as LiblslBindings
	}

	public pushSample(outlet: LslBindingsOutlet, sample: LslSample): void {
		assertOptions({ outlet, sample }, ['outlet', 'sample'])
		const clock = this.bindings.lsl_local_clock()
		this.bindings.lsl_push_sample_ft(outlet, sample, clock)
	}

	public createOutlet(options: CreateOutletOptions) {
		const { info, chunkSize, maxBuffered } = assertOptions(options, [
			'info',
			'chunkSize',
			'maxBuffered',
		])

		return this.bindings.lsl_create_outlet(info, chunkSize, maxBuffered)
	}

	public createStreamInfo(
		options: CreateStreamInfoOptions
	): LslBindingsStreamInfo {
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
}

export interface Liblsl {
	appendChannelsToStreamInfo(
		info: LslBindingsStreamInfo,
		channels: LslChannel[]
	): void
	createStreamInfo(options: CreateStreamInfoOptions): LslBindingsStreamInfo
	createOutlet(options: CreateOutletOptions): LslBindingsOutlet
	pushSample(outlet: LslBindingsOutlet, sample: LslSample): void
}

export type LslSample = (number | string | undefined)[]

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

export interface LslChannel {
	label: string
	unit: string
	type: string
}

export interface LiblslBindings {
	lsl_create_streaminfo(
		name: string,
		type: string,
		channelCount: number,
		sampleRate: number,
		channelFormat: number,
		sourceId: string
	): LslBindingsStreamInfo

	lsl_create_outlet(
		info: LslBindingsStreamInfo,
		chunkSize: number,
		maxBuffered: number
	): LslBindingsOutlet

	lsl_push_sample_ft(
		outlet: LslBindingsOutlet,
		sample: LslSample,
		timestamp: number
	): void

	lsl_local_clock(): number
	lsl_get_desc(info: LslBindingsStreamInfo): LslBindingsDesc
	lsl_append_child(desc: LslBindingsDesc, name: string): LslBindingsChild
	lsl_append_child_value(
		child: LslBindingsChild,
		name: string,
		value: string
	): void
}

const streamInfo = ref.refType(ref.types.void)
const outletType = ref.refType(ref.types.void)
const FloatArray = ArrayType(ref.types.float)
const xmlPtr = ref.refType(ref.types.void)
export interface CreateOutletOptions {
	info: LslBindingsStreamInfo
	chunkSize: number
	maxBuffered: number
}

export interface LslBindingsStreamInfo {}
export interface LslBindingsOutlet {}
export interface LslBindingsDesc {}
export interface LslBindingsChild {}
