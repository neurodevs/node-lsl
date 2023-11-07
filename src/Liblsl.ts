const ffi = require('ffi-napi')
const ArrayType = require('ref-array-napi')
const ref = require('ref-napi')

const streamInfo = ref.refType(ref.types.void)
const xmlPtr = ref.refType(ref.types.void)
const outletType = ref.refType(ref.types.void)
const FloatArray = ArrayType(ref.types.float)

export interface LiblslBindings {
	[functionName: string]: any
}

export interface StreamInfoArgs {
	name: string
	type: string
	channelCount: number
	sampleRate: number
	channelFormat: ChannelFormat
	sourceId: string
}

export interface StreamInfoCaller {
	name: string
	type: string
	channelCount: number
	sampleRate: number
	channelFormat: number
	sourceId: string
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

export class Liblsl {
	protected bindings: LiblslBindings

	public constructor() {
		if (!process.env.LIBLSL_PATH) {
			throw new Error(
				'Please define an environmental variable for LIBLSL_PATH!'
			)
		}

		try {
			this.bindings = ffi.Library(process.env.LIBLSL_PATH, {
				lsl_create_streaminfo: [
					streamInfo,
					['string', 'string', 'int', 'double', 'int', 'string'],
				],
				lsl_get_desc: [xmlPtr, [streamInfo]],
				lsl_append_child_value: ['void', [xmlPtr, 'string', 'string']],
				lsl_append_child: [xmlPtr, [xmlPtr, 'string']],
				lsl_create_outlet: [outletType, [streamInfo, 'int', 'int']],
				lsl_local_clock: ['double', []],
				lsl_push_sample_ft: ['int', [outletType, FloatArray, 'double']],
			})
		} catch {
			throw new Error(
				'Could not load dynamic library for liblsl, please ensure you have built it, set LIBLSL_PATH accordingly, and reloaded!'
			)
		}
	}

	public createStreamInfo(args: StreamInfoCaller) {
		return this.bindings.lsl_create_streaminfo(
			args.name,
			args.type,
			args.channelCount,
			args.sampleRate,
			args.channelFormat,
			args.sourceId
		)
	}

	public getDesc(info: StreamInfoArgs) {
		return this.bindings.lsl_get_desc(info)
	}

	public appendChild(node: any, name: string) {
		this.bindings.lsl_append_child(node, name)
	}

	public appendChildValue(node: any, name: string, value: string) {
		this.bindings.lsl_append_child_value(node, name, value)
	}

	public createOutlet(info: any, chunkSize: number, maxBuffered: number) {
		return this.bindings.lsl_create_outlet(info, chunkSize, maxBuffered)
	}

	public getLocalClock() {
		return this.bindings.lsl_local_clock()
	}

	public pushSample(outlet: any, samples: any) {
		return this.bindings.lsl_push_sample_ft(
			outlet,
			samples,
			this.getLocalClock()
		)
	}
}
