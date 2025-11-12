import { test, assert } from '@neurodevs/node-tdd'
import LslStreamInlet, {
    StreamInletOptions,
} from '../../impl/LslStreamInlet.js'
import FakeStreamInfo from '../../testDoubles/StreamInfo/FakeStreamInfo.js'
import { SpyStreamInlet } from '../../testDoubles/StreamInlet/SpyStreamInlet.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslStreamInletTest extends AbstractPackageTest {
    private static instance: SpyStreamInlet

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyStreamInlet()
        this.setFakeStreamInfo()

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

        assert.isTrue(this.isRunning, 'isRunning should be true!')
    }

    @test()
    protected static async stopPullingSetsIsRunningToFalse() {
        this.startPulling()
        this.stopPulling()

        assert.isFalse(this.isRunning, 'isRunning should be false!')
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

    private static LslStreamInlet(options?: Partial<StreamInletOptions>) {
        const defaultOptions = {
            channelNames: this.channelNames,
            channelFormat: 'float32',
            sampleRate: 0,
            name: this.name_,
            type: this.type,
            sourceId: this.sourceId,
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
            ...options,
        } as StreamInletOptions
        return LslStreamInlet.Create(defaultOptions) as SpyStreamInlet
    }
}
