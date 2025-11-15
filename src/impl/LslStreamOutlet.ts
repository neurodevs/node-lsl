import {
    assertValidChannelCount,
    assertValidChannelFormat,
    assertValidChunkSize,
    assertValidMaxBufferedMs,
    assertValidSampleRateHz,
} from '../assertions.js'
import {
    ChannelFormat,
    BoundOutlet,
    Liblsl,
    LslSample,
} from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'
import LslStreamInfo, {
    StreamInfo,
    StreamInfoOptions,
} from './LslStreamInfo.js'

export default class LslStreamOutlet implements StreamOutlet {
    public static Class?: StreamOutletConstructor

    private info: StreamInfo
    private options: StreamOutletOptions
    private outlet!: BoundOutlet
    private pushSampleByType!: (options: any) => void

    protected constructor(info: StreamInfo, options: StreamOutletOptions) {
        this.info = info
        this.options = options

        this.validateOptions()
        this.createStreamOutlet()
        this.setPushSampleType()
    }

    public static async Create(options: StreamOutletOptions) {
        const { waitAfterConstructionMs = 10 } = options ?? {}

        const infoOptions = {
            channelNames: options.channelNames,
            channelFormat: options.channelFormat,
            sampleRateHz: options.sampleRateHz,
            name: options.name,
            type: options.type,
            sourceId: options.sourceId,
            units: options.unit,
        }

        const info = this.LslStreamInfo(infoOptions)
        const instance = new (this.Class ?? this)(info, options)

        await this.wait(waitAfterConstructionMs)

        return instance
    }

    private validateOptions() {
        assertValidChannelCount(this.channelCount)
        assertValidSampleRateHz(this.sampleRateHz)
        assertValidChannelFormat(this.channelFormat)
        assertValidChunkSize(this.chunkSize)
        assertValidMaxBufferedMs(this.maxBufferedMs)
    }

    private createStreamOutlet() {
        this.outlet = this.lsl.createOutlet({
            info: this.boundStreamInfo,
            chunkSize: this.chunkSize,
            maxBufferedMs: this.maxBufferedMs,
        })
    }

    private setPushSampleType() {
        this.validateChannelFormat()

        this.pushSampleByType = this.lsl[this.pushMethod].bind(this.lsl)
    }

    private validateChannelFormat() {
        if (!(this.channelFormat in this.methodMap)) {
            this.throwUnsupportedChannelFormat()
        }
    }

    private throwUnsupportedChannelFormat() {
        throw new Error(this.unsupportedChannelMessage)
    }

    private get unsupportedChannelMessage() {
        return `This method currently does not support the ${this.channelFormat} type! Please implement it.`
    }

    private get pushMethod() {
        return this.methodMap[this.channelFormat]
    }

    private readonly methodMap: Record<string, keyof Liblsl> = {
        float32: 'pushSampleFloatTimestamp',
        string: 'pushSampleStringTimestamp',
    }

    public pushSample(sample: LslSample) {
        const timestamp = this.lsl.localClock()

        this.pushSampleByType({
            outlet: this.outlet,
            sample,
            timestamp,
        })
    }

    public destroy() {
        this.lsl.destroyOutlet({ outlet: this.outlet })
    }

    public get name() {
        return this.options.name
    }

    public get type() {
        return this.options.type
    }

    public get sourceId() {
        return this.options.sourceId
    }

    public get channelNames() {
        return this.options.channelNames
    }

    public get channelCount() {
        return this.channelNames.length
    }

    public get channelFormat() {
        return this.options.channelFormat
    }

    public get sampleRateHz() {
        return this.options.sampleRateHz
    }

    public get chunkSize() {
        return this.options.chunkSize
    }

    public get maxBufferedMs() {
        return this.options.maxBufferedMs
    }

    public get manufacturer() {
        return this.options.manufacturer
    }

    public get unit() {
        return this.options.unit
    }

    private get boundStreamInfo() {
        return this.info.boundStreamInfo
    }

    private get lsl() {
        return LiblslAdapter.getInstance()
    }

    private static async wait(waitMs: number) {
        return new Promise((resolve) => setTimeout(resolve, waitMs))
    }

    private static LslStreamInfo(options: StreamInfoOptions) {
        return LslStreamInfo.Create(options)
    }
}

export interface StreamOutlet {
    pushSample(sample: LslSample): void
    destroy(): void
    readonly name: string
    readonly type: string
    readonly sourceId: string
    readonly channelNames: string[]
    readonly channelFormat: ChannelFormat
    readonly sampleRateHz: number
    readonly chunkSize: number
    readonly maxBufferedMs: number
    readonly manufacturer: string
    readonly unit: string
}

export type StreamOutletConstructor = new (
    info: StreamInfo,
    options: StreamOutletOptions
) => StreamOutlet

export interface StreamOutletOptions {
    name: string
    type: string
    sourceId: string
    channelNames: string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    chunkSize: number
    maxBufferedMs: number
    manufacturer: string
    unit: string
    waitAfterConstructionMs?: number
}
