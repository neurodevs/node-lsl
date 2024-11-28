import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import LslInlet, { LslInletOptions } from '../components/LslInlet'
import { SpyLslInlet } from '../testDoubles/SpyLslInlet'

export default class LslInletTest extends AbstractSpruceTest {
    private static instance: LslInlet

    protected static async beforeEach() {
        await super.beforeEach()

        LslInlet.Class = SpyLslInlet

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

    private static LslInlet(options?: LslInletOptions) {
        return LslInlet.Create(options) as SpyLslInlet
    }
}