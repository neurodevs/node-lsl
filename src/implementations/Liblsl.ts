import { assertOptions } from '@sprucelabs/schema'
import { DataType, load, open } from 'ffi-rs'
import SpruceError from '../errors/SpruceError'
import {
	Liblsl,
	CreateStreamInfoOptions,
	BoundStreamInfo,
	AppendChannelsToStreamInfoOptions,
	CreateOutletOptions,
	BoundOutlet,
	DestroyOutletOptions,
	PushSampleFtOptions,
	PushSampleStrtOptions,
	streamInfo,
} from '../nodeLsl.types'

export default class LiblslImpl implements Liblsl {
	private static instance?: Liblsl
	public static ffi = {}
	private bindings: any

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
			console.log('test')
			this.bindings = this.loadBindings(path)
		} catch {
			throw new SpruceError({
				code: 'FAILED_TO_LOAD_LIBLSL',
				liblslPath: path,
			})
		}
	}

	private loadBindings(path: string) {
		open({
			library: 'liblsl',
			path,
		})
		//debugger

		const lsl_create_streaminfo = (
			options: CreateStreamInfoOptions
		): streamInfo | null => {
			const { name, type, channelCount, sampleRate, channelFormat, sourceId } =
				options

			// Check if required options are provided
			// if (
			// 	!name ||
			// 	!type ||
			// 	!channelCount ||
			// 	!sampleRate ||
			// 	!channelFormat ||
			// 	!sourceId
			// ) {
			// 	debugger
			// 	console.error(
			// 		'Error: Missing required options for lsl_create_streaminfo'
			// 	)
			// 	return null
			// }

			try {
				debugger
				const result = load({
					library: 'liblsl',
					funcName: 'lsl_create_streaminfo',
					retType: streamInfo,
					paramsType: [
						DataType.String,
						DataType.String,
						DataType.I32,
						DataType.Double,
						DataType.I32,
						DataType.String,
					],
					paramsValue: [
						name,
						type,
						channelCount,
						sampleRate,
						channelFormat,
						sourceId,
					],
				})
				debugger
				return result
			} catch (error) {
				debugger
				console.error('Error in lsl_create_streaminfo:', error)
				return null
			}
		}

		return {
			lsl_create_streaminfo,
			lsl_create_outlet() {},
			lsl_destroy_outlet() {},
			lsl_local_clock() {},
			lsl_push_sample_ft() {},
			lsl_push_sample_strt() {},
			lsl_get_desc() {},
			lsl_append_child() {},
			lsl_append_child_value() {},
		}

		//@ts-ignore
		// return LiblslImpl.ffi.Library(path!, {
		// 	lsl_create_streaminfo: [
		// 		streamInfo,
		// 		['string', 'string', 'int', 'double', 'int', 'string'],
		// 	],
		// 	lsl_create_outlet: [outletType, [streamInfo, 'int', 'int']],
		// 	lsl_destroy_outlet: ['void', [outletType]],
		// 	lsl_local_clock: ['double', []],
		// 	lsl_push_sample_ft: ['void', [outletType, FloatArray, 'double']],
		// 	lsl_push_sample_strt: ['void', [outletType, StringArray, 'double']],
		// 	lsl_get_desc: [xmlPtr, [streamInfo]],
		// 	lsl_append_child: [xmlPtr, [xmlPtr, 'string']],
		// 	lsl_append_child_value: [xmlPtr, [xmlPtr, 'string', 'string']],
		// }) as LiblslBindings
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

		return this.bindings.lsl_create_streaminfo(options)
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
