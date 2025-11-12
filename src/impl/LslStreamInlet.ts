import generateId from '@neurodevs/generate-id'

import { BoundInlet, ChannelFormat } from '../types.js'
import LiblslAdapter from './LiblslAdapter.js'
import LslStreamInfo, {
    StreamInfo,
    StreamInfoOptions,
} from './LslStreamInfo.js'

export default class LslStreamInlet implements StreamInlet {
    public static Class?: StreamInletConstructor

    public isRunning = false

    protected name: string
    protected info: StreamInfo
    protected inlet!: BoundInlet
    private chunkSize: number
    private maxBuffered: number

    private readonly defaultName = `lsl-inlet-${generateId()}`

    protected constructor(info: StreamInfo, options: StreamInletOptions) {
        const {
            name = this.defaultName,
            chunkSize,
            maxBuffered,
        } = options ?? {}

        this.info = info
        this.chunkSize = chunkSize
        this.maxBuffered = maxBuffered
        this.name = name

        this.createStreamInlet()
    }

    public static Create(options: StreamInletOptions) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { maxBuffered, chunkSize, ...infoOptions } = options
        const info = this.LslStreamInfo(infoOptions)
        return new (this.Class ?? this)(info, options)
    }

    private createStreamInlet() {
        this.inlet = this.lsl.createInlet({
            info: this.info.boundStreamInfo,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
        })
    }

    public startPulling() {
        this.isRunning = true
    }

    public flushSamples() {
        this.lsl.flushInlet({ inlet: this.inlet })
    }

    public destroy() {
        this.lsl.destroyInlet({ inlet: this.inlet })
    }

    private get lsl() {
        return LiblslAdapter.getInstance()
    }

    private static LslStreamInfo(options: StreamInfoOptions) {
        return LslStreamInfo.Create(options)
    }
}

export interface StreamInlet {
    startPulling(): void
    flushSamples(): void
    destroy(): void
    isRunning: boolean
}

export type StreamInletConstructor = new (
    info: StreamInfo,
    options: StreamInletOptions
) => StreamInlet

export interface StreamInletOptions {
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
