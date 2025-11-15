import generateId from '@neurodevs/generate-id'

import { CHANNEL_FORMATS_MAP } from '../consts.js'
import { BoundStreamInfo, ChannelFormat } from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'

export default class LslStreamInfo implements StreamInfo {
    public static Class?: StreamInfoConstructor

    protected name: string
    protected type: string
    protected sourceId: string
    protected units: string
    protected streamInfo!: BoundStreamInfo
    private channelNames: string[]
    private channelFormat: ChannelFormat
    private sampleRateHz: number

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
        this.channelFormat = channelFormat
        this.sampleRateHz = sampleRateHz
        this.units = units

        this.createStreamInfo()
        this.appendChannelsToStreamInfo()
    }

    public static Create(options: StreamInfoOptions) {
        return new (this.Class ?? this)(options)
    }

    private createStreamInfo() {
        this.streamInfo = this.lsl.createStreamInfo({
            name: this.name,
            type: this.type,
            sourceId: this.sourceId,
            channelCount: this.channelCount,
            channelFormat: this.lslChannelFormat,
            sampleRateHz: this.sampleRateHz,
        })
    }

    private appendChannelsToStreamInfo() {
        this.lsl.appendChannelsToStreamInfo({
            info: this.streamInfo,
            channels: this.channelNames.map((label: string) => ({
                label,
                units: this.units,
                type: this.type,
            })),
        })
    }

    public get boundStreamInfo() {
        return this.streamInfo
    }

    private get channelCount() {
        return this.channelNames.length
    }

    private get lslChannelFormat() {
        return CHANNEL_FORMATS_MAP[this.channelFormat]
    }

    private get lsl() {
        return LiblslAdapter.getInstance()
    }

    private readonly defaultName = `lsl-stream-info-${generateId()}`
    private readonly defaultType = generateId()
    private readonly defaultSourceId = generateId()
    private readonly defaultUnits = 'N/A'
}

export interface StreamInfo {
    boundStreamInfo: BoundStreamInfo
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
