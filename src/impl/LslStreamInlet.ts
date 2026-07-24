import {
    handleLslError,
    InfoHandle,
    InletHandle,
    LiblslAdapter,
} from '@neurodevs/ndx-native'
import {
    JsExternal,
    unwrapPointer,
    createPointer,
    DataType,
    freePointer,
    PointerType,
} from 'ffi-rs'

export default class LslStreamInlet implements LslInlet {
    public static Class?: LslInletConstructor
    public static waitAfterOpenStreamMs = 100
    public static lsl = LiblslAdapter.getInstance()
    public static handleLslError = handleLslError
    public static freePointer = freePointer

    public isRunning = false

    private sourceId: string
    private chunkSize: number
    private maxBufferedMs: number
    private pullTimeoutMs: number
    private openStreamTimeoutMs: number
    private waitAfterOpenStreamMs: number
    private waitBetweenPullsMs: number
    private flushInletOnStop: boolean
    private onData: OnDataCallback

    private infoHandle!: InfoHandle
    private inletHandle!: InletHandle
    private channelCount!: number

    private pullMethod!: () => {
        samples: number[] | undefined
        timestamps: number[] | undefined
    }

    private sampleBuffer!: Buffer<ArrayBuffer>
    private sampleBufferRef!: JsExternal[]
    private sampleBufferPtr!: JsExternal

    private timestampBuffer!: Buffer<ArrayBuffer>
    private timestampBufferRef!: JsExternal[]
    private timestampBufferPtr!: JsExternal

    private pullErrorBuffer!: Buffer<ArrayBuffer>
    private pullErrorBufferRef!: JsExternal[]
    private pullErrorBufferPtr!: JsExternal

    private openStreamErrorBuffer!: Buffer<ArrayBuffer>
    private openStreamErrorBufferRef!: JsExternal[]
    private openStreamErrorBufferPtr!: JsExternal

    private readonly sixMinutesInMs = 360 * 1000
    private readonly aboutOneYearInMs = 32000000 * 1000

    private readonly bytesPerFloat = 4
    private readonly bytesPerDouble = 8
    private readonly bytesPerI32 = 4

    protected constructor(options: LslInletOptions, onData: OnDataCallback) {
        const {
            sourceId,
            chunkSize,
            maxBufferedMs,
            pullTimeoutMs,
            openStreamTimeoutMs,
            waitAfterOpenStreamMs,
            waitBetweenPullsMs,
            flushInletOnStop,
        } = options ?? {}

        this.sourceId = sourceId
        this.chunkSize = chunkSize
        this.maxBufferedMs = maxBufferedMs ?? this.sixMinutesInMs
        this.pullTimeoutMs = pullTimeoutMs ?? 0
        this.openStreamTimeoutMs = openStreamTimeoutMs ?? this.aboutOneYearInMs
        this.waitAfterOpenStreamMs = waitAfterOpenStreamMs ?? this.defaultWaitMs
        this.waitBetweenPullsMs = waitBetweenPullsMs ?? 1
        this.flushInletOnStop = flushInletOnStop ?? true
        this.onData = onData
    }

    public static async Create(
        options: LslInletOptions,
        onData: OnDataCallback
    ) {
        return new (this.Class ?? this)(options, onData)
    }

    public async startPulling() {
        if (this.isRunning) {
            console.warn('Skipping startPulling: inlet is already running!')
            return
        }

        this.isRunning = true

        await this.createInlet()
        void this.pullLoop()
    }

    private async createInlet() {
        this.infoHandle = this.resolveInfoHandle()
        this.inletHandle = this.doCreateInlet()
        this.channelCount = this.getChannelCount()

        this.allocateWritableBuffers()
        this.setPullMethod()

        this.openStream()
        await this.waitForSetup()
    }

    private resolveInfoHandle() {
        const handles = this.resolveByProp()

        if (handles.length === 0) {
            this.throwNoStreamFound()
        } else if (handles.length > 1) {
            this.warnMultipleStreamsFound()
        }
        return handles[0]
    }

    private resolveByProp() {
        return this.lsl.resolveByProp({
            prop: 'source_id',
            value: this.sourceId,
        })
    }

    private throwNoStreamFound() {
        throw new Error(`No stream info for sourceId "${this.sourceId}"`)
    }

    private warnMultipleStreamsFound() {
        console.warn(
            `Multiple stream infos for sourceId "${this.sourceId}", using the first one.`
        )
    }

    private doCreateInlet() {
        return this.lsl.createInlet({
            infoHandle: this.infoHandle,
            maxBufferedMs: this.maxBufferedMs,
        })
    }

    private getChannelCount() {
        return this.lsl.getChannelCount({ infoHandle: this.infoHandle })
    }

    private allocateWritableBuffers() {
        this.allocateDataBuffer()
        this.allocateTimestampBuffer()
        this.allocatePullErrorBuffer()
        this.allocateOpenStreamErrorBuffer()
    }

