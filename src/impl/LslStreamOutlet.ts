import {
    assertValidChannelCount,
    assertValidChannelFormat,
    assertValidChunkSize,
    assertValidMaxBuffered,
    assertValidSampleRate,
} from '../assertions'
import { ChannelFormat, BoundOutlet, Liblsl, LslSample } from '../types'
import LiblslAdapter from './LiblslAdapter'
import LslStreamInfo, { StreamInfo, StreamInfoOptions } from './LslStreamInfo'

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

        const streamInfoOptions = {
            channelNames: options.channelNames,
            channelFormat: options.channelFormat,
            sampleRate: options.sampleRate,
            name: options.name,
            type: options.type,
            sourceId: options.sourceId,
            units: options.unit,
        }

        const info = this.LslStreamInfo(streamInfoOptions)
        const instance = new (this.Class ?? this)(info, options)

        await this.wait(waitAfterConstructionMs)

        return instance
    }

    private validateOptions() {
        assertValidChannelCount(this.channelCount)
        assertValidSampleRate(this.sampleRate)
        assertValidChannelFormat(this.channelFormat)
        assertValidChunkSize(this.chunkSize)
        assertValidMaxBuffered(this.maxBuffered)
    }

    private createStreamOutlet() {
        this.outlet = this.lsl.createOutlet({
            info: this.boundStreamInfo,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
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

    public get sampleRate() {
        return this.options.sampleRate
    }

    public get chunkSize() {
        return this.options.chunkSize
    }

    public get maxBuffered() {
        return this.options.maxBuffered
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
    readonly sampleRate: number
    readonly chunkSize: number
    readonly maxBuffered: number
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
    sampleRate: number
    chunkSize: number
    maxBuffered: number
    manufacturer: string
    unit: string
    waitAfterConstructionMs?: number
}
