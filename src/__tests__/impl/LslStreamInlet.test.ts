import { test, assert } from '@neurodevs/node-tdd'
import LslStreamInlet, {
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'
import FakeLiblsl from '../../testDoubles/Liblsl/FakeLiblsl.js'
import FakeStreamInfo from '../../testDoubles/StreamInfo/FakeStreamInfo.js'
import { SpyStreamInlet } from '../../testDoubles/StreamInlet/SpyStreamInlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslStreamInletTest extends AbstractPackageTest {
    private static instance: SpyStreamInlet

    private static callsToOnChunk: {
        chunk: Float32Array
        timestamps: Float64Array
    }[]

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyStreamInlet()
        this.setFakeStreamInfo()

        this.callsToOnChunk = []

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
                sampleRate: 0,
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
                maxBuffered: this.maxBuffered,
            },
            'Should have called createInlet!'
        )
    }

    @test()
    protected static async flushSamplesCallsLslBinding() {
        this.instance.flushSamples()

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
        this.startPulling()
        await this.wait(10)
        this.stopPulling()

        assert.isFalse(this.isRunning, 'isRunning should be false!')
    }

    @test()
    protected static async callsOnChunkForAvailableChunks() {
        const expected = [
            {
                chunk: FakeLiblsl.fakeChunks[0],
                timestamps: FakeLiblsl.fakeTimestamps[0],
            },
            {
                chunk: FakeLiblsl.fakeChunks[1],
                timestamps: FakeLiblsl.fakeTimestamps[1],
            },
        ]

        this.startPulling()
        await this.wait(10)

        assert.isEqualDeep(
            this.callsToOnChunk,
            expected,
            'Did not call onChunk as expected!'
        )

        this.stopPulling()
    }

    @test()
    protected static async callsPullSampleIfChunkSizeIsOne() {
        const inlet = this.LslStreamInlet({ chunkSize: 1 })

        inlet.startPulling()
        await this.wait(10)
        inlet.stopPulling()

        assert.isEqualDeep(
            this.fakeLiblsl.lastPullSampleOptions,
            {
                inlet: this.boundInlet,
                dataBuffer: inlet['dataBuffer'],
                dataBufferElements: this.channelCount,
                timeout: 1.0,
                errcode: new Int32Array(1),
            },
            'Should have called pullSample!'
        )
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

    private static onChunk = (
        chunk: Float32Array,
        timestamps: Float64Array
    ) => {
        this.callsToOnChunk.push({ chunk, timestamps })
    }

    private static get channelCount() {
        return this.channelNames.length
    }

    private static LslStreamInlet(options?: Partial<StreamInletOptions>) {
        const defaultOptions = {
            sampleRate: 0,
            channelNames: this.channelNames,
            channelFormat: 'float32',
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
            onChunk: this.onChunk,
            name: this.name_,
            type: this.type,
            sourceId: this.sourceId,
            ...options,
        } as StreamInletOptions

        return LslStreamInlet.Create(defaultOptions) as SpyStreamInlet
    }
}
