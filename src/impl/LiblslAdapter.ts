import { DataType, define, load, open } from 'ffi-rs'

import {
    Liblsl,
    LiblslBindings,
    CreateStreamInfoOptions,
    AppendChannelsToStreamInfoOptions,
    CreateOutletOptions,
    DestroyOutletOptions,
    PushSampleFloatTimestampOptions,
    PushSampleStringTimestampOptions,
    CreateInletOptions,
    DestroyInletOptions,
    FlushInletOptions,
    PullChunkOptions,
    PullSampleOptions,
} from '../types.js'

export default class LiblslAdapter implements Liblsl {
    public static open = open
    public static define = define
    public static load = load

    private static instance?: Liblsl

    private path: string
    private bindings!: LiblslBindings

    private readonly defaultMacOsPath = `/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib`

    protected constructor() {
        this.path = process.env.LIBLSL_PATH! ?? this.defaultMacOsPath
        this.tryToLoadBindings()
    }

    private tryToLoadBindings() {
        try {
            this.loadBindings()
        } catch (error) {
            this.throwFailedToLoadLiblsl(error as Error)
        }
    }

    private throwFailedToLoadLiblsl(error: Error) {
        throw new Error(
            `Loading the liblsl dylib failed! I tried to load it from ${this.path}.\n\n${error.message}\n\n`
        )
    }

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

    private loadBindings() {
        this.openLiblsl()
        this.bindings = this.defineLiblslBindings()
    }

    private openLiblsl() {
        this.open({
            library: 'lsl',
            path: this.path,
        })
    }

    private defineLiblslBindings() {
        return this.define(this.liblslFuncs) as unknown as LiblslBindings
    }

    public createStreamInfo(options: CreateStreamInfoOptions) {
        const {
            name,
            type,
            channelCount,
            sampleRate,
            channelFormat,
            sourceId,
        } = options

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
        const { info, channels } = options

        const description = this.bindings.lsl_get_desc([info])
        const parent = this.bindings.lsl_append_child([description, 'channels'])

        for (const channel of channels) {
            const child = this.bindings.lsl_append_child([parent, 'channel'])
            this.bindings.lsl_append_child_value([
                child,
                'label',
                channel.label,
            ])
            this.bindings.lsl_append_child_value([child, 'unit', channel.unit])
            this.bindings.lsl_append_child_value([child, 'type', channel.type])
        }
    }

    public createOutlet(options: CreateOutletOptions) {
        const { info, chunkSize, maxBuffered } = options
        return this.bindings.lsl_create_outlet([info, chunkSize, maxBuffered])
    }

    public pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions) {
        const { outlet, sample, timestamp } = options
        this.bindings.lsl_push_sample_ft([outlet, sample, timestamp])
    }

    public pushSampleStringTimestamp(
        options: PushSampleStringTimestampOptions
    ) {
        const { outlet, sample, timestamp } = options
        this.bindings.lsl_push_sample_strt([outlet, sample, timestamp])
    }

    public destroyOutlet(options: DestroyOutletOptions) {
        const { outlet } = options
        this.bindings.lsl_destroy_outlet([outlet])
    }

    public createInlet(options: CreateInletOptions) {
        const { info, chunkSize, maxBuffered } = options
        return this.bindings.lsl_create_inlet([info, chunkSize, maxBuffered])
    }

    public pullSample(options: PullSampleOptions) {
        const {
            inlet,
            dataBufferPtr,
            dataBufferElements,
            timeout,
            errcodePtr,
        } = options

        return this.load({
            library: 'lsl',
            funcName: 'lsl_pull_sample_f',
            retType: DataType.Double,
            paramsType: [
                DataType.External,
                DataType.External,
                DataType.I32,
                DataType.Double,
                DataType.External,
            ],
            paramsValue: [
                inlet,
                dataBufferPtr,
                dataBufferElements,
                timeout,
                errcodePtr,
            ],
        })
    }

    public pullChunk(options: PullChunkOptions) {
        const {
            inlet,
            dataBufferPtr,
            timestampBufferPtr,
            dataBufferElements,
            timestampBufferElements,
            timeout,
            errcodePtr,
        } = options

        return this.load({
            library: 'lsl',
            funcName: 'lsl_pull_chunk_f',
            retType: DataType.Double,
            paramsType: [
                DataType.External,
                DataType.External,
                DataType.External,
                DataType.I32,
                DataType.I32,
                DataType.Double,
                DataType.External,
            ],
            paramsValue: [
                inlet,
                dataBufferPtr,
                timestampBufferPtr,
                dataBufferElements,
                timestampBufferElements,
                timeout,
                errcodePtr,
            ],
        })
    }

    public flushInlet(options: FlushInletOptions) {
        const { inlet } = options
        this.bindings.lsl_flush_inlet([inlet])
    }

    public destroyInlet(options: DestroyInletOptions) {
        const { inlet } = options
        this.bindings.lsl_destroy_inlet([inlet])
    }

    public localClock() {
        return this.bindings.lsl_local_clock([])
    }

    private get open() {
        return LiblslAdapter.open
    }

    private get define() {
        return LiblslAdapter.define
    }

    private get load() {
        return LiblslAdapter.load
    }

    private get liblslFuncs() {
        return {
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
            lsl_push_sample_ft: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [
                    DataType.External,
                    DataType.FloatArray,
                    DataType.Double,
                ],
            },
            lsl_push_sample_strt: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [
                    DataType.External,
                    DataType.StringArray,
                    DataType.Double,
                ],
            },
            lsl_destroy_outlet: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
            },
            lsl_create_inlet: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External, DataType.I32, DataType.I32],
            },
            lsl_flush_inlet: {
                library: 'lsl',
                retType: DataType.I32,
                paramsType: [DataType.External],
            },
            lsl_destroy_inlet: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
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
                paramsType: [
                    DataType.External,
                    DataType.String,
                    DataType.String,
                ],
            },
            lsl_local_clock: {
                library: 'lsl',
                retType: DataType.Double,
                paramsType: [],
            },
        }
    }
}
