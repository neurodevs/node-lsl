import {
    assertValidChannelCount,
    assertValidChannelFormat,
    assertValidChunkSize,
    assertValidMaxBufferedMs,
    assertValidSampleRateHz,
} from '../assertions.js'
import handleError, { LslErrorCode } from '../handleError.js'
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

    public readonly info: StreamInfo
    public readonly name: string
    public readonly type: string
    public readonly sourceId: string
    public readonly channelNames: string[]
    public readonly channelFormat: ChannelFormat
    public readonly channelCount: number
    public readonly sampleRateHz: number
    public readonly chunkSize: number
    public readonly maxBufferedMs = 360 * 1000
    public readonly manufacturer: string = 'N/A'
    public readonly units: string = 'N/A'

    private boundOutlet!: BoundOutlet
    private pushSampleMethod!: (options: unknown) => LslErrorCode

    private lsl = LiblslAdapter.getInstance()

    protected constructor(info: StreamInfo, options: StreamOutletOptions) {
        const {
            name,
            type,
            sourceId,
            channelNames,
            channelFormat,
            sampleRateHz,
            chunkSize,
            maxBufferedMs,
            manufacturer,
            units,
        } = options

        this.info = info
        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.channelNames = channelNames
        this.channelFormat = channelFormat
        this.channelCount = channelNames.length
        this.sampleRateHz = sampleRateHz
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.maxBufferedMs
        this.manufacturer = manufacturer ?? this.manufacturer
        this.units = units ?? this.units

        this.validateOptions()
        this.createStreamOutlet()
        this.setPushSampleMethod()
    }

    public static async Create(options: StreamOutletOptions) {
        const { waitAfterConstructionMs = 10 } = options ?? {}

        const info = this.LslStreamInfo(options)
        const instance = new (this.Class ?? this)(info, options)

        await this.waitToAllowSetup(waitAfterConstructionMs)

        return instance
    }

    private validateOptions() {
        assertValidChannelCount(this.channelCount)
        assertValidSampleRateHz(this.sampleRateHz)
        assertValidChannelFormat(this.channelFormat)
        assertValidChunkSize(this.chunkSize)
        assertValidMaxBufferedMs(this.maxBufferedMs)
        this.validateChannelFormat()
    }

    private validateChannelFormat() {
        if (!this.isChannelFormatSupported) {
            this.throwUnsupportedChannelFormat()
        }
    }

    private get isChannelFormatSupported() {
        return this.channelFormat in this.methodMap
    }

    private throwUnsupportedChannelFormat() {
        throw new Error(
            `This method currently does not support the ${this.channelFormat} type! Please implement it.`
        )
    }

    private createStreamOutlet() {
        this.boundOutlet = this.lsl.createOutlet({
            info: this.boundStreamInfo,
            chunkSize: this.chunkSize,
            maxBufferedMs: this.maxBufferedMs,
        })
    }

    private get boundStreamInfo() {
        return this.info.boundStreamInfo
    }

    private setPushSampleMethod() {
        this.pushSampleMethod = (
            this.lsl[this.pushMethod] as (options: unknown) => LslErrorCode
        ).bind(this.lsl)
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

        const err = this.pushSampleMethod({
            outlet: this.boundOutlet,
            sample,
            timestamp,
        })
        handleError(err)
    }

    public destroy() {
        this.destroyBoundStreamInfo()
        this.destroyBoundOutlet()
    }

    private destroyBoundStreamInfo() {
        this.lsl.destroyStreamInfo({ info: this.boundStreamInfo })
    }

    private destroyBoundOutlet() {
        this.lsl.destroyOutlet({ outlet: this.boundOutlet })
    }

    private static async waitToAllowSetup(waitAfterConstructionMs: number) {
        await new Promise((resolve) =>
            setTimeout(resolve, waitAfterConstructionMs)
        )
    }

    private static LslStreamInfo(options: StreamInfoOptions) {
        const {
            channelNames,
            channelFormat,
            sampleRateHz,
            name,
            type,
            sourceId,
            units,
        } = options

        return LslStreamInfo.Create({
            name,
            type,
            sourceId,
            channelNames,
            channelFormat,
            sampleRateHz,
            units,
        })
    }
}

export interface StreamOutlet {
    pushSample(sample: LslSample): void
    destroy(): void
    readonly info: StreamInfo
    readonly name: string
    readonly type: string
    readonly sourceId: string
    readonly channelNames: string[]
    readonly channelCount: number
    readonly channelFormat: ChannelFormat
    readonly sampleRateHz: number
    readonly units: string
    readonly chunkSize: number
    readonly maxBufferedMs: number
    readonly manufacturer: string
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
    maxBufferedMs?: number
    manufacturer?: string
    units?: string
    waitAfterConstructionMs?: number
}
