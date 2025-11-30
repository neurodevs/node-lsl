import generateId from '@neurodevs/generate-id'
import { createPointer, DataType, JsExternal, unwrapPointer } from 'ffi-rs'

import handleError from '../handleError.js'
import { BoundInlet, ChannelFormat } from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'
import LslStreamInfo, {
    StreamInfo,
    StreamInfoOptions,
} from './LslStreamInfo.js'

export default class LslStreamInlet implements StreamInlet {
    public static Class?: StreamInletConstructor

    public isRunning = false

    protected info: StreamInfo
    protected name: string
    private channelNames: string[]
    private channelCount: number
    private chunkSize: number
    private maxBufferedMs: number
    private timeoutMs: number

    private onData: OnDataCallback

    private pullDataMethod: () => {
        samples: Float32Array | undefined
        timestamps: Float64Array | undefined
    }

    protected inlet!: BoundInlet

    private dataBuffer!: Buffer<ArrayBuffer>
    private dataBufferPtr!: JsExternal

    private timestampBuffer!: Buffer<ArrayBuffer>
    private timestampBufferPtr!: JsExternal

    private errorCodeBuffer!: Buffer<ArrayBuffer>
    private errorCodeBufferPtr!: JsExternal

    private readonly defaultName = `lsl-inlet-${generateId()}`
    private readonly sixMinutesInMs = 360 * 1000

    private lsl = LiblslAdapter.getInstance()

    protected constructor(
        info: StreamInfo,
        options: StreamInletOptions,
        onData: OnDataCallback
    ) {
        const {
            name = this.defaultName,
            channelNames,
            chunkSize,
            maxBufferedMs,
            timeoutMs,
        } = options ?? {}

        this.info = info
        this.name = name
        this.channelNames = channelNames
        this.channelCount = this.channelNames.length
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.sixMinutesInMs
        this.timeoutMs = timeoutMs ?? 0

        this.onData = onData

        if (this.chunkSize === 1) {
            this.pullDataMethod = this.pullSample
        } else {
            this.pullDataMethod = this.pullChunk
        }

        this.createBoundInlet()
    }

    public static Create(options: StreamInletOptions, onData: OnDataCallback) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { maxBufferedMs, chunkSize, ...infoOptions } = options
        const info = this.LslStreamInfo(infoOptions)
        return new (this.Class ?? this)(info, options, onData)
    }

    private createBoundInlet() {
        this.inlet = this.lsl.createInlet({
            info: this.boundStreamInfo,
            chunkSize: this.chunkSize,
            maxBufferedMs: this.maxBufferedMs / 1000,
        })
    }

    private get boundStreamInfo() {
        return this.info.boundStreamInfo
    }

    public startPulling() {
        this.isRunning = true

        this.createWriteableBuffers()
        this.createPointersToBuffers()

        void this.pullOnLoop()
    }

    private createWriteableBuffers() {
        this.createDataBuffer()
        this.createTimestampBuffer()
        this.createErrorCodeBuffer()
    }

    private createDataBuffer() {
        const bytesPerFloat = 4

        this.dataBuffer = Buffer.alloc(
            bytesPerFloat * this.chunkSize * this.channelCount
        )
    }

    private createTimestampBuffer() {
        const bytesPerDouble = 8
        this.timestampBuffer = Buffer.alloc(bytesPerDouble * this.chunkSize)
    }

    private createErrorCodeBuffer() {
        const bytesPerInt = 4
        this.errorCodeBuffer = Buffer.alloc(bytesPerInt)
    }

    private createPointersToBuffers() {
        this.createDataBufferPtr()
        this.createTimestampBufferPtr()
        this.createErrorCodeBufferPtr()
    }

    private createDataBufferPtr() {
        this.dataBufferPtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [this.dataBuffer],
            })
        )[0]
    }

    private createTimestampBufferPtr() {
        this.timestampBufferPtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [this.timestampBuffer],
            })
        )[0]
    }

    private createErrorCodeBufferPtr() {
        this.errorCodeBufferPtr = unwrapPointer(
            createPointer({
                paramsType: [DataType.U8Array],
                paramsValue: [this.errorCodeBuffer],
            })
        )[0]
    }

    private async pullOnLoop() {
        if (this.isRunning) {
            const { samples, timestamps } = this.pullDataMethod()
            this.handleErrorCodeIfPresent()

            if (samples && timestamps) {
                this.onData(samples, timestamps)
            }

            setImmediate(() => {
                void this.pullOnLoop()
            })
        }
    }

    private pullSample() {
        const timestamp = this.callPullSampleBinding()

        if (timestamp) {
            return {
                samples: this.createFloatArrayFromDataBuffer(),
                timestamps: new Float64Array([timestamp]),
            }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private callPullSampleBinding() {
        return this.lsl.pullSample({
            inlet: this.inlet,
            dataBufferPtr: this.dataBufferPtr,
            dataBufferElements: this.channelCount,
            timeout: this.timeoutMs / 1000,
            errcodePtr: this.errorCodeBufferPtr,
        })
    }

    private createFloatArrayFromDataBuffer() {
        return new Float32Array(
            this.dataBuffer.buffer,
            this.dataBuffer.byteOffset,
            this.chunkSize * this.channelCount
        )
    }

    private pullChunk() {
        const firstTimestamp = this.callPullChunkBinding()

        if (firstTimestamp) {
            return {
                samples: this.createFloatArrayFromDataBuffer(),
                timestamps: this.createDoubleArrayFromTimestampBuffer(),
            }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private callPullChunkBinding() {
        return this.lsl.pullChunk({
            inlet: this.inlet,
            dataBufferPtr: this.dataBufferPtr,
            timestampBufferPtr: this.timestampBufferPtr,
            dataBufferElements: this.chunkSize * this.channelCount,
            timestampBufferElements: this.chunkSize,
            timeout: this.timeoutMs / 1000,
            errcodePtr: this.errorCodeBufferPtr,
        })
    }

    private createDoubleArrayFromTimestampBuffer() {
        return new Float64Array(
            this.timestampBuffer.buffer,
            this.timestampBuffer.byteOffset,
            this.chunkSize
        )
    }

    private handleErrorCodeIfPresent() {
        handleError(this.errorCodeBuffer.readInt32LE())
    }

    public stopPulling() {
        this.isRunning = false
    }

    public flushQueue() {
        this.lsl.flushInlet({ inlet: this.inlet })
    }

    public destroy() {
        this.destroyBoundStreamInfo()
        this.destroyBoundInlet()
    }

    private destroyBoundStreamInfo() {
        this.lsl.destroyStreamInfo({ info: this.boundStreamInfo })
    }

    private destroyBoundInlet() {
        this.lsl.destroyInlet({ inlet: this.inlet })
    }

    private static LslStreamInfo(options: StreamInfoOptions) {
        return LslStreamInfo.Create(options)
    }
}

export interface StreamInlet {
    startPulling(): void
    stopPulling(): void
    flushQueue(): void
    destroy(): void
    readonly isRunning: boolean
}

export type StreamInletConstructor = new (
    info: StreamInfo,
    options: StreamInletOptions,
    onData: OnDataCallback
) => StreamInlet

export interface StreamInletOptions {
    channelNames: string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    chunkSize: number
    maxBufferedMs?: number
    timeoutMs?: number
    name?: string
    type?: string
    sourceId?: string
    manufacturer?: string
    units?: string
}

export type OnDataCallback = (
    samples: Float32Array,
    timestamps: Float64Array
) => void
