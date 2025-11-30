import generateId from '@neurodevs/generate-id'

import { CHANNEL_FORMATS_MAP } from '../consts.js'
import { BoundStreamInfo, ChannelFormat } from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'

export default class LslStreamInfo implements StreamInfo {
    public static Class?: StreamInfoConstructor

    private static instanceCache: Record<string, StreamInfo> = {}

    public readonly name: string
    public readonly type: string
    public readonly sourceId: string
    public readonly channelNames: string[]
    public readonly channelCount: number
    public readonly channelFormat: ChannelFormat
    public readonly sampleRateHz: number
    public readonly units: string

    protected boundInfo!: BoundStreamInfo

    private readonly defaultName = `lsl-stream-info-${generateId()}`
    private readonly defaultType = generateId()
    private readonly defaultSourceId = generateId()
    private readonly defaultUnits = 'N/A'

    private lsl = LiblslAdapter.getInstance()

    protected constructor(options: StreamInfoOptions) {
        const {
            name = this.defaultName,
            type = this.defaultType,
            sourceId = this.defaultSourceId,
            channelNames,
            channelFormat,
            sampleRateHz,
            units = this.defaultUnits,
        } = options

        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.channelNames = channelNames
        this.channelCount = channelNames.length
        this.channelFormat = channelFormat
        this.sampleRateHz = sampleRateHz
        this.units = units

        this.createStreamInfo()
        this.appendChannelsToStreamInfo()
    }

    public static Create(options: StreamInfoOptions) {
        const key = JSON.stringify(options)
        let instance = this.instanceCache[key]

        if (instance === undefined) {
            instance = new (this.Class ?? this)(options)
            this.instanceCache[key] = instance
        }
        return instance
    }

    private createStreamInfo() {
        this.boundInfo = this.lsl.createStreamInfo({
            name: this.name,
            type: this.type,
            sourceId: this.sourceId,
            channelCount: this.channelCount,
            channelFormat: this.lslChannelFormat,
            sampleRateHz: this.sampleRateHz,
        })
    }

    private get lslChannelFormat() {
        return CHANNEL_FORMATS_MAP[this.channelFormat]
    }

    private appendChannelsToStreamInfo() {
        this.lsl.appendChannelsToStreamInfo({
            info: this.boundInfo,
            channels: this.channelNames.map((label: string) => ({
                label,
                units: this.units,
                type: this.type,
            })),
        })
    }

    public destroy() {
        this.lsl.destroyStreamInfo({ info: this.boundInfo })
    }

    public get boundStreamInfo() {
        return this.boundInfo
    }
}

export interface StreamInfo {
    destroy(): void
    readonly name: string
    readonly type: string
    readonly sourceId: string
    readonly units: string
    readonly channelNames: string[]
    readonly channelCount: number
    readonly channelFormat: ChannelFormat
    readonly sampleRateHz: number
    readonly boundStreamInfo: BoundStreamInfo
}

type StreamInfoConstructor = new (options: StreamInfoOptions) => StreamInfo

export interface StreamInfoOptions {
    channelNames: string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    name?: string
    type?: string
    sourceId?: string
    units?: string
}
