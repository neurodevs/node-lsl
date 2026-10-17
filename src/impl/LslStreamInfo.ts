import generateId from '@neurodevs/generate-id'
import {
    ChannelFormat,
    InfoHandle,
    LiblslAdapter,
    CHANNEL_FORMATS_MAP,
} from '@neurodevs/ndx-native'

export default class LslStreamInfo implements LslInfo {
    public static Class?: LslInfoConstructor

    public readonly name: string
    public readonly type: string
    public readonly sourceId: string
    public readonly channelNames: readonly string[]
    public readonly channelCount: number
    public readonly channelFormat: ChannelFormat
    public readonly sampleRateHz: number
    public readonly units: string
    public readonly description: StreamDescription

    public readonly infoHandle: InfoHandle

    private lsl = LiblslAdapter.getInstance()

    protected constructor(options: LslInfoOptions) {
        const {
            name = `lsl-stream-info-${generateId()}`,
            type = generateId(),
            sourceId = generateId(),
            channelNames,
            channelFormat,
            sampleRateHz,
            units = 'N/A',
            description = {},
        } = options

        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.channelNames = channelNames
        this.channelCount = channelNames.length
        this.channelFormat = channelFormat
        this.sampleRateHz = sampleRateHz
        this.units = units
        this.description = description

        this.infoHandle = this.createStreamInfo()
        this.appendChannelsToStreamInfo()
        this.appendDescriptionToStreamInfo()
    }

    public static Create(options: LslInfoOptions) {
        return new (this.Class ?? this)(options)
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

    private appendDescriptionToStreamInfo() {
        if (Object.keys(this.description).length > 0) {
            this.lsl.appendDescriptionToStreamInfo({
                infoHandle: this.infoHandle,
                fields: this.description,
            })
        }
    }

    public destroy() {
        this.lsl.destroyStreamInfo({ infoHandle: this.infoHandle })
    }
}

export interface LslInfo {
    destroy(): void
    readonly name: string
    readonly type: string
    readonly sourceId: string
    readonly description: StreamDescription
    readonly units: string
    readonly channelNames: readonly string[]
    readonly channelCount: number
    readonly channelFormat: ChannelFormat
    readonly sampleRateHz: number
    readonly infoHandle: InfoHandle
}

export type LslInfoConstructor = new (options: LslInfoOptions) => LslInfo

export interface LslInfoOptions {
    channelNames: readonly string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    name?: string
    type?: string
    sourceId?: string
    description?: StreamDescription
    units?: string
}

export type StreamDescription = Readonly<Record<string, string>>
