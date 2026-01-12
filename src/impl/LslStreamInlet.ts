import {
    createPointer,
    DataType,
    freePointer,
    JsExternal,
    PointerType,
    unwrapPointer,
} from 'ffi-rs'

import handleError from '../handleError.js'
import { InletHandle } from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'
import { StreamInfo } from './LslStreamInfo.js'

export default class LslStreamInlet implements StreamInlet {
    public static Class?: StreamInletConstructor
    public static freePointer = freePointer
    public static waitAfterOpenStreamMs = 100

    public isRunning = false

    protected info: StreamInfo
    private channelCount: number
    private chunkSize: number
    private maxBufferedMs: number
    private pullTimeoutMs: number
    private openStreamTimeoutMs: number
    private waitAfterOpenStreamMs: number
    private waitBetweenPullsMs: number
    private flushQueueOnStop: boolean
    private onData: OnDataCallback

    private readonly sixMinutesInMs = 360 * 1000
    private readonly aboutOneYearInMs = 32000000 * 1000

    protected inletHandle!: InletHandle

    private pullDataMethod!: () => {
        samples: Float32Array | undefined
        timestamps: Float64Array | undefined
    }

    private dataBufferPtrWrapped!: JsExternal[]
    private dataBufferPtr!: JsExternal
    private dataBuffer!: Buffer<ArrayBuffer>

    private timestampBufferPtrWrapped!: JsExternal[]
    private timestampBufferPtr!: JsExternal
    private timestampBuffer!: Buffer<ArrayBuffer>

    private pullDataErrorBufferPtrWrapped!: JsExternal[]
    private pullDataErrorBufferPtr!: JsExternal
    private pullDataErrorBuffer!: Buffer<ArrayBuffer>

    private openStreamErrorBufferPtrWrapped!: JsExternal[]
    private openStreamErrorBufferPtr!: JsExternal
    private openStreamErrorBuffer!: Buffer<ArrayBuffer>

    protected loop!: Promise<void>

    private lsl = LiblslAdapter.getInstance()

