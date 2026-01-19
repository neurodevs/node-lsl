import { Worker } from 'node:worker_threads'
import { test, assert } from '@neurodevs/node-tdd'

import {
    createPointer,
    DataType,
    FieldType,
    JsExternal,
    PointerType,
    unwrapPointer,
} from 'ffi-rs'
import LslStreamInlet, {
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'
import StreamInletWorker from '../../impl/workers/inlet/StreamInletWorker.js'
import FakeLiblsl from '../../testDoubles/Liblsl/FakeLiblsl.js'
import { SpyStreamInlet } from '../../testDoubles/StreamInlet/SpyStreamInlet.js'
import FakeWorker from '../../testDoubles/WorkerThreads/FakeWorker.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslStreamInletTest extends AbstractPackageTest {
    private static instance: SpyStreamInlet

    private static callsToOnData: {
        samples: number[]
        timestamps: number[]
    }[]

    private static readonly sampleBufferPtr = unwrapPointer(
        createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [new Float32Array(this.channelCount * this.chunkSize)],
        })
    )[0]

    private static readonly timestampBufferPtr = unwrapPointer(
        createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [new Float64Array(this.chunkSize)],
        })
    )[0]

    private static readonly errorCodePtr = unwrapPointer(
        createPointer({
            paramsType: [DataType.U8Array],
            paramsValue: [new Int32Array(1)],
        })
    )[0]

    protected static async beforeAll() {
        assert.isEqual(
            LslStreamInlet.waitAfterOpenStreamMs,
            100,
            'Default waitAfterOpenStreamMs should be 100!'
        )
    }

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLiblsl()
        this.setFakeStreamInfo()
        this.setSpyStreamInlet()

        this.callsToOnData = []

        LslStreamInlet.waitAfterOpenStreamMs = 0

        LslStreamInlet.Worker = FakeWorker as unknown as typeof Worker
        FakeWorker.resetTestDoubles()

        StreamInletWorker.lsl = this.fakeLiblsl
        StreamInletWorker.freePointer = () => {}

        FakeWorker.fakeOnData = this.onData

        this.instance = await this.LslStreamInlet()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async callsBindingsToCreateStreamInlet() {
        await this.startPulling()

        assert.isTruthy(this.inletHandle, 'Should have created stream info!')

        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateInletOptions,
            {
                infoHandle: this.inletHandle,
                maxBufferedMs: this.maxBufferedMs,
            },
            'Should have called createInlet!'
        )

        this.stopPulling()
    }

    @test()
    protected static async flushInletCallsLslBinding() {
        this.instance.flushInlet()

        assert.isEqualDeep(
            this.fakeLiblsl.lastFlushInletOptions,
            { inletHandle: this.inletHandle },
            'Should have called flushInlet!'
        )
    }

    @test()
    protected static async destroyCallsLslBinding() {
        await this.startPullingThenDestroy()

        assert.isEqualDeep(
            this.fakeLiblsl.lastDestroyInletOptions,
            { inletHandle: this.inletHandle },
            'Did not destroy inlet!'
        )
    }

    @test()
    protected static async destroyFreesAllPointers() {
        interface FreePointerParams {
            paramsType: FieldType[]
            paramsValue: JsExternal[]
            pointerType: PointerType
        }

        let calls: FreePointerParams[] = []

        StreamInletWorker.freePointer = (params: FreePointerParams) => {
            calls.push(params)
        }

        await this.startPullingThenDestroy()

        const { paramsType, pointerType } = calls[0]

        assert.isEqualDeep(
            { paramsType, pointerType },
            {
                paramsType: [
                    DataType.U8Array,
                    DataType.U8Array,
                    DataType.U8Array,
                    DataType.U8Array,
                ],
                pointerType: PointerType.CPointer,
            },

            'Destroy did not free all pointers!'
        )
    }

    @test()
    protected static async destroyCallsStopIfIsRunning() {
        await this.startPulling()
        this.destroy()

        assert.isFalse(
            this.instance.isRunning,
            'Did not stop inlet before destroying!'
        )
    }

    @test()
    protected static async destroyDoesNotCallStopIfNotRunning() {
        let wasHit = false

        this.instance.stopPulling = () => {
            wasHit = true
        }

        this.instance.destroy()

        assert.isFalse(wasHit, 'Stop should not have been called!')
    }

    @test()
    protected static async exposesIsRunningFieldThatIsFalseAtFirst() {
        assert.isFalse(this.isRunning, 'isRunning should be false at first!')
    }

    @test()
    protected static async startPullingSetsIsRunningToTrue() {
        await this.startPulling()

        assert.isTrue(this.isRunning, 'isRunning should be true!')

        this.stopPulling()
    }

    @test()
    protected static async doesNotStartPullingTwiceIfAlreadyRunning() {
        await this.startPulling()
        await this.startPulling()

        assert.isEqual(
            FakeWorker.callsToPostMessage.filter(
                (msg) => msg.type === 'startPulling'
            ).length,
            1,
            'startPulling did not return early!'
        )

        this.stopPulling()
    }

    @test()
    protected static async startPullingOpensInletStream() {
        await this.startPulling()

        const aboutOneYearInMs = 32000000 * 1000

        assert.isEqualDeep(
            this.fakeLiblsl.lastOpenStreamOptions,
            {
                inletHandle: this.inletHandle,
                timeoutMs: aboutOneYearInMs,
                errorCodePtr: this.errorCodePtr,
            },
            'Did not open inlet stream!'
        )

        this.stopPulling()
    }

    @test()
    protected static async opensInletStreamWithPassedTimeout() {
        const openStreamTimeoutMs = 1000 * Math.random()

        const instance = await this.LslStreamInlet({
            openStreamTimeoutMs,
        })

        await this.startPulling(instance)

        assert.isEqualDeep(
            this.fakeLiblsl.lastOpenStreamOptions,
            {
                inletHandle: this.inletHandle,
                timeoutMs: openStreamTimeoutMs,
                errorCodePtr: this.errorCodePtr,
            },
            'Did not open inlet stream with passed timeout!'
        )

        instance.stopPulling()
    }

    @test()
    protected static async waitsAfterOpeningStreamWithPassedOption() {
        const waitAfterOpenStreamMs = 10

        const instance = await this.LslStreamInlet({
            waitAfterOpenStreamMs,
        })

        let t0 = Date.now()
        await this.startPulling(instance)
        let elapsed = Date.now() - t0

        instance.stopPulling()

        assert.isAbove(
            elapsed,
            waitAfterOpenStreamMs * 0.8,
            'Did not wait after opening stream!'
        )
    }

    @test()
    protected static async stopPullingClosesInletStream() {
        await this.startPulling()
        this.stopPulling()

        assert.isEqualDeep(
            this.fakeLiblsl.lastCloseStreamOptions,
            {
                inletHandle: this.inletHandle,
            },
            'Did not close inlet stream!'
        )
    }

    @test()
    protected static async stopPullingFlushesInletByDefault() {
        await this.startPulling()
        this.stopPulling()

        assert.isEqualDeep(
            this.fakeLiblsl.lastFlushInletOptions,
            {
                inletHandle: this.inletHandle,
            },
            'Did not flush inlet!'
        )
    }

    @test()
    protected static async stopPullingDoesNotFlushInletIfPassedOption() {
        const instance = await this.LslStreamInlet({
            flushInletOnStop: false,
        })

        await this.startPulling(instance)
        instance.stopPulling()

        assert.isUndefined(
            this.fakeLiblsl.lastFlushInletOptions,
            'Should not have flushed inlet!'
        )
    }

    @test()
    protected static async stopPullingSetsIsRunningToFalse() {
        await this.startThenStop()

        assert.isFalse(this.isRunning, 'isRunning should be false!')
    }

    @test()
    protected static async callsOnDataForChunkSizeNotOne() {
        await this.startThenStop()

        assert.isEqual(
            this.callsToOnData.length,
            2,
            'Did not call onData as expected!'
        )
    }

    @test()
    protected static async callsOnDataForChunkSizeOne() {
        await this.runChunkSizeOne()

        assert.isEqual(
            this.callsToOnData.length,
            2,
            'Did not call onData as expected!'
        )
    }

    @test()
    protected static async callsPullSampleIfChunkSizeIsOne() {
        await this.runChunkSizeOne()

        assert.isEqualDeep(
            this.fakeLiblsl.lastPullSampleOptions,
            {
                inletHandle: this.inletHandle,
                sampleBufferPtr: this.sampleBufferPtr,
                sampleBufferElements: this.channelCount,
                timeoutMs: 0,
                errorCodePtr: this.errorCodePtr,
            },
            'Should have called pullSample!'
        )
    }

    @test()
    protected static async callsPullChunkIfChunkSizeIsNotOne() {
        await this.startThenStop()

        assert.isEqualDeep(
            this.fakeLiblsl.lastPullChunkOptions,
            {
                inletHandle: this.inletHandle,
                sampleBufferPtr: this.sampleBufferPtr,
                timestampBufferPtr: this.timestampBufferPtr,
                sampleBufferElements: this.chunkSize * this.channelCount,
                timestampBufferElements: this.chunkSize,
                timeoutMs: 0,
                errorCodePtr: this.errorCodePtr,
            },
            'Should have called pullChunk!'
        )
    }

    @test()
    protected static async pushSampleHandlesErrorCode() {
        let passedErrorCode: number | undefined

        StreamInletWorker.handleError = (errorCode: number) => {
            passedErrorCode = errorCode
        }

        const fakeErrorCode = [-4, -3, -2, -1, 0][Math.floor(Math.random() * 5)]
        const worker = this.getFakeWorker()

        worker['inletWorker']['pullErrorBuffer'].writeInt32LE(fakeErrorCode)

        await this.startThenStop()

        assert.isEqualDeep(
            passedErrorCode,
            FakeLiblsl.fakeErrorCode,
            'Did not pass the expected error code to handleError!'
        )
    }

    @test()
    protected static async waitsBetweenPullsIfPassedOption() {
        const waitBetweenPullsMs = 10

        const instance = await this.LslStreamInlet({
            waitBetweenPullsMs,
        })

        let pulls = 0

        const inletWorker = this.getFakeWorker(instance)['inletWorker']
        const original = inletWorker['pullDataOnce'].bind(inletWorker)

        inletWorker['pullDataOnce'] = async () => {
            pulls++
            await original()
        }

        const t0 = Date.now()
        const promise = this.startPulling(instance)

        while (pulls < 2) {
            await this.wait(1)
        }

        const elapsed = Date.now() - t0

        assert.isAbove(
            elapsed,
            waitBetweenPullsMs * 0.8,
            'Did not wait between pulls'
        )

        instance.stopPulling()
        await promise
    }

    @test()
    protected static async waitsOneMillisecondBetweenPullsIfNotPassed() {
        assert.isEqual(
            this.instance['waitBetweenPullsMs'],
            1,
            'Default waitBetweenPullsMs should be 1!'
        )
    }

    @test()
    protected static async passesTimeoutMsOptionToPullSample() {
        const pullTimeoutMs = 1000 * Math.random()

        await this.runInletWithOptions({
            chunkSize: 1,
            pullTimeoutMs,
        })

        assert.isEqual(
            this.fakeLiblsl.lastPullSampleOptions?.timeoutMs,
            pullTimeoutMs,
            'Did not pass pullTimeoutMs to pullSample!'
        )
    }

    @test()
    protected static async passesTimeoutMsOptionToPullChunk() {
        const pullTimeoutMs = 1000 * Math.random()

        await this.runInletWithOptions({
            chunkSize: this.chunkSize,
            pullTimeoutMs,
        })

        assert.isEqual(
            this.fakeLiblsl.lastPullChunkOptions?.timeoutMs,
            pullTimeoutMs,
            'Did not pass timeoutMs to pullChunk!'
        )
    }

    @test()
    protected static async defaultsMaxBufferedMsToSixMinutesInSeconds() {
        await this.runInletWithOptions({
            maxBufferedMs: undefined,
        })

        const sixMinutesInMs = 360 * 1000

        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateInletOptions?.maxBufferedMs,
            sixMinutesInMs
        )
    }

    private static async startPullingThenDestroy() {
        await this.startPulling()
        this.destroy()
    }

    private static async runChunkSizeOne() {
        return await this.runInletWithOptions({
            chunkSize: 1,
        })
    }

    private static async runInletWithOptions(
        options?: Partial<StreamInletOptions>
    ) {
        const inlet = await this.LslStreamInlet(options)
        await this.startThenStop(inlet)
        return inlet
    }

    private static async startThenStop(inlet?: SpyStreamInlet) {
        const instance = inlet || this.instance
        await this.startPulling(instance)
        await this.wait(10)
        instance.stopPulling()
    }

    private static async startPulling(instance?: SpyStreamInlet) {
        const inst = instance || this.instance
        const startPullingPromise = inst.startPulling()

        while (!this.getFakeWorker(inst).createInletPromise) {
            await this.wait(1)
        }

        await this.getFakeWorker(inst).createInletPromise
        inst['workerReady'] = true

        await startPullingPromise
    }

    private static stopPulling() {
        this.instance.stopPulling()
    }

    private static destroy() {
        this.instance.destroy()
    }

    private static get isRunning() {
        return this.instance.isRunning
    }

    private static get inletHandle() {
        return this.getFakeWorker()['inletWorker']['inletHandle']
    }

    private static getFakeWorker(instance?: SpyStreamInlet) {
        const inst = instance || this.instance
        return inst['worker'] as unknown as FakeWorker
    }

    private static onData = (samples: number[], timestamps: number[]) => {
        this.callsToOnData.push({ samples, timestamps })
    }

    protected static async LslStreamInlet(
        options?: Partial<StreamInletOptions>
    ) {
        return (await AbstractPackageTest.LslStreamInlet(
            {
                ...options,
            },
            this.onData
        )) as SpyStreamInlet
    }
}
