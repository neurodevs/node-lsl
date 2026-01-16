import {
    createPointer,
    DataType,
    freePointer,
    JsExternal,
    PointerType,
    unwrapPointer,
} from 'ffi-rs'

import handleError from '../lib/handleError.js'
import { InfoHandle, InletHandle } from './LiblslAdapter.js'
import LiblslAdapter from './LiblslAdapter.js'

export default class LslStreamInlet implements StreamInlet {
    public static Class?: StreamInletConstructor
    public static freePointer = freePointer
    public static waitAfterOpenStreamMs = 100

    public isRunning = false

    private sourceId: string
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

    protected infoHandle!: InfoHandle
    protected inletHandle!: InletHandle

    private channelCount!: number

    private pullDataMethod!: () => {
        samples: Float32Array | undefined
        timestamps: Float64Array | undefined
    }

    private dataBuffer!: Buffer<ArrayBuffer>
    private dataBufferRef!: JsExternal[]
    private dataBufferPtr!: JsExternal

    private timestampBuffer!: Buffer<ArrayBuffer>
    private timestampBufferRef!: JsExternal[]
    private timestampBufferPtr!: JsExternal

    private pullErrorBuffer!: Buffer<ArrayBuffer>
    private pullErrorBufferRef!: JsExternal[]
    private pullErrorBufferPtr!: JsExternal

    private openStreamErrorBuffer!: Buffer<ArrayBuffer>
    private openStreamErrorBufferRef!: JsExternal[]
    private openStreamErrorBufferPtr!: JsExternal

    protected pullLoop!: Promise<void>

    private lsl = LiblslAdapter.getInstance()

    protected constructor(options: StreamInletOptions, onData: OnDataCallback) {
        const {
            sourceId,
            chunkSize,
            maxBufferedMs,
            pullTimeoutMs,
            openStreamTimeoutMs,
            waitAfterOpenStreamMs: waitAfterOpenMs,
            waitBetweenPullsMs,
            flushQueueOnStop,
        } = options ?? {}

        this.sourceId = sourceId
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.sixMinutesInMs
        this.pullTimeoutMs = pullTimeoutMs ?? 0
        this.openStreamTimeoutMs = openStreamTimeoutMs ?? this.aboutOneYearInMs
        this.waitAfterOpenStreamMs = waitAfterOpenMs ?? this.waitAfterOpenMs
        this.waitBetweenPullsMs = waitBetweenPullsMs ?? 1
        this.flushQueueOnStop = flushQueueOnStop ?? true
        this.onData = onData

        this.setPullDataMethod()
    }

    public static async Create(
        options: StreamInletOptions,
        onData: OnDataCallback
    ) {
        return new (this.Class ?? this)(options, onData)
    }

    private setPullDataMethod() {
        if (this.chunkSize === 1) {
            this.pullDataMethod = this.pullSample
        } else {
            this.pullDataMethod = this.pullChunk
        }
    }

    public async startPulling() {
        if (!this.isRunning) {
            this.isRunning = true

            this.infoHandle = await this.resolveInfoHandle()
            this.channelCount = this.getChannelCountFromInfoHandle()
            this.inletHandle = this.createInletHandle()

            await this.openLslStream()

            this.createWritableBuffers()

            this.pullLoop = this.pullOnLoop()
        } else {
            console.warn('Cannot start pulling: inlet is already running!')
        }
    }

    private async resolveInfoHandle() {
        const handles = await this.lsl.resolveByProp({
            prop: 'source_id',
            value: this.sourceId,
        })

        if (handles.length > 1) {
            console.warn(
                `Expected to find exactly one stream info with sourceId "${this.sourceId}", but found ${handles.length}. Returning the first one.`
            )
        }
        return handles[0]
    }

    private getChannelCountFromInfoHandle() {
        return this.lsl.getChannelCount({
            infoHandle: this.infoHandle,
        })
    }

    private createInletHandle() {
        return this.lsl.createInlet({
            infoHandle: this.infoHandle,
            maxBufferedMs: this.maxBufferedMs,
        })
    }

    private async openLslStream() {
        this.createOpenStreamErrorBuffer()

        await this.lsl.openStream({
            inletHandle: this.inletHandle,
            timeoutMs: this.openStreamTimeoutMs,
            errorCodePtr: this.openStreamErrorBufferPtr,
        })

        await this.waitForSetup()
    }

    private createOpenStreamErrorBuffer() {
        this.openStreamErrorBuffer = Buffer.alloc(this.bytesPerInt)

        this.openStreamErrorBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.openStreamErrorBuffer],
        })

        this.openStreamErrorBufferPtr = unwrapPointer(
            this.openStreamErrorBufferRef
        )[0]
    }

    private async waitForSetup() {
        await new Promise((resolve) =>
            setTimeout(resolve, this.waitAfterOpenStreamMs)
        )
    }

    private createWritableBuffers() {
        this.createDataBuffer()
        this.createTimestampBuffer()
        this.createErrorCodeBuffer()
    }

    private createDataBuffer() {
        this.dataBuffer = Buffer.alloc(
            this.bytesPerFloat * this.chunkSize * this.channelCount
        )

        this.dataBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.dataBuffer],
        })

        this.dataBufferPtr = unwrapPointer(this.dataBufferRef)[0]
    }

    private readonly bytesPerFloat = 4

    private createTimestampBuffer() {
        this.timestampBuffer = Buffer.alloc(
            this.bytesPerDouble * this.chunkSize
        )

        this.timestampBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.timestampBuffer],
        })

        this.timestampBufferPtr = unwrapPointer(this.timestampBufferRef)[0]
    }

    private readonly bytesPerDouble = 8

    private createErrorCodeBuffer() {
        this.pullErrorBuffer = Buffer.alloc(this.bytesPerInt)

        this.pullErrorBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.pullErrorBuffer],
        })

        this.pullErrorBufferPtr = unwrapPointer(this.pullErrorBufferRef)[0]
    }

    private readonly bytesPerInt = 4

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
            console.info(samples, timestamps)
            this.onData(samples, timestamps)
        }
    }

    private handleErrorCodeIfPresent() {
        const errorCode = this.pullErrorBuffer.readInt32LE()
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
            timeoutMs: this.pullTimeoutMs,
            errorCodePtr: this.pullErrorBufferPtr,
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
            timeoutMs: this.pullTimeoutMs,
            errorCodePtr: this.pullErrorBufferPtr,
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
        this.freeNativePointers()
    }

    private destroyInletHandle() {
        this.lsl.destroyInlet({ inletHandle: this.inletHandle })
    }

    private freeNativePointers() {
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
                this.pullErrorBufferPtr,
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
    options: StreamInletOptions,
    onData: OnDataCallback
) => StreamInlet

export interface StreamInletOptions {
    sourceId: string
    chunkSize: number
    maxBufferedMs?: number
    openStreamTimeoutMs?: number
    waitAfterOpenStreamMs?: number
    pullTimeoutMs?: number
    waitBetweenPullsMs?: number
    flushQueueOnStop?: boolean
}

export type OnDataCallback = (
    samples: Float32Array,
    timestamps: Float64Array
) => void
