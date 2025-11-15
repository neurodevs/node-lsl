import { test, assert } from '@neurodevs/node-tdd'
import LslStreamInlet, {
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'
import FakeStreamInfo from '../../testDoubles/StreamInfo/FakeStreamInfo.js'
import { SpyStreamInlet } from '../../testDoubles/StreamInlet/SpyStreamInlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslStreamInletTest extends AbstractPackageTest {
    private static instance: SpyStreamInlet

    private static callsToOnData: {
        samples: Float32Array
        timestamps: Float64Array
    }[]

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyStreamInlet()
        this.setFakeStreamInfo()

        this.callsToOnData = []

        this.instance = this.LslStreamInlet()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async createsStreamInfoWithExpectedOptions() {
        assert.isEqualDeep(
            FakeStreamInfo.callsToConstructor[0],
            {
                channelNames: this.channelNames,
                channelFormat: 'float32',
                sampleRateHz: 0,
                name: this.name_,
                type: this.type,
                sourceId: this.sourceId,
            },
            'Stream info should have expected options!'
        )
    }

    @test()
    protected static async uniqueNameHasSetPrefix() {
        const instance = this.LslStreamInlet({ name: undefined })

        assert.doesInclude(
            instance.getName(),
            'lsl-inlet-',
            'Name should have set prefix!'
        )
    }

    @test()
    protected static async callsBindingsToCreateStreamInlet() {
        const fakeInfo = this.instance.getStreamInfo()

        assert.isTruthy(fakeInfo, 'Should have created stream info!')

        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateInletOptions,
            {
                info: fakeInfo.boundStreamInfo,
                chunkSize: this.chunkSize,
                maxBufferedMs: this.maxBufferedMs / 1000,
            },
            'Should have called createInlet!'
        )
    }

    @test()
    protected static async flushQueueCallsLslBinding() {
        this.instance.flushQueue()

        assert.isEqualDeep(
            this.fakeLiblsl.lastFlushInletOptions,
            { inlet: this.boundInlet },
            'Should have called flushInlet!'
        )
    }

    @test()
    protected static async destroyCallsLslBinding() {
        this.instance.destroy()

        assert.isEqualDeep(
            this.fakeLiblsl.lastDestroyInletOptions,
            { inlet: this.boundInlet },
            'Should have called destroyInlet!'
        )
    }

    @test()
    protected static async exposesIsRunningFieldThatIsFalseAtFirst() {
        assert.isFalse(this.isRunning, 'isRunning should be false at first!')
    }

    @test()
    protected static async startPullingSetsIsRunningToTrue() {
        this.startPulling()
        await this.wait(10)

        assert.isTrue(this.isRunning, 'isRunning should be true!')

        this.stopPulling()
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
                inlet: this.boundInlet,
                dataBufferPtr: inlet['dataBufferPtr'],
                dataBufferElements: this.channelCount,
                timeout: 0,
                errcodePtr: inlet['errorCodeBufferPtr'],
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
                inlet: this.boundInlet,
                dataBufferPtr: this.instance['dataBufferPtr'],
                timestampBufferPtr: this.instance['timestampBufferPtr'],
                dataBufferElements: this.chunkSize * this.channelCount,
                timestampBufferElements: this.chunkSize,
                timeout: 0,
                errcodePtr: this.instance['errorCodeBufferPtr'],
            },
            'Should have called pullChunk!'
        )
    }

    @test()
    protected static async passesTimeoutMsOptionToPullSample() {
        const timeoutMs = 1000 * Math.random()

        await this.runInletWithOptions({
            chunkSize: 1,
            timeoutMs,
        })

        assert.isEqual(
            this.fakeLiblsl.lastPullSampleOptions?.timeout,
            timeoutMs / 1000,
            'Did not pass timeoutMs to pullSample!'
        )
    }

    @test()
    protected static async passesTimeoutMsOptionToPullChunk() {
        const timeoutMs = 1000 * Math.random()

        await this.runInletWithOptions({
            chunkSize: this.chunkSize,
            timeoutMs,
        })

        assert.isEqual(
            this.fakeLiblsl.lastPullChunkOptions?.timeout,
            timeoutMs / 1000,
            'Did not pass timeoutMs to pullChunk!'
        )
    }

    @test()
    protected static async defaultsMaxBufferedMsToSixMinutesInSeconds() {
        await this.runInletWithOptions({
            maxBufferedMs: undefined,
        })

        const sixMinutesInSeconds = 360

        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateInletOptions?.maxBufferedMs,
            sixMinutesInSeconds
        )
    }

    @test()
    protected static async throwsWithUnknownErrorCode() {
        await this.assertThrowsWithErrorCode(
            -999,
            `An unknown error occurred in the liblsl library! ${this.fakeLiblsl.liblslPath}`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeOne() {
        await this.assertThrowsWithErrorCode(
            -1,
            `The operation failed due to a timeout!`
        )
    }

    @test()
    protected static async throwsWithErrorCodeNegativeTwo() {
        await this.assertThrowsWithErrorCode(-2, `The stream has been lost!`)
    }

    private static async assertThrowsWithErrorCode(
        errorCode: number,
        message: string
    ) {
        await this.startThenStop()

        this.instance['errorCodeBuffer'].writeInt32LE(errorCode)

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
        const inlet = this.LslStreamInlet(options)
        await this.startThenStop(inlet)
        return inlet
    }

    private static async startThenStop(inlet?: SpyStreamInlet) {
        const instance = inlet || this.instance
        instance.startPulling()
        await this.wait(10)
        instance.stopPulling()
    }

    private static startPulling() {
        this.instance.startPulling()
    }

    private static stopPulling() {
        this.instance.stopPulling()
    }

    private static get isRunning() {
        return this.instance.isRunning
    }

    private static get boundInlet() {
        return this.instance.getBoundInlet()
    }

    private static onData = (
        samples: Float32Array,
        timestamps: Float64Array
    ) => {
        this.callsToOnData.push({ samples, timestamps })
    }

    private static LslStreamInlet(options?: Partial<StreamInletOptions>) {
        const defaultOptions = {
            sampleRateHz: 0,
            channelNames: this.channelNames,
            channelFormat: 'float32',
            chunkSize: this.chunkSize,
            maxBufferedMs: this.maxBufferedMs,
            onData: this.onData,
            name: this.name_,
            type: this.type,
            sourceId: this.sourceId,
            ...options,
        } as StreamInletOptions

        return LslStreamInlet.Create(defaultOptions) as SpyStreamInlet
    }
}
