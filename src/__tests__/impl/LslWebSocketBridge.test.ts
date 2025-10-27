import AbstractSpruceTest, { test, assert } from '@sprucelabs/test-utils'
import LslWebSocketBridge, {
    LslTransportBridge,
} from '../../impl/LslWebSocketBridge'

export default class LslWebSocketBridgeTest extends AbstractSpruceTest {
    private static instance: LslTransportBridge

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.LslWebSocketBridge()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static LslWebSocketBridge() {
        return LslWebSocketBridge.Create()
    }
}
