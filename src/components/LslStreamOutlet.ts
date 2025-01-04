import { assertOptions } from '@sprucelabs/schema'
import LiblslAdapter from '../adapters/LiblslAdapter'
import {
    assertValidChannelCount,
    assertValidChannelFormat,
    assertValidChunkSize,
    assertValidMaxBuffered,
    assertValidSampleRate,
} from '../assertions'
import { ChannelFormat, BoundOutlet, Liblsl, LslSample } from '../nodeLsl.types'
import LslStreamInfo, { StreamInfo, StreamInfoOptions } from './LslStreamInfo'

export default class LslStreamOutlet implements LslOutlet {
    public static Class?: LslOutletConstructor

    private info: StreamInfo
    private options: LslOutletOptions
    private outlet!: BoundOutlet
    private pushSampleByType!: (options: any) => void

    protected constructor(info: StreamInfo, options: LslOutletOptions) {
        this.info = info
        this.options = options

        this.validateOptions()
        this.createLslOutlet()
        this.setPushSampleType()
    }

    public static async Create(options: LslOutletOptions) {
        assertOptions(options, [
            'name',
            'type',
            'sourceId',
            'channelNames',
            'channelFormat',
            'sampleRate',
            'chunkSize',
            'maxBuffered',
            'manufacturer',
            'unit',
        ])

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

    private createLslOutlet() {
        this.outlet = this.lsl.createOutlet({
            info: this.boundStreamInfo,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
        })
    }

    private setPushSampleType() {
        const pushMethod = this.getPushMethod()
        this.pushSampleByType = this.lsl[pushMethod].bind(this.lsl)
    }

    public destroy() {
        this.lsl.destroyOutlet({ outlet: this.outlet })
    }

    public pushSample(sample: LslSample) {
        const timestamp = this.lsl.localClock()

        this.pushSampleByType({
            outlet: this.outlet,
            sample,
            timestamp,
        })
    }

    private getPushMethod() {
        const channelFormat = this.channelFormat

        const methodMap: Record<string, keyof Liblsl> = {
            float32: 'pushSampleFloatTimestamp',
            string: 'pushSampleStringTimestamp',
        }

        if (!(channelFormat in methodMap)) {
            throw new Error(
                `This method currently does not support the ${channelFormat} type! Please implement it.`
            )
        }
        return methodMap[channelFormat]
    }

    private get channelNames() {
        return this.options.channelNames
    }

    private get channelCount() {
        return this.channelNames.length
    }

    private get channelFormat() {
        return this.options.channelFormat
    }

    private get sampleRate() {
        return this.options.sampleRate
    }

    private get chunkSize() {
        return this.options.chunkSize
    }

    private get maxBuffered() {
        return this.options.maxBuffered
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

export interface LslOutlet {
    destroy(): void
    pushSample(sample: LslSample): void
}

export type LslOutletConstructor = new (
    info: StreamInfo,
    options: LslOutletOptions
) => LslOutlet

export interface LslOutletOptions {
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
