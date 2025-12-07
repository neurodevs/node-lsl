import generateId from '@neurodevs/generate-id'

import { CHANNEL_FORMATS_MAP } from '../consts.js'
import { BoundStreamInfo, ChannelFormat } from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'

export default class LslStreamInfo implements StreamInfo {
    public static Class?: StreamInfoConstructor

    private static instanceCache = new Map<BoundStreamInfo, StreamInfo>()

    public readonly name: string
    public readonly type: string
    public readonly sourceId: string
    public readonly channelNames: string[]
    public readonly channelCount: number
    public readonly channelFormat: ChannelFormat
    public readonly sampleRateHz: number
    public readonly units: string
    public readonly boundStreamInfo: BoundStreamInfo

    private lsl = LiblslAdapter.getInstance()

    protected constructor(options: StreamInfoOptions) {
        const {
            name = `lsl-stream-info-${generateId()}`,
            type = generateId(),
            sourceId = generateId(),
            channelNames,
            channelFormat,
            sampleRateHz,
            units = 'N/A',
            boundStreamInfo,
        } = options

        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.channelNames = channelNames
        this.channelCount = channelNames.length
        this.channelFormat = channelFormat
        this.sampleRateHz = sampleRateHz
        this.units = units

        if (!boundStreamInfo) {
            this.boundStreamInfo = this.createStreamInfo()
            this.appendChannelsToStreamInfo()
        } else {
            this.boundStreamInfo = boundStreamInfo
        }
    }

    public static Create(options: StreamInfoOptions) {
        const instance = new (this.Class ?? this)(options)

        const { boundStreamInfo: handle } = instance
        this.instanceCache.set(handle, instance)

        return instance
    }

    public static From(handle: BoundStreamInfo) {
        return this.instanceCache.get(handle)!
    }

    private createStreamInfo() {
        return this.lsl.createStreamInfo({
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
            info: this.boundStreamInfo,
            channels: this.channelNames.map((label: string) => ({
                label,
                units: this.units,
                type: this.type,
            })),
        })
    }

    public destroy() {
        this.lsl.destroyStreamInfo({ info: this.boundStreamInfo })
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
    boundStreamInfo?: BoundStreamInfo
}
