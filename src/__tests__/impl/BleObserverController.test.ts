import { test, assert } from '@neurodevs/node-tdd'

import BleObserverController, {
    BleObserver,
} from '../../impl/BleObserverController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'

export default class BleObserverControllerTest extends AbstractPackageTest {
    private static instance: BleObserver

    protected static async beforeEach() {
        await super.beforeEach()

        this.instance = this.BleObserverController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    private static BleObserverController() {
        return BleObserverController.Create()
    }
}
