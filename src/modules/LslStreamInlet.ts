import { generateId } from '@sprucelabs/test-utils'
import { ChannelFormat } from '../types'
import LiblslAdapter from './LiblslAdapter'
import LslStreamInfo, { StreamInfo, StreamInfoOptions } from './LslStreamInfo'

export default class LslStreamInlet implements LslInlet {
    public static Class?: LslInletConstructor

    protected name: string
    protected info: StreamInfo
    private chunkSize: number
    private maxBuffered: number

    protected constructor(info: StreamInfo, options: LslInletOptions) {
        const {
            name = this.defaultName,
            chunkSize,
            maxBuffered,
        } = options ?? {}

        this.info = info
        this.chunkSize = chunkSize
        this.maxBuffered = maxBuffered
        this.name = name

        this.createLslInlet()
    }

    public static Create(options: LslInletOptions) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { maxBuffered, chunkSize, ...infoOptions } = options
        const info = this.LslStreamInfo(infoOptions)
        return new (this.Class ?? this)(info, options)
    }

    private createLslInlet() {
        this.lsl.createInlet({
            info: this.boundStreamInfo,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
        })
    }

    private get boundStreamInfo() {
        return this.info.boundStreamInfo
    }

    private get lsl() {
        return LiblslAdapter.getInstance()
    }

    private readonly defaultName = `lsl-inlet-${generateId()}`

    private static LslStreamInfo(options: StreamInfoOptions) {
        return LslStreamInfo.Create(options)
    }
}

export interface LslInlet {}

export type LslInletConstructor = new (
    info: StreamInfo,
    options: LslInletOptions
) => LslInlet

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
