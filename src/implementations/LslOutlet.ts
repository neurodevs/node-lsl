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
    private streamInfo: BoundStreamInfo
    private outlet: BoundOutlet
    private pushSampleByType: (options: any) => void

    protected constructor(options: LslOutletOptions) {
        const { sampleRate, channelFormat } = assertOptions(options, [
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

        const { chunkSize, maxBuffered, channelNames, ...streamInfoOptions } =
            this.options as any

        const channelCount = channelNames.length

        assertValidChannelCount(channelCount)
        assertValidSampleRate(sampleRate)
        assertValidChannelFormat(channelFormat)
        assertValidChunkSize(chunkSize)
        assertValidMaxBuffered(maxBuffered)

        delete streamInfoOptions.manufacturer
        delete streamInfoOptions.unit

        this.streamInfo = this.lsl.createStreamInfo({
            ...streamInfoOptions,
            channelCount,
            channelFormat: this.lookupChannelFormat(channelFormat),
        })

        this.lsl.appendChannelsToStreamInfo({
            info: this.streamInfo,
            channels: channelNames.map((label: string) => ({
                label,
                unit: this.options.unit,
                type: this.options.type,
            })),
        })

        this.outlet = this.lsl.createOutlet({
            info: this.streamInfo,
            chunkSize: this.options.chunkSize,
            maxBuffered: this.options.maxBuffered,
        })

        const pushMethod = this.getPushMethod()
        this.pushSampleByType = this.lsl[pushMethod].bind(this.lsl)
    }

    public static Outlet(options: LslOutletOptions) {
        return new (this.Class ?? this)(options)
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
    channelNames: string[]
    sampleRate: number
    channelFormat: ChannelFormat
    sourceId: string
    manufacturer: string
    unit: string
    chunkSize: number
    maxBuffered: number
}
