const ffi = require('ffi-napi')
const ArrayType = require('ref-array-napi')
const ref = require('ref-napi')

const streamInfo = ref.refType(ref.types.void)
const xmlPtr = ref.refType(ref.types.void)
const outletType = ref.refType(ref.types.void)
const FloatArray = ArrayType(ref.types.float)

export class Liblsl {
	protected bindings: LiblslBindings // TAY 3.0 Casing should be LibLslBindings (camel case even with acronyms and abbreviations, 100% predictable)
	// protected static ffi: Ffi = ffi TAY 2.0 by putting a reference here we can spy on it from our tests to make sure the correct methods and parameters are being used

	public constructor() {
		if (!process.env.LIBLSL_PATH) {
			throw new Error(
				'Please define an environmental variable for LIBLSL_PATH!'
			)
		}

		try {
			this.bindings = this.loadBindings()
		} catch {
			throw new Error(
				'Could not load dynamic library for liblsl, please ensure you have built it, set LIBLSL_PATH accordingly, and reloaded!'
			)
		}
	}

	private loadBindings() {
		return ffi.Library(process.env.LIBLSL_PATH, {
			// TAY 2.1 this becomes Liblsl.ffi.Library(...) so we can test externally
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

export interface LiblslBindings {
	[functionName: string]: any // TAY 1.0 A good way to approach this is to add one lsl function at a time to the types while your implementing them. this dynamic key approach is not useful for people coming in to support the codebase without having to look up LSL docs directly
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

// TAY 2.2 example of an interface to Spy on FFI.  In this case, because `functions` is actually
// an object with any arbitrary key, you can use the dynamic key, or KeyOf<LibLslBindings> to
// make it even easier
/**
 * interface Ffi {
 * 	Library(path: string, functions: {[functionName: string]: any})
 * }
 */
