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
import { LslErrorCode } from '../lib/handleError.js'

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
        const { infoHandle, channels } = options

        const description = this.bindings.lsl_get_desc([infoHandle])
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
        const { infoHandle } = options
        this.bindings.lsl_destroy_streaminfo([infoHandle])
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

        const handles: InfoHandle[] = []

        for (let i = 0; i < numResults; i++) {
            const handle = resultsBuffer.readBigUInt64LE(i * bytesPerPointer)

            if (handle !== 0n) {
                handles.push(handle)
            }
        }

        return handles
    }

    public createOutlet(options: CreateOutletOptions) {
        const { infoHandle, chunkSize, maxBufferedMs } = options

        return this.bindings.lsl_create_outlet([
            infoHandle,
            chunkSize,
            maxBufferedMs / 1000,
        ])
    }

    public pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions) {
        const { outletHandle, sample, timestamp } = options

        return this.bindings.lsl_push_sample_ft([
            outletHandle,
            sample,
            timestamp,
        ])
    }

    public pushSampleStringTimestamp(
        options: PushSampleStringTimestampOptions
    ) {
        const { outletHandle, sample, timestamp } = options

        return this.bindings.lsl_push_sample_strt([
            outletHandle,
            sample,
            timestamp,
        ])
    }

    public destroyOutlet(options: DestroyOutletOptions) {
        const { outletHandle } = options
        this.bindings.lsl_destroy_outlet([outletHandle])
    }

    public createInlet(options: CreateInletOptions) {
        const { infoHandle, maxBufferedMs } = options

        return this.bindings.lsl_create_inlet([
            infoHandle,
            maxBufferedMs / 1000,
            this.maxChunkSize,
            this.shouldRecover,
        ])
    }

    private readonly maxChunkSize = 0
    private readonly shouldRecover = 1

    public getChannelCount(options: GetChannelCountOptions) {
        const { infoHandle } = options
        return this.bindings.lsl_get_channel_count([infoHandle])
    }

    public async openStream(options: OpenStreamOptions) {
        const { inletHandle, timeoutMs, errorCodePtr } = options

        await this.load({
            library: 'lsl',
            funcName: 'lsl_open_stream',
            retType: DataType.Void,
            paramsType: [DataType.External, DataType.Double, DataType.External],
            paramsValue: [inletHandle, timeoutMs / 1000, errorCodePtr],
            runInNewThread: true,
        })
    }

    public closeStream(options: CloseStreamOptions) {
        const { inletHandle } = options

        this.load({
            library: 'lsl',
            funcName: 'lsl_close_stream',
            retType: DataType.Void,
            paramsType: [DataType.External],
            paramsValue: [inletHandle],
        })
    }

    public pullSample(options: PullSampleOptions) {
        const {
            inletHandle,
            dataBufferPtr,
            dataBufferElements,
            timeoutMs,
            errorCodePtr: errorCodePtr,
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
                inletHandle,
                dataBufferPtr,
                dataBufferElements,
                timeoutMs / 1000,
                errorCodePtr,
            ],
        })
    }

    public pullChunk(options: PullChunkOptions) {
        const {
            inletHandle,
            dataBufferPtr,
            timestampBufferPtr,
            dataBufferElements,
            timestampBufferElements,
            timeoutMs,
            errorCodePtr: errorCodePtr,
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
                inletHandle,
                dataBufferPtr,
                timestampBufferPtr,
                dataBufferElements,
                timestampBufferElements,
                timeoutMs / 1000,
                errorCodePtr,
            ],
        })
    }

    public flushInlet(options: FlushInletOptions) {
        const { inletHandle } = options
        this.bindings.lsl_inlet_flush([inletHandle])
    }

    public destroyInlet(options: DestroyInletOptions) {
        const { inletHandle } = options
        this.bindings.lsl_destroy_inlet([inletHandle])
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
            lsl_inlet_flush: {
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
            lsl_get_channel_count: {
                library: 'lsl',
                retType: DataType.I32,
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

    createStreamInfo(options: CreateStreamInfoOptions): InfoHandle
    destroyStreamInfo(options: DestroyStreamInfoOptions): void
    appendChannelsToStreamInfo(options: AppendChannelsToStreamInfoOptions): void
    getChannelCount(options: GetChannelCountOptions): number

    resolveByProp(options: ResolveByPropOptions): Promise<InfoHandle[]>

    createOutlet(options: CreateOutletOptions): OutletHandle

    pushSampleFloatTimestamp(
        options: PushSampleFloatTimestampOptions
    ): LslErrorCode

    pushSampleStringTimestamp(
        options: PushSampleStringTimestampOptions
    ): LslErrorCode

    destroyOutlet(options: DestroyOutletOptions): void

    createInlet(options: CreateInletOptions): InletHandle
    openStream(options: OpenStreamOptions): Promise<void>
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
    infoHandle: InfoHandle
    channels: LslChannel[]
}

export interface GetChannelCountOptions {
    infoHandle: InfoHandle
}

export interface DestroyStreamInfoOptions {
    infoHandle: InfoHandle
}

export interface ResolveByPropOptions {
    prop: string
    value: string
    minResults?: number
    timeoutMs?: number
}

export interface CreateOutletOptions {
    infoHandle: InfoHandle
    chunkSize: number
    maxBufferedMs: number
}

export interface PushSampleFloatTimestampOptions {
    outletHandle: OutletHandle
    sample: number[]
    timestamp: number
}

export interface PushSampleStringTimestampOptions {
    outletHandle: OutletHandle
    sample: string[]
    timestamp: number
}

export interface DestroyOutletOptions {
    outletHandle: OutletHandle
}

export interface CreateInletOptions {
    infoHandle: InfoHandle
    maxBufferedMs: number
}

export interface OpenStreamOptions {
    inletHandle: InletHandle
    timeoutMs: number
    errorCodePtr: JsExternal
}

export interface CloseStreamOptions {
    inletHandle: InletHandle
}

export interface PullSampleOptions {
    inletHandle: InletHandle
    dataBufferPtr: JsExternal
    dataBufferElements: number
    timeoutMs: number
    errorCodePtr: JsExternal
}

export interface PullChunkOptions extends PullSampleOptions {
    timestampBufferPtr: JsExternal
    timestampBufferElements: number
}

export interface FlushInletOptions {
    inletHandle: InletHandle
}

export interface DestroyInletOptions {
    inletHandle: InletHandle
}

export interface LiblslBindings {
    lsl_create_streaminfo(
        args: [string, string, number, number, number, string]
    ): InfoHandle

    lsl_get_desc(args: [InfoHandle]): DescriptionHandle
    lsl_get_channel_count(args: [InfoHandle]): number
    lsl_append_child(args: [DescriptionHandle, string]): ChildHandle
    lsl_append_child_value(args: [ChildHandle, string, string]): void
    lsl_destroy_streaminfo(args: [InfoHandle]): void

    lsl_create_outlet(args: [InfoHandle, number, number]): OutletHandle
    lsl_push_sample_ft(args: [OutletHandle, LslSample, number]): LslErrorCode
    lsl_push_sample_strt(args: [OutletHandle, LslSample, number]): LslErrorCode
    lsl_destroy_outlet(args: [OutletHandle]): void

    lsl_create_inlet(args: any): InletHandle
    lsl_inlet_flush(args: [InletHandle]): void
    lsl_destroy_inlet(args: any): void

    lsl_local_clock(args: []): number
}

export type ChannelFormat = (typeof CHANNEL_FORMATS)[number]

export interface LslChannel {
    label: string
    units: string
    type: string
}

export type LslSample = (number | string | undefined)[]

export interface InfoHandle {}
export interface OutletHandle {}
export interface InletHandle {}
export interface DescriptionHandle {}
export interface ChildHandle {}
