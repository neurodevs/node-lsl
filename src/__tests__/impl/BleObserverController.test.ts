import { test, assert } from '@neurodevs/node-tdd'

import BleObserverController, {
    BleObserver,
} from '../../impl/controllers/BleObserverController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import { FakeLibndx } from '@neurodevs/ndx-native'

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

    @test()
    protected static async startObservingCreatesBleObserverBackend() {
        await this.instance.startObserving()

        assert.isEqualDeep(FakeLibndx.callsToCreateBleObserver[0], {
            deviceUuid: this.deviceUuid,
        })
    }

    private static BleObserverController() {
        return BleObserverController.Create({
            deviceUuid: this.deviceUuid,
        })
    }
}
