import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import LslInlet from '../components/LslInlet'
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
        assert.isTruthy(this.instance)
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

    private static LslInlet() {
        return LslInlet.Create() as SpyLslInlet
    }
}
