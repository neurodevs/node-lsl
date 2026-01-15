import { test, assert } from '@neurodevs/node-tdd'

import { DataType, FieldType, JsExternal, PointerType } from 'ffi-rs'
import LslStreamInlet, {
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'
import { SpyStreamInlet } from '../../testDoubles/StreamInlet/SpyStreamInlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslStreamInletTest extends AbstractPackageTest {
    private static instance: SpyStreamInlet

    private static callsToOnData: {
        samples: Float32Array
        timestamps: Float64Array
    }[]

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

        console.warn = () => {}

        this.instance = await this.LslStreamInlet()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async callsBindingsToCreateStreamInlet() {
        const fakeInfo = this.instance.getStreamInfo()

        assert.isTruthy(fakeInfo, 'Should have created stream info!')

        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateInletOptions,
            {
                infoHandle: fakeInfo.infoHandle,
                maxBufferedMs: this.maxBufferedMs,
            },
            'Should have called createInlet!'
        )
    }

    @test()
    protected static async flushQueueCallsLslBinding() {
        this.instance.flushQueue()

        assert.isEqualDeep(
            this.fakeLiblsl.lastFlushInletOptions,
            { inletHandle: this.inletHandle },
            'Should have called flushInlet!'
        )
    }

    @test()
    protected static async destroyCallsLslBinding() {
        LslStreamInlet.freePointer = () => {}

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

        LslStreamInlet.freePointer = (params: FreePointerParams) => {
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
    protected static async startPullingReturnsEarlyIfAlreadyRunning() {
        let numHits = 0

        const original = this.instance['openLslStream'].bind(this.instance)

        this.instance['openLslStream'] = async () => {
            numHits++
            await original()
        }

        await this.startPulling()
        await this.startPulling()

        assert.isEqual(numHits, 1, 'startPulling did not return early!')

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
                errorCodePtr: this.instance['openStreamErrorBufferPtr'],
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

        await instance.startPulling()

        assert.isEqualDeep(
            this.fakeLiblsl.lastOpenStreamOptions,
            {
                inletHandle: instance.getInletHandle(),
                timeoutMs: openStreamTimeoutMs,
                errorCodePtr: instance['openStreamErrorBufferPtr'],
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
        await instance.startPulling()
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
    protected static async stopPullingFlushesQueueByDefault() {
        await this.startPulling()
        this.stopPulling()

        assert.isEqualDeep(
            this.fakeLiblsl.lastFlushInletOptions,
            {
                inletHandle: this.inletHandle,
            },
            'Did not flush inlet queue!'
        )
    }

    @test()
    protected static async stopPullingDoesNotFlushQueueIfPassedOption() {
        const instance = await this.LslStreamInlet({
            flushQueueOnStop: false,
        })

        await instance.startPulling()
        instance.stopPulling()

        assert.isUndefined(
            this.fakeLiblsl.lastFlushInletOptions,
            'Should not have flushed inlet queue!'
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
        const inlet = await this.runChunkSizeOne()

        assert.isEqualDeep(
            this.fakeLiblsl.lastPullSampleOptions,
            {
                inletHandle: this.inletHandle,
                dataBufferPtr: inlet['dataBufferPtr'],
                dataBufferElements: this.channelCount,
                timeoutMs: 0,
                errorCodePtr: inlet['pullErrorBufferPtr'],
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
                dataBufferPtr: this.instance['dataBufferPtr'],
                timestampBufferPtr: this.instance['timestampBufferPtr'],
                dataBufferElements: this.chunkSize * this.channelCount,
                timestampBufferElements: this.chunkSize,
                timeoutMs: 0,
                errorCodePtr: this.instance['pullErrorBufferPtr'],
            },
            'Should have called pullChunk!'
        )
    }

    @test()
    protected static async waitsBetweenPullsIfPassedOption() {
        const waitBetweenPullsMs = 10

        const instance = await this.LslStreamInlet({
            waitBetweenPullsMs,
        })

        let pulls = 0

        //@ts-ignore
        instance.pullDataOnce = () => {
            pulls++
        }

        const t0 = Date.now()
        await instance.startPulling()

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

    @test()
    protected static async throwsWithUnknownErrorCode() {
        await this.assertThrowsWithErrorCode(
            -999,
            `An unknown liblsl error has occurred!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeOne() {
        await this.assertThrowsWithErrorCode(
            -1,
            `The liblsl operation failed due to a timeout!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeTwo() {
        await this.assertThrowsWithErrorCode(
            -2,
            `The liblsl stream has been lost!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeThree() {
        await this.assertThrowsWithErrorCode(
            -3,
            'A liblsl argument was incorrectly specified!'
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeFour() {
        await this.assertThrowsWithErrorCode(
            -4,
            'An internal liblsl error has occurred!'
        )
    }

    private static async startPullingThenDestroy() {
        await this.startPulling()
        this.destroy()
    }

    private static async assertThrowsWithErrorCode(
        errorCode: number,
        message: string
    ) {
        await this.startThenStop()

        this.instance['pullErrorBuffer'].writeInt32LE(errorCode)

        assert.doesThrow(() => {
            this.instance['handleErrorCodeIfPresent']()
        }, message)
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
        await instance.startPulling()
        await this.wait(10)
        instance.stopPulling()
    }

    private static async startPulling() {
        await this.instance.startPulling()
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
        return this.instance.getInletHandle()
    }

    private static onData = (
        samples: Float32Array,
        timestamps: Float64Array
    ) => {
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
