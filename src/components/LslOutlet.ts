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
            'channelNames',
            'sampleRate',
            'channelFormat',
            'sourceId',
            'manufacturer',
            'unit',
            'chunkSize',
            'maxBuffered',
        ])

        this.options = options

        this.handleOptions()
        this.createStreamInfo()
        this.appendChannelsToStreamInfo()
        this.createLslOutlet()
        this.setPushSampleType()
    }

    private handleOptions() {
        const {
            sampleRate,
            channelNames,
            channelFormat,
            chunkSize,
            maxBuffered,
        } = this.options as any

        const channelCount = channelNames.length

        assertValidChannelCount(channelCount)
        assertValidSampleRate(sampleRate)
        assertValidChannelFormat(channelFormat)
        assertValidChunkSize(chunkSize)
        assertValidMaxBuffered(maxBuffered)
    }

    public static async Create(options: LslOutletOptions) {
        const { waitAfterConstructionMs = 10 } = options ?? {}
        const instance = new (this.Class ?? this)(options)
        await this.wait(waitAfterConstructionMs)
        return instance
    }

    private static async wait(waitMs: number) {
        return new Promise((resolve) => setTimeout(resolve, waitMs))
    }

    private createStreamInfo() {
        this.streamInfo = this.lsl.createStreamInfo({
            name: this.options.name,
            type: this.options.type,
            sampleRate: this.options.sampleRate,
            channelCount: this.options.channelNames.length,
            channelFormat: this.lookupChannelFormat(this.options.channelFormat),
            sourceId: this.options.sourceId,
        })
    }

    private appendChannelsToStreamInfo() {
        this.lsl.appendChannelsToStreamInfo({
            info: this.streamInfo,
            channels: this.options.channelNames.map((label: string) => ({
                label,
                unit: this.options.unit,
                type: this.options.type,
            })),
        })
    }

    private createLslOutlet() {
        this.outlet = this.lsl.createOutlet({
            info: this.streamInfo,
            chunkSize: this.options.chunkSize,
            maxBuffered: this.options.maxBuffered,
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
        const channelFormat = this.options.channelFormat

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
