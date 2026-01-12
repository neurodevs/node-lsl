import generateId from '@neurodevs/generate-id'

import { CHANNEL_FORMATS_MAP } from '../consts.js'
import { InfoHandle, ChannelFormat } from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'

export default class LslStreamInfo implements StreamInfo {
    public static Class?: StreamInfoConstructor

    private static instanceCache = new Map<InfoHandle, StreamInfo>()

    public readonly name: string
    public readonly type: string
    public readonly sourceId: string
    public readonly channelNames: string[]
    public readonly channelCount: number
    public readonly channelFormat: ChannelFormat
    public readonly sampleRateHz: number
    public readonly units: string
    public readonly infoHandle: InfoHandle

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
            infoHandle,
        } = options

        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.channelNames = channelNames
        this.channelCount = channelNames.length
        this.channelFormat = channelFormat
        this.sampleRateHz = sampleRateHz
        this.units = units

        if (!infoHandle) {
            this.infoHandle = this.createStreamInfo()
            this.appendChannelsToStreamInfo()
        } else {
            this.infoHandle = infoHandle
        }
    }

    public static Create(options: StreamInfoOptions) {
        const instance = new (this.Class ?? this)(options)

        const { infoHandle } = instance
        this.instanceCache.set(infoHandle, instance)

        return instance
    }

    public static From(infoHandle: InfoHandle) {
        return this.instanceCache.get(infoHandle)!
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
            infoHandle: this.infoHandle,
            channels: this.channelNames.map((label: string) => ({
                label,
                units: this.units,
                type: this.type,
            })),
        })
    }

    public destroy() {
        this.lsl.destroyStreamInfo({ infoHandle: this.infoHandle })
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
    readonly infoHandle: InfoHandle
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
    infoHandle?: InfoHandle
}
