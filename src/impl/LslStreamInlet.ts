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
    private channelNames: string[]
    private chunkSize: number
    private maxBuffered: number
    private onChunk?: (samples: Float32Array, timestamps: Float64Array) => void

    private dataBuffer!: Buffer<ArrayBuffer>
    private timestampBuffer!: Buffer<ArrayBuffer>

    private readonly defaultName = `lsl-inlet-${generateId()}`

    protected constructor(info: StreamInfo, options: StreamInletOptions) {
        const {
            channelNames,
            chunkSize,
            maxBuffered,
            onChunk,
            name = this.defaultName,
        } = options ?? {}

        this.info = info
        this.channelNames = channelNames
        this.chunkSize = chunkSize
        this.maxBuffered = maxBuffered
        this.onChunk = onChunk
        this.name = name

        this.createStreamInlet()
    }

    public static Create(options: StreamInletOptions) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { maxBuffered, chunkSize, onChunk, ...infoOptions } = options
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

        this.dataBuffer = this.createDataBuffer()
        this.timestampBuffer = this.createTimestampBuffer()

        void this.pullOnLoop()
    }

    private createDataBuffer() {
        const bytesPerFloat = 4
        return Buffer.alloc(bytesPerFloat * this.chunkSize * this.channelCount)
    }

    private createTimestampBuffer() {
        const bytesPerDouble = 8
        return Buffer.alloc(bytesPerDouble * this.chunkSize)
    }

    private async pullOnLoop() {
        if (!this.isRunning || !this.onChunk) {
            return
        }

        const { samples, timestamps } = this.pullChunk()

        if (samples && timestamps) {
            this.onChunk(samples, timestamps)
        }

        setImmediate(() => {
            void this.pullOnLoop()
        })
    }

    private pullChunk() {
        const firstTimestamp = this.lsl.pullChunk({
            inlet: this.inlet,
            dataBuffer: this.dataBuffer,
            timestampBuffer: this.timestampBuffer,
            dataBufferElements: this.chunkSize * this.channelCount,
            timestampBufferElements: this.chunkSize,
            timeout: 1.0,
            errcode: 0,
        })

        if (firstTimestamp) {
            const samples = new Float32Array(
                this.dataBuffer.buffer,
                this.dataBuffer.byteOffset,
                this.chunkSize * this.channelCount
            )

            const timestamps = new Float64Array(
                this.timestampBuffer.buffer,
                this.timestampBuffer.byteOffset,
                this.chunkSize
            )

            return { samples, timestamps }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private get channelCount() {
        return this.channelNames.length
    }

    public stopPulling() {
        this.isRunning = false
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
    stopPulling(): void
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
    onChunk?: (samples: Float32Array, timestamps: Float64Array) => void
    name?: string
    type?: string
    sourceId?: string
    manufacturer?: string
    units?: string
}
