import AbstractSpruceTest, {
    test,
    assert,
    generateId,
    errorAssert,
} from '@sprucelabs/test-utils'
import LiblslImpl from '../components/Liblsl'
import LslInlet, { LslInletOptions } from '../components/LslInlet'
import FakeLiblsl from '../testDoubles/FakeLiblsl'
import { SpyLslInlet } from '../testDoubles/SpyLslInlet'

export default class LslInletTest extends AbstractSpruceTest {
    private static instance: SpyLslInlet
    private static fakeLiblsl: FakeLiblsl

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLiblsl()
        this.setSpyLslInlet()

        this.instance = this.LslInlet()
    }

    @test()
    protected static async canCreateLslInlet() {
        assert.isTruthy(this.instance, 'Instance should be created!')
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
        const options = {
            name: generateId(),
            type: generateId(),
            channelCount: 1,
            sampleRate: 0,
            channelFormat: 0,
            sourceId: generateId(),
        }

        this.LslInlet(options)

        assert.isEqualDeep(
            this.fakeLiblsl.lastCreateStreamInfoOptions,
            options,
            'Should have passed options to createStreamInfo!'
        )
    }

    @test()
    protected static async throwsWithMissingRequiredOptions() {
        const err = assert.doesThrow(
            // @ts-ignore
            () => LslInlet.Create()
        )
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['sampleRate', 'channelCount', 'channelFormat'],
        })
    }

    private static setSpyLslInlet() {
        LslInlet.Class = SpyLslInlet
    }

    private static setFakeLiblsl() {
        this.fakeLiblsl = new FakeLiblsl()
        LiblslImpl.setInstance(this.fakeLiblsl)
    }

    private static LslInlet(options?: Partial<LslInletOptions>) {
        const defaultOptions = {
            sampleRate: 0,
            channelCount: 1,
            channelFormat: 0,
            ...options,
        } as LslInletOptions
        return LslInlet.Create(defaultOptions) as SpyLslInlet
    }
}
