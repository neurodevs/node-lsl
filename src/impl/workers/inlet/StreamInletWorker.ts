import {
    JsExternal,
    unwrapPointer,
    createPointer,
    DataType,
    freePointer,
    PointerType,
} from 'ffi-rs'

import handleError from '../../../lib/handleError.js'
import LiblslAdapter, { InfoHandle, InletHandle } from '../../LiblslAdapter.js'
import { OnDataCallback } from '../../LslStreamInlet.js'
import { CreateInletPayload } from './LslStreamInlet.worker.js'

export default class StreamInletWorker {
    public static lsl = LiblslAdapter.getInstance()
    public static handleError = handleError
    public static freePointer = freePointer

    private sourceId!: string
    private chunkSize!: number
    private maxBufferedMs!: number
    private openStreamTimeoutMs!: number
    private waitAfterOpenStreamMs!: number
    private waitBetweenPullsMs!: number
    private pullTimeoutMs!: number
    private flushQueueOnStop!: boolean

    private pullMethod!: () => {
        samples: Float32Array | undefined
        timestamps: Float64Array | undefined
    }

    protected infoHandle!: InfoHandle
    protected inletHandle!: InletHandle
    private channelCount!: number

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

    private onData!: OnDataCallback

    private readonly bytesPerFloat = 4
    private readonly bytesPerDouble = 8
    private readonly bytesPerI32 = 4

    private isRunning = false

    public async createInlet(payload: CreateInletPayload) {
        Object.assign(this, payload)

        this.infoHandle = await this.resolveInfoHandle()
        this.inletHandle = this.doCreateInlet()
        this.channelCount = this.getChannelCount()

        this.allocateWritableBuffers()
        this.setPullMethod()

        await this.openStream()
        await this.waitForSetup()
    }

    private async resolveInfoHandle() {
        const handles = await this.resolveByProp()

        if (handles.length === 0) {
            this.throwNoStreamFound()
        } else if (handles.length > 1) {
            this.warnMultipleStreamsFound()
        }
        return handles[0]
    }

    private async resolveByProp() {
        return await this.lsl.resolveByProp({
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
        this.dataBuffer = Buffer.alloc(
            this.channelCount * this.chunkSize * this.bytesPerFloat
        )

        this.dataBufferRef = createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [this.dataBuffer],
        })

        this.dataBufferPtr = unwrapPointer(this.dataBufferRef)[0]
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
        const timestamp = this.doPullsample()

        if (timestamp > 0) {
            return {
                samples: this.createFloatArrayFromDataBuffer(),
                timestamps: new Float64Array([timestamp]),
            }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private doPullsample() {
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

    private pullChunk = () => {
        const firstTimestamp = this.doPullChunk()

        if (firstTimestamp > 0) {
            return {
                samples: this.createFloatArrayFromDataBuffer(),
                timestamps: this.createDoubleArrayFromTimestampBuffer(),
            }
        }
        return { samples: undefined, timestamps: undefined }
    }

    private doPullChunk() {
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

    private async openStream() {
        await this.lsl.openStream({
            inletHandle: this.inletHandle,
            timeoutMs: this.openStreamTimeoutMs,
            errorCodePtr: this.openStreamErrorBufferPtr,
        })
    }

    private waitForSetup() {
        return new Promise((r) => setTimeout(r, this.waitAfterOpenStreamMs))
    }

    public startPulling(onData: OnDataCallback) {
        if (this.isRunning) {
            console.warn('StreamInletWorker is already running.')
            return
        }
        this.isRunning = true
        this.onData = onData

        void this.pullLoop()
    }

    private async pullLoop() {
        while (this.isRunning) {
            await this.pullDataOnce()
            await this.waitBetweenPulls()
        }
    }

    private async pullDataOnce() {
        const { samples, timestamps } = this.pullMethod()
        this.handleErrorIfPresent()

        if (samples && timestamps) {
            this.onData(samples, timestamps)
        }
    }

    private handleErrorIfPresent() {
        const errorCode = this.pullErrorBuffer.readInt32LE()
        this.handleError(errorCode)
    }

    private async waitBetweenPulls() {
        await new Promise((r) => setTimeout(r, this.waitBetweenPullsMs))
    }

    public flushQueue() {
        this.lsl.flushInlet({ inletHandle: this.inletHandle })
    }

    public stopPulling() {
        this.isRunning = false
        this.closeStream()

        if (this.flushQueueOnStop) {
            this.flushQueue()
        }
    }

    private closeStream() {
        this.lsl.closeStream({ inletHandle: this.inletHandle })
    }

    public destroyInlet() {
        this.stopPulling()
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
                this.dataBufferPtr,
                this.timestampBufferPtr,
                this.pullErrorBufferPtr,
            ],
            pointerType: PointerType.CPointer,
        })
    }

    private get lsl() {
        return StreamInletWorker.lsl
    }

    private get handleError() {
        return StreamInletWorker.handleError
    }

    private get freePointer() {
        return StreamInletWorker.freePointer
    }
}
