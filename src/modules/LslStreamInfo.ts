import { generateId } from '@sprucelabs/test-utils'
import { CHANNEL_FORMATS_MAP } from '../consts'
import { BoundStreamInfo, ChannelFormat } from '../types'
import LiblslAdapter from './LiblslAdapter'

export default class LslStreamInfo implements StreamInfo {
    public static Class?: StreamInfoConstructor

    protected name: string
    protected type: string
    protected sourceId: string
    protected units: string
    protected streamInfo!: BoundStreamInfo
    private channelNames: string[]
    private channelFormat: ChannelFormat
    private sampleRate: number

    protected constructor(options: StreamInfoOptions) {
        const {
            channelNames,
            channelFormat,
            sampleRate,
            name = this.defaultName,
            type = this.defaultType,
            sourceId = this.defaultSourceId,
            units = this.defaultUnits,
        } = options

        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.channelNames = channelNames
        this.channelFormat = channelFormat
        this.units = units
        this.sampleRate = sampleRate

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
            sampleRate: this.sampleRate,
        })
    }

    private appendChannelsToStreamInfo() {
        this.lsl.appendChannelsToStreamInfo({
            info: this.streamInfo,
            channels: this.channelNames.map((label: string) => ({
                label,
                unit: this.units,
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
    sampleRate: number
    name?: string
    type?: string
    sourceId?: string
    units?: string
}
