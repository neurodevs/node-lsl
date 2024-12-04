import { assertOptions } from '@sprucelabs/schema'
import {
    assertValidChannelCount,
    assertValidChannelFormat,
    assertValidChunkSize,
    assertValidMaxBuffered,
    assertValidSampleRate,
} from '../assertions'
import { CHANNEL_FORMATS_MAP } from '../consts'
import {
    ChannelFormat,
    BoundOutlet,
    BoundStreamInfo,
    Liblsl,
    LslSample,
} from '../nodeLsl.types'
import LiblslImpl from './Liblsl'

export default class LslOutletImpl implements LslOutlet {
    public static Class?: LslOutletConstructor

    private options: LslOutletOptions
    private streamInfo!: BoundStreamInfo
    private outlet!: BoundOutlet
    private pushSampleByType!: (options: any) => void

    protected constructor(options: LslOutletOptions) {
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

        this.options = options

        this.validateOptions()
        this.createStreamInfo()
        this.appendChannelsToStreamInfo()
        this.createLslOutlet()
        this.setPushSampleType()
    }

    public static async Create(options: LslOutletOptions) {
        const { waitAfterConstructionMs = 10 } = options ?? {}
        const instance = new (this.Class ?? this)(options)
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

    private static async wait(waitMs: number) {
        return new Promise((resolve) => setTimeout(resolve, waitMs))
    }

    private createStreamInfo() {
        this.streamInfo = this.lsl.createStreamInfo({
            name: this.name,
            type: this.type,
            sampleRate: this.sampleRate,
            channelCount: this.channelNames.length,
            channelFormat: this.lookupChannelFormat(this.channelFormat),
            sourceId: this.sourceId,
        })
    }

    private appendChannelsToStreamInfo() {
        this.lsl.appendChannelsToStreamInfo({
            info: this.streamInfo,
            channels: this.channelNames.map((label: string) => ({
                label,
                unit: this.unit,
                type: this.type,
            })),
        })
    }

    private createLslOutlet() {
        this.outlet = this.lsl.createOutlet({
            info: this.streamInfo,
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

    private lookupChannelFormat(channelFormat: ChannelFormat) {
        return CHANNEL_FORMATS_MAP[channelFormat]
    }

    private get name() {
        return this.options.name
    }

    private get type() {
        return this.options.type
    }

    private get sourceId() {
        return this.options.sourceId
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

    private get unit() {
        return this.options.unit
    }

    private get lsl() {
        return LiblslImpl.getInstance()
    }
}

export interface LslOutlet {
    destroy(): void
    pushSample(sample: LslSample): void
}

export type LslOutletConstructor = new (options: LslOutletOptions) => LslOutlet

export interface LslOutletOptions {
    name: string
    type: string
    sampleRate: number
    channelNames: string[]
    channelFormat: ChannelFormat
    sourceId: string
    manufacturer: string
    unit: string
    chunkSize: number
    maxBuffered: number
    waitAfterConstructionMs?: number
}
