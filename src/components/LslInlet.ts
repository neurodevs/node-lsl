import { assertOptions } from '@sprucelabs/schema'
import { generateId } from '@sprucelabs/test-utils'
import { BoundStreamInfo, ChannelFormat } from '../nodeLsl.types'
import LiblslImpl from './Liblsl'
import LslStreamInfo, { StreamInfo, StreamInfoOptions } from './LslStreamInfo'

export default class LslInlet implements StreamInlet {
    public static Class?: LslInletConstructor

    protected name: string
    protected type: string
    protected sourceId: string
    protected manufacturer: string
    protected units: string
    protected streamInfo: BoundStreamInfo
    private chunkSize: number
    private maxBuffered: number

    protected constructor(info: StreamInfo, options: LslInletOptions) {
        const {
            chunkSize,
            maxBuffered,
            name = this.defaultName,
            type = this.defaultType,
            sourceId = this.defaultSourceId,
            manufacturer = this.defaultManufacturer,
            units = this.defaultUnits,
        } = options ?? {}

        this.streamInfo = info
        this.chunkSize = chunkSize
        this.maxBuffered = maxBuffered
        this.name = name
        this.type = type
        this.sourceId = sourceId
        this.manufacturer = manufacturer
        this.units = units

        this.createLslInlet()
    }

    public static Create(options: LslInletOptions) {
        assertOptions(options, [
            'channelNames',
            'channelFormat',
            'sampleRate',
            'chunkSize',
            'maxBuffered',
        ])
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { maxBuffered, chunkSize, ...streamInfoOptions } = options
        const info = this.LslStreamInfo(streamInfoOptions)
        return new (this.Class ?? this)(info, options)
    }

    private createLslInlet() {
        this.lsl.createInlet({
            info: this.streamInfo,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
        })
    }

    private get lsl() {
        return LiblslImpl.getInstance()
    }

    private readonly defaultName = `lsl-inlet-${generateId()}`
    private readonly defaultType = generateId()
    private readonly defaultSourceId = generateId()
    private readonly defaultManufacturer = 'N/A'
    private readonly defaultUnits = 'N/A'

    private static LslStreamInfo(options: StreamInfoOptions) {
        return LslStreamInfo.Create(options)
    }
}

export interface StreamInlet {}

export type LslInletConstructor = new (
    info: StreamInfo,
    options: LslInletOptions
) => StreamInlet

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
