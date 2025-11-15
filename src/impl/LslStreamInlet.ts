import generateId from '@neurodevs/generate-id'

import { createPointer, DataType, JsExternal, unwrapPointer } from 'ffi-rs'
import { BoundInlet, ChannelFormat, Liblsl } from './LiblslAdapter.js'
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
    private maxBuffered: number
    private onData: (samples: Float32Array, timestamps: Float64Array) => void
    private timeoutMs?: number

    private pullDataMethod: () => {
        samples: Float32Array | undefined
        timestamps: Float64Array | undefined
    }

    private lsl: Liblsl

    protected inlet!: BoundInlet

    private dataBuffer!: Buffer<ArrayBuffer>
    private dataBufferPtr!: JsExternal

    private timestampBuffer!: Buffer<ArrayBuffer>
    private timestampBufferPtr!: JsExternal

    private errorCodeBuffer!: Buffer<ArrayBuffer>
    private errorCodeBufferPtr!: JsExternal

    private readonly defaultName = `lsl-inlet-${generateId()}`
    private readonly sixMinutesInSeconds = 360

    protected constructor(info: StreamInfo, options: StreamInletOptions) {
        const {
            name = this.defaultName,
            channelNames,
            chunkSize,
            maxBuffered,
            onData,
            timeoutMs,
        } = options ?? {}

        this.info = info
        this.name = name
        this.channelNames = channelNames
        this.channelCount = this.channelNames.length
        this.chunkSize = chunkSize
        this.maxBuffered = maxBuffered ?? this.sixMinutesInSeconds
        this.onData = onData
        this.timeoutMs = timeoutMs

        if (this.chunkSize === 1) {
            this.pullDataMethod = this.pullSample
        } else {
            this.pullDataMethod = this.pullChunk
        }

        this.lsl = this.getLiblslSingleton()

        this.createBoundInlet()
    }

    public static Create(options: StreamInletOptions) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { maxBuffered, chunkSize, onData, ...infoOptions } = options
        const info = this.LslStreamInfo(infoOptions)
        return new (this.Class ?? this)(info, options)
    }

    private createBoundInlet() {
        this.inlet = this.lsl.createInlet({
            info: this.info.boundStreamInfo,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
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
                samples: this.convertDataBufferToFloatArray(),
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
            timeout: this.timeoutMs ? this.timeoutMs / 1000 : 0,
            errcodePtr: this.errorCodeBufferPtr,
        })
    }

    private convertDataBufferToFloatArray() {
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
                samples: this.convertDataBufferToFloatArray(),
                timestamps: this.convertTimestampBufferToDoubleArray(),
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
            timeout: this.timeoutMs ? this.timeoutMs / 1000 : 0,
            errcodePtr: this.errorCodeBufferPtr,
        })
    }

    private convertTimestampBufferToDoubleArray() {
        return new Float64Array(
            this.timestampBuffer.buffer,
            this.timestampBuffer.byteOffset,
            this.chunkSize
        )
    }

    public stopPulling() {
        this.isRunning = false
    }

    public flushQueue() {
        this.lsl.flushInlet({ inlet: this.inlet })
    }

    public destroy() {
        this.lsl.destroyInlet({ inlet: this.inlet })
    }

    private getLiblslSingleton() {
        return LiblslAdapter.getInstance()
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
    isRunning: boolean
}

export type StreamInletConstructor = new (
    info: StreamInfo,
    options: StreamInletOptions
) => StreamInlet

export interface StreamInletOptions {
    channelNames: string[]
    channelFormat: ChannelFormat
    sampleRateHz: number
    chunkSize: number
    onData: (
        samples: Float32Array,
        timestamps: Float64Array
    ) => void | Promise<void>
    maxBuffered?: number
    timeoutMs?: number
    name?: string
    type?: string
    sourceId?: string
    manufacturer?: string
    units?: string
}
