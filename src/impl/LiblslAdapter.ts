import { DataType, define, JsExternal, load, open, unwrapPointer } from 'ffi-rs'

import { CHANNEL_FORMATS } from '../consts.js'

export default class LiblslAdapter implements Liblsl {
    public static open = open
    public static define = define
    public static load = load

    private static instance?: Liblsl

    public liblslPath: string
    private bindings!: LiblslBindings

    private readonly defaultMacOsPath = `/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib`

    protected constructor() {
        this.liblslPath = process.env.LIBLSL_PATH ?? this.defaultMacOsPath
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
            `Loading the liblsl dylib failed! I tried to load it from ${this.liblslPath}.\n\n${error.message}\n\n`
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
            path: this.liblslPath,
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
            sampleRateHz,
            channelFormat,
            sourceId,
        } = options

        return this.bindings.lsl_create_streaminfo([
            name,
            type,
            channelCount,
            sampleRateHz,
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
            this.bindings.lsl_append_child_value([child, 'unit', channel.units])
            this.bindings.lsl_append_child_value([child, 'type', channel.type])
        }
    }

    public createOutlet(options: CreateOutletOptions) {
        const { info, chunkSize, maxBufferedMs } = options

        return this.bindings.lsl_create_outlet([
            info,
            chunkSize,
            maxBufferedMs / 1000,
        ])
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
        const { info, chunkSize, maxBufferedMs } = options

        return this.bindings.lsl_create_inlet([
            info,
            chunkSize,
            maxBufferedMs / 1000,
        ])
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
                unwrapPointer([dataBufferPtr])[0],
                unwrapPointer([timestampBufferPtr])[0],
                dataBufferElements,
                timestampBufferElements,
                timeout,
                unwrapPointer([errcodePtr])[0],
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

export interface Liblsl {
    liblslPath: string

    createStreamInfo(options: CreateStreamInfoOptions): BoundStreamInfo
    appendChannelsToStreamInfo(options: AppendChannelsToStreamInfoOptions): void

    createOutlet(options: CreateOutletOptions): BoundOutlet
    pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions): void
    pushSampleStringTimestamp(options: PushSampleStringTimestampOptions): void
    destroyOutlet(options: DestroyOutletOptions): void

    createInlet(options: CreateInletOptions): BoundInlet
    pullSample(options: PullSampleOptions): number
    pullChunk(options: PullChunkOptions): number
    flushInlet(options: FlushInletOptions): void
    destroyInlet(options: DestroyInletOptions): void

    localClock(): number
}

export interface CreateStreamInfoOptions {
    name: string
    type: string
    channelCount: number
    sampleRateHz: number
    channelFormat: number
    sourceId: string
    manufacturer?: string
    units?: string
}

export interface AppendChannelsToStreamInfoOptions {
    info: BoundStreamInfo
    channels: LslChannel[]
}

export interface CreateOutletOptions {
    info: BoundStreamInfo
    chunkSize: number
    maxBufferedMs: number
}

export interface PushSampleFloatTimestampOptions {
    outlet: BoundOutlet
    sample: number[]
    timestamp: number
}

export interface PushSampleStringTimestampOptions {
    outlet: BoundOutlet
    sample: string[]
    timestamp: number
}

export interface DestroyOutletOptions {
    outlet: BoundOutlet
}

export interface CreateInletOptions {
    info: BoundStreamInfo
    chunkSize: number
    maxBufferedMs: number
}

export interface PullSampleOptions {
    inlet: BoundInlet
    dataBufferPtr: JsExternal
    dataBufferElements: number
    timeout: number
    errcodePtr: JsExternal
}

export interface PullChunkOptions {
    inlet: BoundInlet
    dataBufferPtr: JsExternal
    timestampBufferPtr: JsExternal
    dataBufferElements: number
    timestampBufferElements: number
    timeout: number
    errcodePtr: JsExternal
}

export interface FlushInletOptions {
    inlet: BoundInlet
}

export interface DestroyInletOptions {
    inlet: BoundInlet
}

export interface LiblslBindings {
    lsl_create_streaminfo(
        args: [string, string, number, number, number, string]
    ): BoundStreamInfo

    lsl_create_outlet(args: [BoundStreamInfo, number, number]): BoundOutlet
    lsl_push_sample_ft(args: [BoundOutlet, LslSample, number]): void
    lsl_push_sample_strt(args: [BoundOutlet, LslSample, number]): void
    lsl_destroy_outlet(args: [BoundOutlet]): void
    lsl_create_inlet(args: any): BoundInlet
    lsl_flush_inlet(args: [BoundInlet]): void
    lsl_destroy_inlet(args: any): void
    lsl_local_clock(args: []): number
    lsl_get_desc(args: [BoundStreamInfo]): BoundDescription
    lsl_append_child(args: [BoundDescription, string]): BoundChild
    lsl_append_child_value(args: [BoundChild, string, string]): void
}

export type ChannelFormat = (typeof CHANNEL_FORMATS)[number]

export interface LslChannel {
    label: string
    units: string
    type: string
}

export type LslSample = (number | string | undefined)[]

export interface BoundStreamInfo {}
export interface BoundOutlet {}
export interface BoundInlet {}
export interface BoundDescription {}
export interface BoundChild {}
