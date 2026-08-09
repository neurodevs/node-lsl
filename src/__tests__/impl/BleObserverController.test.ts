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
        await this.startObserving()

        assert.isEqualDeep(FakeLibndx.callsToCreateBleObserver[0], {
            deviceUuid: this.deviceUuid,
        })
    }

    @test()
    protected static async startObservingStartsBleObserverBackend() {
        await this.startObserving()

        const { deviceUuid, onAdvertisement } =
            FakeLibndx.callsToStartBleObserver[0]

        assert.isEqual(
            deviceUuid,
            this.deviceUuid,
            'Did not pass deviceUuid to startBleObserverBackend!'
        )
        assert.isFunction(
            onAdvertisement,
            'Did not pass onAdvertisement to startBleObserverBackend!'
        )
    }

    @test()
    protected static async stopObservingStopsBleObserverBackend() {
        await this.stopObserving()

        assert.isEqualDeep(FakeLibndx.callsToStopBleObserver[0], {
            deviceUuid: this.deviceUuid,
        })
    }

    private static async startObserving() {
        await this.instance.startObserving()
    }

    private static async stopObserving() {
        await this.instance.stopObserving()
    }

    private static BleObserverController() {
        return BleObserverController.Create({
            deviceUuid: this.deviceUuid,
        })
    }
}
