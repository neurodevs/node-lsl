import { assertOptions } from '@sprucelabs/schema'
import { generateId } from '@sprucelabs/test-utils'
import { CHANNEL_FORMATS_MAP } from '../consts'
import { BoundStreamInfo, ChannelFormat } from '../nodeLsl.types'
import LiblslImpl from './Liblsl'

export default class LslInlet implements StreamInlet {
    public static Class?: LslInletConstructor

    protected name: string
    protected type: string
    protected sourceId: string
    protected manufacturer: string
    protected units: string
    protected streamInfo!: BoundStreamInfo
    private sampleRate: number
    private channelNames: string[]
    private channelFormat: ChannelFormat
    private chunkSize: number
    private maxBuffered: number

    protected constructor(options: LslInletOptions) {
        const {
            sampleRate,
            channelNames,
            channelFormat,
            chunkSize,
            maxBuffered,
            name = this.defaultName,
            type = this.defaultType,
            sourceId = this.defaultSourceId,
            manufacturer = this.defaultManufacturer,
            units = this.defaultUnits,
        } = options ?? {}

        this.sampleRate = sampleRate
        this.channelNames = channelNames
        this.channelFormat = channelFormat
        this.chunkSize = chunkSize
        this.maxBuffered = maxBuffered
        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.manufacturer = manufacturer
        this.units = units

        this.createStreamInfo()
        this.appendChannelsToStreamInfo()
        this.createLslInlet()
    }

    public static Create(options: LslInletOptions) {
        assertOptions(options, ['sampleRate', 'channelNames', 'channelFormat'])
        return new (this.Class ?? this)(options)
    }

    private createStreamInfo() {
        this.streamInfo = this.lsl.createStreamInfo({
            name: this.name,
            type: this.type,
            channelCount: this.channelCount,
            sampleRate: this.sampleRate,
            channelFormat: this.lslChannelFormat,
            sourceId: this.sourceId,
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

    private createLslInlet() {
        this.lsl.createInlet({
            info: this.streamInfo,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
        })
    }

    private get lslChannelFormat() {
        return CHANNEL_FORMATS_MAP[this.channelFormat]
    }

    private get channelCount() {
        return this.channelNames.length
    }

    private get lsl() {
        return LiblslImpl.getInstance()
    }

    private readonly defaultName = `lsl-inlet-${generateId()}`
    private readonly defaultType = generateId()
    private readonly defaultSourceId = generateId()
    private readonly defaultManufacturer = 'N/A'
    private readonly defaultUnits = 'N/A'
}

export interface StreamInlet {}

export type LslInletConstructor = new (options: LslInletOptions) => StreamInlet

export interface LslInletOptions {
    sampleRate: number
    channelNames: string[]
    channelFormat: ChannelFormat
    chunkSize: number
    maxBuffered: number
    name?: string
    type?: string
    sourceId?: string
    manufacturer?: string
    units?: string
}
