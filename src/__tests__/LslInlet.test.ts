import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import LslInlet from '../components/LslInlet'

export default class LslInletTest extends AbstractSpruceTest {
    private static instance: LslInlet

    protected static async beforeEach() {
        await super.beforeEach()
        this.instance = this.LslInlet()
    }

    @test()
    protected static async canCreateLslInlet() {
        assert.isTruthy(this.instance)
    }

    private static LslInlet() {
        return LslInlet.Create()
    }
}
