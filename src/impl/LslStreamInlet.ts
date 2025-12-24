import { createPointer, DataType, JsExternal, unwrapPointer } from 'ffi-rs'

import handleError from '../handleError.js'
import { BoundInlet } from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'
import { StreamInfo } from './LslStreamInfo.js'

export default class LslStreamInlet implements StreamInlet {
    public static Class?: StreamInletConstructor

    public isRunning = false

    protected info: StreamInfo
    private channelCount: number
    private chunkSize: number
    private maxBufferedMs: number
    private timeoutMs: number
    private onData: OnDataCallback

    protected inlet!: BoundInlet

    private pullDataMethod!: () => {
        samples: Float32Array | undefined
        timestamps: Float64Array | undefined
    }

    private dataBuffer!: Buffer<ArrayBuffer>
    private dataBufferPtr!: JsExternal

    private timestampBuffer!: Buffer<ArrayBuffer>
    private timestampBufferPtr!: JsExternal

    private errorCodeBuffer!: Buffer<ArrayBuffer>
    private errorCodeBufferPtr!: JsExternal

    private readonly sixMinutesInMs = 360 * 1000

    private lsl = LiblslAdapter.getInstance()

    protected constructor(
        info: StreamInfo,
        options: StreamInletConstructorOptions,
        onData: OnDataCallback
    ) {
        const { chunkSize, maxBufferedMs, timeoutMs } = options ?? {}

        this.info = info
        this.channelCount = this.info.channelCount
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.sixMinutesInMs
        this.timeoutMs = timeoutMs ?? 0
        this.onData = onData

        this.setPullDataMethod()
        this.createBoundInlet()
    }

    public static async Create(
        options: StreamInletOptions,
        onData: OnDataCallback
    ) {
        const { info } = options
        return new (this.Class ?? this)(info, options, onData)
    }

    private setPullDataMethod() {
        if (this.chunkSize === 1) {
            this.pullDataMethod = this.pullSample
        } else {
            this.pullDataMethod = this.pullChunk
        }
    }

    private createBoundInlet() {
        this.inlet = this.lsl.createInlet({
            info: this.info.boundInfo,
            maxBufferedMs: this.maxBufferedMs,
        })
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
        this.dataBuffer = Buffer.alloc(
            this.bytesPerFloat * this.chunkSize * this.channelCount
        )
    }

    private readonly bytesPerFloat = 4

    private createTimestampBuffer() {
        this.timestampBuffer = Buffer.alloc(
            this.bytesPerDouble * this.chunkSize
        )
    }

    private readonly bytesPerDouble = 8

    private createErrorCodeBuffer() {
        this.errorCodeBuffer = Buffer.alloc(this.bytesPerInt)
    }

    private readonly bytesPerInt = 4

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
            dataBufferElements: this.chunkSize * this.channelCount,
            timestampBufferPtr: this.timestampBufferPtr,
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
        if (this.isRunning) {
            this.stopPulling()
        }
        this.destroyBoundInlet()
    }

    private destroyBoundInlet() {
        this.lsl.destroyInlet({ inlet: this.inlet })
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
    options: StreamInletConstructorOptions,
    onData: OnDataCallback
) => StreamInlet

export interface StreamInletOptions {
    info: StreamInfo
    chunkSize: number
    maxBufferedMs?: number
    timeoutMs?: number
}

export type StreamInletConstructorOptions = Omit<StreamInletOptions, 'info'>

export type OnDataCallback = (
    samples: Float32Array,
    timestamps: Float64Array
) => void
