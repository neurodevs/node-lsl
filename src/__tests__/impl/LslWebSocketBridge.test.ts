import { test, assert } from '@neurodevs/node-tdd'

import LslWebSocketBridge, {
    StreamTransportBridge,
} from '../../impl/LslWebSocketBridge.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class LslWebSocketBridgeTest extends AbstractPackageTest {
    private static instance: StreamTransportBridge

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
