import { randomInt } from 'node:crypto'

import { FakeLibndx, NativeAdvertisement } from '@neurodevs/ndx-native'
import { test, assert } from '@neurodevs/node-tdd'

import AbstractPackageTest from '../AbstractPackageTest.js'
import BleObserverController, {
    BleObserver,
} from '../../impl/controllers/BleObserverController.js'

export default class BleObserverControllerTest extends AbstractPackageTest {
    private static instance: BleObserver
    private static passedAdvertisements: NativeAdvertisement[]

    private static readonly fakeError = this.generateId()

    private static readonly advertisement: NativeAdvertisement = {
        localName: this.generateId(),
        companyId: randomInt(0, 65535),
        manufacturerData: this.generateId().slice(0, 8),
        serviceUuids: [],
        serviceData: {},
        rssi: null,
        txPowerLevel: null,
        isConnectable: true,
        timestampSec: 1234.5,
    }

    protected static async beforeEach() {
        await super.beforeEach()

        this.passedAdvertisements = []

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
    protected static async passesExpectedArgsToOnAdvertisement() {
        await this.startObserving()

        FakeLibndx.callsToStartBleObserver[0]?.onAdvertisement(
            this.advertisement
        )

        assert.isEqualDeep(
            this.passedAdvertisements[0],
            this.advertisement,
            'Did not pass expected args to onAdvertisement!'
        )
    }

    @test()
    protected static async stopObservingStopsBleObserverBackend() {
        await this.stopObserving()

        assert.isEqualDeep(FakeLibndx.callsToStopBleObserver[0], {
            deviceUuid: this.deviceUuid,
        })
    }

    @test()
    protected static async createBleObserverBackendThrowsOnError() {
        this.setFakeErrorResult()

        //@ts-ignore
        this.instance.startBleObserverBackend = () => {}

        await assert.doesThrowAsync(
            async () => await this.startObserving(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async startObservingThrowsOnError() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.startObserving(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    @test()
    protected static async stopObservingThrowsOnError() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.stopObserving(),
            this.fakeError,
            'Did not throw error!'
        )
    }

    private static setFakeErrorResult() {
        FakeLibndx.fakeResult = {
            status: 400,
            error: this.fakeError,
        }
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
            onAdvertisement: (advertisement: NativeAdvertisement) => {
                this.passedAdvertisements.push(advertisement)
            },
        })
    }
}
