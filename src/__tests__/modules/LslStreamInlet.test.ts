import { test, assert } from '@sprucelabs/test-utils'
import LslStreamInlet, { LslInletOptions } from '../../modules/LslStreamInlet'
import { SpyLslInlet } from '../../testDoubles/LslInlet/SpyLslInlet'
import FakeStreamInfo from '../../testDoubles/StreamInfo/FakeStreamInfo'
import AbstractPackageTest from '../AbstractPackageTest'

export default class LslStreamInletTest extends AbstractPackageTest {
    private static instance: SpyLslInlet

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyLslInlet()
        this.setFakeStreamInfo()

        this.instance = this.LslStreamInlet()
    }

    @test()
    protected static async canCreateLslStreamInlet() {
        assert.isTruthy(this.instance, 'Instance should be created!')
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
    protected static async callsBindingsToCreateLslInlet() {
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

    private static LslStreamInlet(options?: Partial<LslInletOptions>) {
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
        } as LslInletOptions
        return LslStreamInlet.Create(defaultOptions) as SpyLslInlet
    }
}
