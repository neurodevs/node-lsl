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
    private static readonly namePrefix = this.generateId()
    private static readonly discoveredUuid = this.generateId()

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
    protected static async discoversUuidByNamePrefixWhenUuidNotProvided() {
        const observer = this.BleObserverWithNamePrefix()
        void observer.startObserving()

        assert.isEqual(
            FakeLibndx.callsToDiscoverBleUuid[0]?.namePrefix,
            this.namePrefix,
            'Did not discover uuid by name prefix!'
        )
    }

    @test()
    protected static async doesNotDiscoverUuidWhenUuidProvided() {
        await this.startObserving()

        assert.isLength(
            FakeLibndx.callsToDiscoverBleUuid,
            0,
            'Should not discover uuid when uuid is provided!'
        )
    }

    @test()
    protected static async throwsWhenBothUuidAndNamePrefixProvided() {
        assert.doesThrow(
            () =>
                BleObserverController.Create({
                    deviceUuid: this.deviceUuid,
                    deviceNamePrefix: this.namePrefix,
                }),
            'Cannot pass both deviceUuid and deviceNamePrefix!',
            'Did not throw when both uuid and name prefix were provided!'
        )
    }

    @test()
    protected static async waitsForDiscoveredUuidBeforeCreatingBackend() {
        const observer = this.BleObserverWithNamePrefix()
        void observer.startObserving()

        await this.wait(1)

        assert.isLength(
            FakeLibndx.callsToCreateBleObserver,
            0,
            'Created backend before uuid was discovered!'
        )
    }

    @test()
    protected static async observesDeviceWithDiscoveredUuid() {
        await this.startObservingWithDiscovery()

        assert.isEqualDeep(
            {
                created: FakeLibndx.callsToCreateBleObserver[0]?.deviceUuid,
                started: FakeLibndx.callsToStartBleObserver[0]?.deviceUuid,
            },
            { created: this.discoveredUuid, started: this.discoveredUuid },
            'Did not observe device with discovered uuid!'
        )
    }

    @test()
    protected static async stopsObservingDeviceWithDiscoveredUuid() {
        const observer = await this.startObservingWithDiscovery()
        await observer.stopObserving()

        assert.isEqualDeep(
            FakeLibndx.callsToStopBleObserver[0],
            { deviceUuid: this.discoveredUuid },
            'Did not stop observing device with discovered uuid!'
        )
    }

    @test()
    protected static async startObservingThrowsWhenDiscoveryFails() {
        this.setFakeErrorResult()

        await assert.doesThrowAsync(
            async () => await this.BleObserverWithNamePrefix().startObserving(),
            this.fakeError,
            'Did not throw when discovery failed!'
        )
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

    private static async startObserving() {
        await this.instance.startObserving()
    }

    private static async stopObserving() {
        await this.instance.stopObserving()
    }

    private static async startObservingWithDiscovery() {
        const observer = this.BleObserverWithNamePrefix()
        const promise = observer.startObserving()

        FakeLibndx.callsToDiscoverBleUuid[0]?.onDiscovered(this.discoveredUuid)
        await promise

        return observer
    }

    private static setFakeErrorResult() {
        FakeLibndx.fakeResult = {
            status: 400,
            error: this.fakeError,
        }
    }

    private static BleObserverWithNamePrefix() {
        return BleObserverController.Create({
            deviceNamePrefix: this.namePrefix,
        })
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