    private allocateDataBuffer() {
        this.sampleBuffer = Buffer.alloc(
            this.channelCount * this.chunkSize * this.bytesPerFloat
        )

        this.sampleBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.sampleBuffer],
        })

        this.sampleBufferPtr = unwrapPointer(this.sampleBufferRef)[0]
    }

    private allocateTimestampBuffer() {
        this.timestampBuffer = Buffer.alloc(
            this.chunkSize * this.bytesPerDouble
        )

        this.timestampBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.timestampBuffer],
        })

        this.timestampBufferPtr = unwrapPointer(this.timestampBufferRef)[0]
    }

    private allocatePullErrorBuffer() {
        this.pullErrorBuffer = Buffer.alloc(this.bytesPerI32)

        this.pullErrorBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.pullErrorBuffer],
        })

        this.pullErrorBufferPtr = unwrapPointer(this.pullErrorBufferRef)[0]
    }

    private allocateOpenStreamErrorBuffer() {
        this.openStreamErrorBuffer = Buffer.alloc(this.bytesPerI32)

        this.openStreamErrorBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.openStreamErrorBuffer],
        })

        this.openStreamErrorBufferPtr = unwrapPointer(
            this.openStreamErrorBufferRef
        )[0]
    }

    private setPullMethod() {
        this.pullMethod =
            this.chunkSize === 1 ? this.pullSample : this.pullChunk
    }

    private pullSample = () => {
        const timestampSec = this.doPullsample()

        if (timestampSec > 0) {
            return {
                samples: this.readSamplesFromBuffer(),
                timestamps: [timestampSec],
            }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private doPullsample() {
        return this.lsl.pullSample({
            inletHandle: this.inletHandle,
            sampleBufferPtr: this.sampleBufferPtr,
            sampleBufferElements: this.channelCount,
            timeoutMs: this.pullTimeoutMs,
            errorCodePtr: this.pullErrorBufferPtr,
        })
    }

    private readSamplesFromBuffer() {
        const floats = new Float32Array(
            this.sampleBuffer.buffer,
            this.sampleBuffer.byteOffset,
            this.chunkSize * this.channelCount
        )
        return Array.from(floats)
    }

    private pullChunk = () => {
        const firstTimestampSec = this.doPullChunk()

        if (firstTimestampSec > 0) {
            return {
                samples: this.readSamplesFromBuffer(),
                timestamps: this.readTimestampsFromBuffer(),
            }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private doPullChunk() {
        return this.lsl.pullChunk({
            inletHandle: this.inletHandle,
            sampleBufferPtr: this.sampleBufferPtr,
            sampleBufferElements: this.chunkSize * this.channelCount,
            timestampBufferPtr: this.timestampBufferPtr,
            timestampBufferElements: this.chunkSize,
            timeoutMs: this.pullTimeoutMs,
            errorCodePtr: this.pullErrorBufferPtr,
        })
    }

    private readTimestampsFromBuffer() {
        const doubles = new Float64Array(
            this.timestampBuffer.buffer,
            this.timestampBuffer.byteOffset,
            this.chunkSize
        )
        return Array.from(doubles)
    }

    private openStream() {
        this.lsl.openStream({
            inletHandle: this.inletHandle,
            timeoutMs: this.openStreamTimeoutMs,
            errorCodePtr: this.openStreamErrorBufferPtr,
        })
    }

    private async waitForSetup() {
        return new Promise((r) => setTimeout(r, this.waitAfterOpenStreamMs))
    }

    private async pullLoop() {
        while (this.isRunning) {
            await this.pullDataOnce()
            await this.waitBetweenPulls()
        }
    }

    private async pullDataOnce() {
        const { samples, timestamps } = this.pullMethod()
        this.handleLslErrorIfPresent()

        if (samples && timestamps) {
            this.onData(samples, timestamps)
        }
    }

    private handleLslErrorIfPresent() {
        const errorCode = this.pullErrorBuffer.readInt32LE()
        this.handleLslError(errorCode)
    }

    private async waitBetweenPulls() {
        await new Promise((r) => setTimeout(r, this.waitBetweenPullsMs))
    }

    public flushInlet() {
        this.lsl.flushInlet({ inletHandle: this.inletHandle })
    }

    public stopPulling() {
        this.isRunning = false
        this.closeStream()

        if (this.flushInletOnStop) {
            this.flushInlet()
        }
    }

    private closeStream() {
        this.lsl.closeStream({ inletHandle: this.inletHandle })
    }

    public destroy() {
        if (this.isRunning) {
            this.stopPulling()
        }

        this.doDestroyInlet()
        this.freeNativePointers()
    }

    private doDestroyInlet() {
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
                this.sampleBufferPtr,
                this.timestampBufferPtr,
                this.pullErrorBufferPtr,
            ],
            pointerType: PointerType.CPointer,
        })
    }

    private get defaultWaitMs() {
        return LslStreamInlet.waitAfterOpenStreamMs
    }

    private get lsl() {
        return LslStreamInlet.lsl
    }

    private get handleLslError() {
        return LslStreamInlet.handleLslError
    }

    private get freePointer() {
        return LslStreamInlet.freePointer
    }
}

export interface LslInlet {
    startPulling(): Promise<void>
    stopPulling(): void
    flushInlet(): void
    destroy(): void
    readonly isRunning: boolean
}

export type LslInletConstructor = new (
    options: LslInletOptions,
    onData: OnDataCallback
) => LslInlet

export interface LslInletOptions {
    sourceId: string
    chunkSize: number
    maxBufferedMs?: number
    openStreamTimeoutMs?: number
    waitAfterOpenStreamMs?: number
    pullTimeoutMs?: number
    waitBetweenPullsMs?: number
    flushInletOnStop?: boolean
}

export type OnDataCallback = (samples: number[], timestamps: number[]) => void
