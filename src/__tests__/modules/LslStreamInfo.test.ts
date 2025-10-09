import { test, assert } from '@sprucelabs/test-utils'
import generateId from '@neurodevs/generate-id'
import { CHANNEL_FORMATS } from '../../consts'
import LslStreamInfo, { StreamInfoOptions } from '../../modules/LslStreamInfo'
import SpyStreamInfo from '../../testDoubles/StreamInfo/SpyStreamInfo'
import AbstractPackageTest from '../AbstractPackageTest'

export default class LslStreamInfoTest extends AbstractPackageTest {
    private static instance: SpyStreamInfo

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyStreamInfo()

        this.instance = this.LslStreamInfo()
    }

    @test()
    protected static async canCreateLslStreamInfo() {
        assert.isTruthy(this.instance, 'Instance should be created!')
    }

    @test()
    protected static async generatesUniqueNameIfNotProvided() {
        const instance1 = this.LslStreamInfo({ name: undefined })
        const instance2 = this.LslStreamInfo({ name: undefined })

        assert.isNotEqual(
            instance1.getName(),
            instance2.getName(),
            'Inlet names should be unique!'
        )
    }

    @test()
    protected static async uniqueNameHasSetPrefix() {
        const instance = this.LslStreamInfo({ name: undefined })

        assert.doesInclude(
            instance.getName(),
            'lsl-stream-info-',
            'Name should have set prefix!'
        )
    }

    @test()
    protected static async canManuallySetName() {
        const name = generateId()
        const instance = this.LslStreamInfo({ name })

        assert.isEqual(
            instance.getName(),
            name,
            'Name should be set to provided value!'
        )
    }

    @test()
    protected static async generatesUniqueTypeIfNotProvided() {
        const instance1 = this.LslStreamInfo({ type: undefined })
        const instance2 = this.LslStreamInfo({ type: undefined })

        assert.isNotEqual(
            instance1.getType(),
            instance2.getType(),
            'Inlet types should be unique!'
        )
    }

    @test()
    protected static async canManuallySetType() {
        const type = generateId()
        const instance = this.LslStreamInfo({ type })

        assert.isEqual(
            instance.getType(),
            type,
            'Type should be set to provided value!'
        )
    }

    @test()
    protected static async generatesUniqueSourceIdIfNotProvided() {
        const instance1 = this.LslStreamInfo({ sourceId: undefined })
        const instance2 = this.LslStreamInfo({ sourceId: undefined })

        assert.isNotEqual(
            instance1.getSourceId(),
            instance2.getSourceId(),
            'Inlet sourceIds should be unique!'
        )
    }

    @test()
    protected static async canManuallySetSourceId() {
        const sourceId = generateId()
        const instance = this.LslStreamInfo({ sourceId })

        assert.isEqual(
            instance.getSourceId(),
            sourceId,
            'SourceId should be set to provided value!'
        )
    }

    @test()
    protected static async setsUnitsToNAIfNotProvided() {
        assert.isEqual(
            this.instance.getUnits(),
            'N/A',
            'Units should be set to "N/A"!'
        )
    }

    @test()
    protected static async canManuallySetUnits() {
        const units = generateId()
        const instance = this.LslStreamInfo({ units })

        assert.isEqual(
            instance.getUnits(),
            units,
            'Units should be set to provided value!'
        )
    }

    @test()
    protected static async callsBindingsToCreateStreamInfo() {
        assert.isEqual(
            this.fakeLiblsl.createStreamInfoHitCount,
            1,
            'Should have called createStreamInfo!'
        )
    }

    @test()
    protected static async passesOptionsToStreamInfo() {
        const randomChannelIdx = Math.floor(
            Math.random() * CHANNEL_FORMATS.length
        )

        const options = {
            name: generateId(),
            type: generateId(),
            sourceId: generateId(),
            channelCount: this.channelNames.length,
            channelFormat: CHANNEL_FORMATS[randomChannelIdx],
            sampleRate: 100 * Math.random(),
        }

        this.LslStreamInfo(options)

        const expected = {
            ...options,
            channelFormat: randomChannelIdx,
        }

        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateStreamInfoOptions,
            expected,
            'Should have passed options to createStreamInfo!'
        )
    }

    @test()
    protected static async appendsChannelsToStreamInfo() {
        this.LslStreamInfo({ units: this.units, type: this.type })

        assert.isEqualDeep(
            this.fakeLiblsl.lastAppendChannelsToStreamInfoOptions,
            {
                info: this.instance.getStreamInfo(),
                channels: this.channelNames.map((label: string) => ({
                    label,
                    unit: this.units,
                    type: this.type,
                })),
            },
            'Should have called appendChannelsToStreamInfo!'
        )
    }

    private static readonly defaultOptions = {
        name: generateId(),
        type: generateId(),
        sourceId: generateId(),
        channelNames: this.channelNames,
        channelFormat: 'float32',
        sampleRate: 100 * Math.random(),
    } as StreamInfoOptions

    private static LslStreamInfo(options?: Partial<StreamInfoOptions>) {
        return LslStreamInfo.Create({
            ...this.defaultOptions,
            ...options,
        }) as SpyStreamInfo
    }
}