    protected constructor(
        info: StreamInfo,
        options: StreamInletConstructorOptions,
        onData: OnDataCallback
    ) {
        const {
            chunkSize,
            maxBufferedMs,
            pullTimeoutMs,
            openStreamTimeoutMs,
            waitAfterOpenStreamMs: waitAfterOpenMs,
            waitBetweenPullsMs,
            flushQueueOnStop,
        } = options ?? {}

        this.info = info
        this.channelCount = this.info.channelCount
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.sixMinutesInMs
        this.pullTimeoutMs = pullTimeoutMs ?? 0
        this.openStreamTimeoutMs = openStreamTimeoutMs ?? this.aboutOneYearInMs
        this.waitAfterOpenStreamMs = waitAfterOpenMs ?? this.waitAfterOpenMs
        this.waitBetweenPullsMs = waitBetweenPullsMs ?? 1
        this.flushQueueOnStop = flushQueueOnStop ?? true
        this.onData = onData

        this.setPullDataMethod()
        this.createInletHandle()
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

    private createInletHandle() {
        this.inletHandle = this.lsl.createInlet({
            infoHandle: this.info.infoHandle,
            maxBufferedMs: this.maxBufferedMs,
        })
    }

    public async startPulling() {
        if (!this.isRunning) {
            this.isRunning = true

            await this.openLslStream()

            this.createWriteableBuffers()
            this.createPointersToBuffers()

            this.loop = this.pullOnLoop()
        } else {
            console.warn('Cannot start pulling: inlet is already running!')
        }
    }

    private async openLslStream() {
        this.createOpenStreamErrorBuffer()

        await this.lsl.openStream({
            inletHandle: this.inletHandle,
            timeoutMs: this.openStreamTimeoutMs,
            errcodePtr: this.openStreamErrorBufferPtr,
        })

        await this.waitToAllowSetup()
    }

    private createOpenStreamErrorBuffer() {
        this.openStreamErrorBuffer = Buffer.alloc(this.bytesPerInt)

        this.openStreamErrorBufferPtrWrapped = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.openStreamErrorBuffer],
        })

        this.openStreamErrorBufferPtr = unwrapPointer(
            this.openStreamErrorBufferPtrWrapped
        )[0]
    }

    private async waitToAllowSetup() {
        await new Promise((resolve) =>
            setTimeout(resolve, this.waitAfterOpenStreamMs)
        )
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
        this.pullDataErrorBuffer = Buffer.alloc(this.bytesPerInt)
    }

    private readonly bytesPerInt = 4

    private createPointersToBuffers() {
        this.createDataBufferPtr()
        this.createTimestampBufferPtr()
        this.createErrorCodeBufferPtr()
    }

    private createDataBufferPtr() {
        this.dataBufferPtrWrapped = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.dataBuffer],
        })

        this.dataBufferPtr = unwrapPointer(this.dataBufferPtrWrapped)[0]
    }

    private createTimestampBufferPtr() {
        this.timestampBufferPtrWrapped = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.timestampBuffer],
        })

        this.timestampBufferPtr = unwrapPointer(
            this.timestampBufferPtrWrapped
        )[0]
    }

    private createErrorCodeBufferPtr() {
        this.pullDataErrorBufferPtrWrapped = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.pullDataErrorBuffer],
        })

        this.pullDataErrorBufferPtr = unwrapPointer(
            this.pullDataErrorBufferPtrWrapped
        )[0]
    }

    private async pullOnLoop() {
        while (this.isRunning) {
            this.pullDataOnce()
            await this.waitBetweenPulls()
        }
    }

    private pullDataOnce() {
        const { samples, timestamps } = this.pullDataMethod()
        this.handleErrorCodeIfPresent()

        if (samples && timestamps) {
            this.onData(samples, timestamps)
        }
    }

    private handleErrorCodeIfPresent() {
        const errorCode = this.pullDataErrorBuffer.readInt32LE()
        handleError(errorCode)
    }

    private async waitBetweenPulls() {
        await new Promise((resolve) =>
            setTimeout(resolve, this.waitBetweenPullsMs)
        )
    }

    private pullSample() {
        const timestamp = this.callPullSampleBinding()

        if (timestamp > 0) {
            return {
                samples: this.createFloatArrayFromDataBuffer(),
                timestamps: new Float64Array([timestamp]),
            }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private callPullSampleBinding() {
        return this.lsl.pullSample({
            inletHandle: this.inletHandle,
            dataBufferPtr: this.dataBufferPtr,
            dataBufferElements: this.channelCount,
            timeout: this.pullTimeoutMs / 1000,
            errcodePtr: this.pullDataErrorBufferPtr,
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

        if (firstTimestamp > 0) {
            return {
                samples: this.createFloatArrayFromDataBuffer(),
                timestamps: this.createDoubleArrayFromTimestampBuffer(),
            }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private callPullChunkBinding() {
        return this.lsl.pullChunk({
            inletHandle: this.inletHandle,
            dataBufferPtr: this.dataBufferPtr,
            dataBufferElements: this.chunkSize * this.channelCount,
            timestampBufferPtr: this.timestampBufferPtr,
            timestampBufferElements: this.chunkSize,
            timeout: this.pullTimeoutMs / 1000,
            errcodePtr: this.pullDataErrorBufferPtr,
        })
    }

    private createDoubleArrayFromTimestampBuffer() {
        return new Float64Array(
            this.timestampBuffer.buffer,
            this.timestampBuffer.byteOffset,
            this.chunkSize
        )
    }

    public stopPulling() {
        this.isRunning = false
        this.closeLslStream()

        if (this.flushQueueOnStop) {
            this.flushQueue()
        }
    }

    private closeLslStream() {
        this.lsl.closeStream({ inletHandle: this.inletHandle })
    }

    public flushQueue() {
        this.lsl.flushInlet({ inletHandle: this.inletHandle })
    }

    public destroy() {
        if (this.isRunning) {
            this.stopPulling()
        }
        this.destroyInletHandle()
        this.freeAllPointers()
    }

    private destroyInletHandle() {
        this.lsl.destroyInlet({ inletHandle: this.inletHandle })
    }

    private freeAllPointers() {
        this.freePointer({
            paramsType: [
                DataType.U8Array,
                DataType.U8Array,
                DataType.U8Array,
                DataType.U8Array,
            ],
            paramsValue: [
                this.openStreamErrorBufferPtr,
                this.dataBufferPtr,
                this.timestampBufferPtr,
                this.pullDataErrorBufferPtr,
            ],
            pointerType: PointerType.CPointer,
        })
    }

    private get waitAfterOpenMs() {
        return LslStreamInlet.waitAfterOpenStreamMs
    }

    private get freePointer() {
        return LslStreamInlet.freePointer
    }
}

export interface StreamInlet {
    startPulling(): Promise<void>
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
    pullTimeoutMs?: number
    openStreamTimeoutMs?: number
    waitAfterOpenStreamMs?: number
    waitBetweenPullsMs?: number
    flushQueueOnStop?: boolean
}

export type StreamInletConstructorOptions = Omit<StreamInletOptions, 'info'>

export type OnDataCallback = (
    samples: Float32Array,
    timestamps: Float64Array
) => void
