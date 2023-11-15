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

	private loadBindings(path: string) {
		return LiblslImpl.ffi.Library(path!, {
			lsl_create_streaminfo: [
				streamInfo,
				['string', 'string', 'int', 'double', 'int', 'string'],
			],
			lsl_create_outlet: [outletType, [streamInfo, 'int', 'int']],
			lsl_local_clock: ['double', []],
			lsl_push_sample_ft: ['void', [outletType, FloatArray, 'double']],
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

	public createStreamInfo(options: CreateStreamInfoOptions): StreamInfo {
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
	createStreamInfo(options: CreateStreamInfoOptions): LslBindingsStreamInfo
	createOutlet(options: CreateOutletOptions): LslBindingsOutlet
	pushSample(outlet: LslBindingsOutlet, sample: LslSample): void
}

export type LslSample = (number | string | undefined)[]

export interface StreamInfo {}

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
}

const streamInfo = ref.refType(ref.types.void)
const outletType = ref.refType(ref.types.void)
const FloatArray = ArrayType(ref.types.float)

export interface CreateOutletOptions {
	info: StreamInfo
	chunkSize: number
	maxBuffered: number
}

export interface LslBindingsStreamInfo {}
export interface LslBindingsOutlet {}
