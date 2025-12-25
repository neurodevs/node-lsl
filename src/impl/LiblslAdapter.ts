import {
    createPointer,
    DataType,
    define,
    JsExternal,
    load,
    open,
    unwrapPointer,
} from 'ffi-rs'

import { CHANNEL_FORMATS } from '../consts.js'
import { LslErrorCode } from '../handleError.js'

export default class LiblslAdapter implements Liblsl {
    public static open = open
    public static define = define
    public static load = load
    public static alloc = Buffer.alloc

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
        return this.define(this.liblslFuncs) as LiblslBindings
    }

    public createStreamInfo(options: CreateStreamInfoOptions) {
        const {
            name,
            type,
            sourceId,
            channelCount,
            channelFormat,
            sampleRateHz,
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

    public destroyStreamInfo(options: DestroyStreamInfoOptions) {
        const { info } = options
        this.bindings.lsl_destroy_streaminfo([info])
    }

    public async resolveByProp(options: ResolveByPropOptions) {
        const { prop, value, minResults = 1, timeoutMs = 1000 } = options

        const maxResults = 1024
        const bytesPerPointer = 8

        const resultsBuffer = this.alloc(maxResults * bytesPerPointer)

        const resultsBufferPtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [resultsBuffer],
            })
        )[0]

        const numResults = await this.load({
            library: 'lsl',
            funcName: 'lsl_resolve_byprop',
            retType: DataType.I32,
            paramsType: [
                DataType.External,
                DataType.I32,
                DataType.String,
                DataType.String,
                DataType.I32,
                DataType.Double,
            ],
            paramsValue: [
                resultsBufferPtr,
                maxResults,
                prop,
                value,
                minResults,
                timeoutMs / 1000,
            ],
            runInNewThread: true,
        })

        const handles: bigint[] = []

        for (let i = 0; i < numResults; i++) {
            const handle = resultsBuffer.readBigUInt64LE(i * bytesPerPointer)

            if (handle !== 0n) {
                handles.push(handle)
            }
        }

        return handles
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
        return this.bindings.lsl_push_sample_ft([outlet, sample, timestamp])
    }

    public pushSampleStringTimestamp(
        options: PushSampleStringTimestampOptions
    ) {
        const { outlet, sample, timestamp } = options
        return this.bindings.lsl_push_sample_strt([outlet, sample, timestamp])
    }

    public destroyOutlet(options: DestroyOutletOptions) {
        const { outlet } = options
        this.bindings.lsl_destroy_outlet([outlet])
    }

    public createInlet(options: CreateInletOptions) {
        const { info, maxBufferedMs } = options

        return this.bindings.lsl_create_inlet([
            info,
            maxBufferedMs / 1000,
            this.maxChunkSize,
            this.shouldRecover,
        ])
    }

    private readonly maxChunkSize = 0
    private readonly shouldRecover = 1

    public openStream(options: OpenStreamOptions) {
        const { inlet, timeoutMs, errcodePtr } = options
        this.bindings.lsl_open_stream([inlet, timeoutMs / 1000, errcodePtr])
    }

    public closeStream(options: CloseStreamOptions) {
        const { inlet } = options
        this.bindings.lsl_close_stream([inlet])
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

    private get alloc() {
        return LiblslAdapter.alloc
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
            lsl_destroy_streaminfo: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
            },
            lsl_create_outlet: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External, DataType.I32, DataType.I32],
            },
            lsl_push_sample_ft: {
                library: 'lsl',
                retType: DataType.I32,
                paramsType: [
                    DataType.External,
                    DataType.FloatArray,
                    DataType.Double,
                ],
            },
            lsl_push_sample_strt: {
                library: 'lsl',
                retType: DataType.I32,
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
                paramsType: [
                    DataType.External,
                    DataType.I32,
                    DataType.I32,
                    DataType.I32,
                ],
            },
            lsl_open_stream: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External, DataType.Double, DataType.I32],
            },
            lsl_close_stream: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
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
    destroyStreamInfo(options: DestroyStreamInfoOptions): void
    appendChannelsToStreamInfo(options: AppendChannelsToStreamInfoOptions): void

    resolveByProp(options: ResolveByPropOptions): Promise<bigint[]>

    createOutlet(options: CreateOutletOptions): BoundOutlet

    pushSampleFloatTimestamp(
        options: PushSampleFloatTimestampOptions
    ): LslErrorCode

    pushSampleStringTimestamp(
        options: PushSampleStringTimestampOptions
    ): LslErrorCode

    destroyOutlet(options: DestroyOutletOptions): void

    createInlet(options: CreateInletOptions): BoundInlet
    openStream(options: OpenStreamOptions): void
    closeStream(options: CloseStreamOptions): void
    pullSample(options: PullSampleOptions): number
    pullChunk(options: PullChunkOptions): number
    flushInlet(options: FlushInletOptions): void
    destroyInlet(options: DestroyInletOptions): void

    localClock(): number
}

export interface CreateStreamInfoOptions {
    name: string
    type: string
    sourceId: string
    channelCount: number
    channelFormat: number
    sampleRateHz: number
    manufacturer?: string
    units?: string
}

export interface AppendChannelsToStreamInfoOptions {
    info: BoundStreamInfo
    channels: LslChannel[]
}

export interface DestroyStreamInfoOptions {
    info: BoundStreamInfo
}

export interface ResolveByPropOptions {
    prop: string
    value: string
    minResults?: number
    timeoutMs?: number
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
    maxBufferedMs: number
}

export interface OpenStreamOptions {
    inlet: BoundInlet
    timeoutMs: number
    errcodePtr: JsExternal
}

export interface CloseStreamOptions {
    inlet: BoundInlet
}

export interface PullSampleOptions {
    inlet: BoundInlet
    dataBufferPtr: JsExternal
    dataBufferElements: number
    timeout: number
    errcodePtr: JsExternal
}

export interface PullChunkOptions extends PullSampleOptions {
    timestampBufferPtr: JsExternal
    timestampBufferElements: number
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

    lsl_destroy_streaminfo(args: [BoundStreamInfo]): void
    lsl_create_outlet(args: [BoundStreamInfo, number, number]): BoundOutlet
    lsl_push_sample_ft(args: [BoundOutlet, LslSample, number]): LslErrorCode
    lsl_push_sample_strt(args: [BoundOutlet, LslSample, number]): LslErrorCode
    lsl_destroy_outlet(args: [BoundOutlet]): void
    lsl_create_inlet(args: any): BoundInlet
    lsl_open_stream(args: [BoundInlet, number, JsExternal]): void
    lsl_close_stream(args: [BoundInlet]): void
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
