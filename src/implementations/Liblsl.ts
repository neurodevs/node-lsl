import { assertOptions } from '@sprucelabs/schema'
import { DataType, define, open } from 'ffi-rs'
import SpruceError from '../errors/SpruceError'
import {
	Liblsl,
	LiblslBindings,
	CreateStreamInfoOptions,
	AppendChannelsToStreamInfoOptions,
	CreateOutletOptions,
	DestroyOutletOptions,
	PushSampleFloatTimestampOptions,
	PushSampleStringTimestampOptions,
} from '../nodeLsl.types'

export default class LiblslImpl implements Liblsl {
	private static instance?: Liblsl
	public static ffiRsOpen = open
	public static ffiRsDefine = define

	private bindings: LiblslBindings

	public static getInstance() {
		if (!this.instance) {
			this.setInstance(new this())
		}
		return this.instance!
	}

	public static setInstance(instance: Liblsl) {
		this.instance = instance
	}

	public static resetInstance() {
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

	private loadBindings(liblslPath: string) {
		LiblslImpl.ffiRsOpen({
			library: 'lsl',
			path: liblslPath,
		})

		return LiblslImpl.ffiRsDefine({
			lsl_create_streaminfo: {
				library: 'lsl',
				retType: DataType.External,
				paramsType: [
					DataType.String,
					DataType.String,
					DataType.I32,
					DataType.Double,
					DataType.I32,
					DataType.String,
				],
			},
			lsl_create_outlet: {
				library: 'lsl',
				retType: DataType.External,
				paramsType: [DataType.External, DataType.I32, DataType.I32],
			},
			lsl_destroy_outlet: {
				library: 'lsl',
				retType: DataType.Void,
				paramsType: [DataType.External],
			},
			lsl_local_clock: {
				library: 'lsl',
				retType: DataType.Double,
				paramsType: [],
			},
			lsl_push_sample_ft: {
				library: 'lsl',
				retType: DataType.Void,
				paramsType: [DataType.External, DataType.DoubleArray, DataType.Double],
			},
			lsl_push_sample_strt: {
				library: 'lsl',
				retType: DataType.Void,
				paramsType: [DataType.External, DataType.StringArray, DataType.Double],
			},
			lsl_get_desc: {
				library: 'lsl',
				retType: DataType.External,
				paramsType: [DataType.External],
			},
			lsl_append_child: {
				library: 'lsl',
				retType: DataType.External,
				paramsType: [DataType.External, DataType.String],
			},
			lsl_append_child_value: {
				library: 'lsl',
				retType: DataType.External,
				paramsType: [DataType.External, DataType.String, DataType.String],
			},
		}) as unknown as LiblslBindings
	}

	public createStreamInfo(options: CreateStreamInfoOptions) {
		const { name, type, channelCount, sampleRate, channelFormat, sourceId } =
			assertOptions(options, [
				'name',
				'type',
				'channelCount',
				'sampleRate',
				'channelFormat',
				'sourceId',
			])

		return this.bindings.lsl_create_streaminfo([
			name,
			type,
			channelCount,
			sampleRate,
			channelFormat,
			sourceId,
		])
	}

	public appendChannelsToStreamInfo(
		options: AppendChannelsToStreamInfoOptions
	) {
		const { info, channels } = assertOptions(options, ['info', 'channels'])

		const description = this.bindings.lsl_get_desc([info])
		const parent = this.bindings.lsl_append_child([description, 'channels'])

		for (const channel of channels) {
			const child = this.bindings.lsl_append_child([parent, 'channel'])
			this.bindings.lsl_append_child_value([child, 'label', channel.label])
			this.bindings.lsl_append_child_value([child, 'unit', channel.unit])
			this.bindings.lsl_append_child_value([child, 'type', channel.type])
		}
	}

	public createOutlet(options: CreateOutletOptions) {
		const { info, chunkSize, maxBuffered } = assertOptions(options, [
			'info',
			'chunkSize',
			'maxBuffered',
		])

		return this.bindings.lsl_create_outlet([info, chunkSize, maxBuffered])
	}

	public destroyOutlet(options: DestroyOutletOptions) {
		const { outlet } = assertOptions(options, ['outlet'])
		this.bindings.lsl_destroy_outlet([outlet])
	}

	public pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions) {
		const { outlet, sample, timestamp } = assertOptions(options, [
			'outlet',
			'sample',
			'timestamp',
		])
		this.bindings.lsl_push_sample_ft([outlet, sample, timestamp])
	}

	public pushSampleStringTimestamp(options: PushSampleStringTimestampOptions) {
		const { outlet, sample, timestamp } = assertOptions(options, [
			'outlet',
			'sample',
			'timestamp',
		])
		this.bindings.lsl_push_sample_strt([outlet, sample, timestamp])
	}

	public localClock() {
		return this.bindings.lsl_local_clock()
	}
}
