import { test, assert, generateId, errorAssert } from '@sprucelabs/test-utils'
import LslInlet, { LslInletOptions } from '../components/LslInlet'
import { CHANNEL_FORMATS } from '../consts'
import { SpyLslInlet } from '../testDoubles/SpyLslInlet'
import AbstractNodeLslTest from './AbstractNodeLslTest'

export default class LslInletTest extends AbstractNodeLslTest {
    private static instance: SpyLslInlet

    protected static async beforeEach() {
        await super.beforeEach()

        this.setSpyLslInlet()

        this.instance = this.LslInlet()
    }

    @test()
    protected static async canCreateLslInlet() {
        assert.isTruthy(this.instance, 'Instance should be created!')
    }

    @test()
    protected static async throwsWithMissingRequiredOptions() {
        const err = assert.doesThrow(
            // @ts-ignore
            () => LslInlet.Create()
        )
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: [
                'sampleRate',
                'channelNames',
                'channelFormat',
                'chunkSize',
                'maxBuffered',
            ],
        })
    }

    @test()
    protected static async generatesUniqueNameIfNotProvided() {
        const instance1 = this.LslInlet()
        const instance2 = this.LslInlet()

        assert.isNotEqual(
            instance1.getName(),
            instance2.getName(),
            'Inlet names should be unique!'
        )
    }

    @test()
    protected static async uniqueNameHasSetPrefix() {
        const instance = this.LslInlet()

        assert.doesInclude(
            instance.getName(),
            'lsl-inlet-',
            'Name should have set prefix!'
        )
    }

    @test()
    protected static async canManuallySetName() {
        const name = generateId()
        const instance = this.LslInlet({ name })

        assert.isEqual(
            instance.getName(),
            name,
            'Name should be set to provided value!'
        )
    }

    @test()
    protected static async generatesUniqueTypeIfNotProvided() {
        const instance1 = this.LslInlet()
        const instance2 = this.LslInlet()

        assert.isNotEqual(
            instance1.getType(),
            instance2.getType(),
            'Inlet types should be unique!'
        )
    }

    @test()
    protected static async canManuallySetType() {
        const type = generateId()
        const instance = this.LslInlet({ type })

        assert.isEqual(
            instance.getType(),
            type,
            'Type should be set to provided value!'
        )
    }

    @test()
    protected static async generatesUniqueSourceIdIfNotProvided() {
        const instance1 = this.LslInlet()
        const instance2 = this.LslInlet()

        assert.isNotEqual(
            instance1.getSourceId(),
            instance2.getSourceId(),
            'Inlet sourceIds should be unique!'
        )
    }

    @test()
    protected static async canManuallySetSourceId() {
        const sourceId = generateId()
        const instance = this.LslInlet({ sourceId })

        assert.isEqual(
            instance.getSourceId(),
            sourceId,
            'SourceId should be set to provided value!'
        )
    }

    @test()
    protected static async setsManufacturerToNAIfNotProvided() {
        assert.isEqual(
            this.instance.getManufacturer(),
            'N/A',
            'Manufacturer should be set to "N/A"!'
        )
    }

    @test()
    protected static async canManuallySetManufacturer() {
        const manufacturer = generateId()
        const instance = this.LslInlet({ manufacturer })

        assert.isEqual(
            instance.getManufacturer(),
            manufacturer,
            'Manufacturer should be set to provided value!'
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
        const instance = this.LslInlet({ units })

        assert.isEqual(
            instance.getUnits(),
            units,
            'Units should be set to provided value!'
        )
    }

    @test()
    protected static async createsStreamInfo() {
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
            channelCount: this.channelNames.length,
            sampleRate: 100 * Math.random(),
            channelFormat: CHANNEL_FORMATS[randomChannelIdx],
            sourceId: generateId(),
        }

        this.LslInlet(options)

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
        this.LslInlet({ units: this.units, type: this.type })

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

    @test()
    protected static async createsLslInlet() {
        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateInletOptions,
            {
                info: this.instance.getStreamInfo(),
                chunkSize: this.chunkSize,
                maxBuffered: this.maxBuffered,
            },
            'Should have called createInlet!'
        )
    }

    private static setSpyLslInlet() {
        LslInlet.Class = SpyLslInlet
    }

    private static readonly type = generateId()
    private static readonly channelNames = [generateId(), generateId()]
    private static readonly units = generateId()
    private static readonly chunkSize = Math.floor(Math.random() * 100)
    private static readonly maxBuffered = Math.floor(Math.random() * 100)

    private static LslInlet(options?: Partial<LslInletOptions>) {
        const defaultOptions = {
            sampleRate: 0,
            channelNames: this.channelNames,
            channelFormat: 'float32',
            chunkSize: this.chunkSize,
            maxBuffered: this.maxBuffered,
            ...options,
        } as LslInletOptions
        return LslInlet.Create(defaultOptions) as SpyLslInlet
    }
}
