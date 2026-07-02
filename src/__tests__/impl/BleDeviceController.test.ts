import { randomInt } from 'node:crypto'

import { test, assert } from '@neurodevs/node-tdd'
import { FakeLibndx, NativePeripheral } from '@neurodevs/ndx-native'

import SpyBleController from '../../testDoubles/BleController/SpyBleController.js'
import AbstractPackageTest from '../AbstractPackageTest.js'
import BleDeviceController, {
    BleControllerOptions,
} from '../../impl/controllers/BleDeviceController.js'

export default class BleDeviceControllerTest extends AbstractPackageTest {
    private static instance: SpyBleController

    private static readonly uuid = this.generateId()
    private static readonly namePrefix = this.generateId()
    private static readonly discoveredUuid = this.generateId()
    private static readonly charUuid = this.generateId()
    private static readonly charValueToWrite = this.generateId()
    private static readonly rssiIntervalMs = randomInt(1, 5)
    private static readonly fakeError = this.generateId()
    private static readonly fake400Error = `400 error: ${this.fakeError}`
    private static readonly fake500Error = `500 error: ${this.fakeError}`

    private static readonly charCallbacks = [
        {
            charUuid: this.generateId(),
            charName: this.generateId(),
            onData: async () => {},
        },
        {
            charUuid: this.generateId(),
            charName: this.generateId(),
            onData: async () => {},
        },
    ]

    private static onConnected = (_peripheral: NativePeripheral) => {
        this.wasConnected = true
    }

    private static wasConnected: boolean

    private static nativePeripheral: NativePeripheral = {
        uuid: this.generateId(),
        name: this.generateId(),
    }

    protected static async beforeAll() {
        assert.isEqual(
            BleDeviceController.waitAfterMs,
            1000,
            'Set incorrect waitAfterMs!'
        )
    }

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceController.waitAfterMs = 0

        this.setFakeLibndx()
        BleDeviceController.Class = SpyBleController

        this.wasConnected = false

        this.instance = await this.BleController()
    }

    @test()
    protected static async createsInstance() {
        assert.isTruthy(this.instance, 'Failed to create instance!')
    }

    @test()
    protected static async connectCallsLibndxCreateBleBackend() {
        await this.connect()

        assert.isEqualDeep(
            FakeLibndx.callsToCreateBleBackend[0],
            {
                deviceUuid: this.uuid,
            },
            'Did not call createBleBackend!'
        )
    }

    @test()
    protected static async discoversUuidWhenDeviceUuidNotProvided() {
        const instance = await this.BleControllerWithPrefix()

        await this.connectWithDiscovery(instance)

        const call = FakeLibndx.callsToDiscoverBleUuid[0]

        assert.isEqual(
            call?.namePrefix,
            this.namePrefix,
            'Did not call discoverBleUuid with deviceNamePrefix!'
        )

        assert.isFunction(
            call?.onDiscovered,
            'Did not pass an onDiscovered callback to discoverBleUuid!'
        )
    }

    @test()
    protected static async doesNotDiscoverUuidWhenDeviceUuidProvided() {
        await this.connect()

        assert.isEqual(
            FakeLibndx.callsToDiscoverBleUuid.length,
            0,
            'Should not call discoverBleUuid when deviceUuid is provided!'
        )
    }

    @test()
    protected static async usesDiscoveredUuidToCreateBleBackend() {
        const instance = await this.BleControllerWithPrefix()

        await this.connectWithDiscovery(instance)

        assert.isEqualDeep(
            FakeLibndx.callsToCreateBleBackend[0],
            {
                deviceUuid: this.discoveredUuid,
            },
            'Did not create BLE backend with the discovered uuid!'
        )
    }

    @test()
    protected static async usesDiscoveredUuidToStartBleBackend() {
        const instance = await this.BleControllerWithPrefix()

        await this.connectWithDiscovery(instance)

        assert.isEqual(
            FakeLibndx.callsToStartBleBackend[0]?.deviceUuid,
            this.discoveredUuid,
            'Did not start BLE backend with the discovered uuid!'
        )
    }

    @test()
    protected static async exposesDiscoveredUuid() {
        const instance = await this.BleControllerWithPrefix()

        await this.connectWithDiscovery(instance)

        assert.isEqual(
            instance.uuid,
            this.discoveredUuid,
            'Did not expose the discovered uuid!'
        )
    }

    @test()
    protected static async createBleBackendThrowsOn400() {
        this.setFake400Error()

        await assert.doesThrowAsync(
            async () => await this.instance.connect(),
            this.fake400Error,
            'Did not throw error!'
        )
    }

    @test()
    protected static async createBleBackendThrowsOn500() {
        this.setFake500Error()

        await assert.doesThrowAsync(
            async () => await this.instance.connect(),
            this.fake500Error,
            'Did not throw error!'
        )
    }

    @test()
    protected static async connectCallsLibndxStartBleBackend() {
        await this.connect()

        const call = FakeLibndx.callsToStartBleBackend[0]

        assert.isEqual(
            call.deviceUuid,
            this.uuid,
            'Did not call startBleBackend with correct deviceUuid!'
        )

        assert.isEqual(
            call.charCallbacks.length,
            2,
            'Did not call startBleBackend with charCallbacks!'
        )

        let i = 0
        for (const charCallback of call.charCallbacks) {
            assert.isEqual(
                charCallback.charUuid,
                this.charCallbacks[i].charUuid,
                'Incorrect charUuid!'
            )

            assert.isEqual(
                charCallback.charName,
                this.charCallbacks[i].charName,
                'Incorrect charName!'
            )

            assert.isFunction(
                charCallback.onData,
                'Callback is not a function!'
            )
            i++
        }
    }

    @test()
    protected static async startBleBackendThrowsOn400() {
        //@ts-ignore
        this.instance.createBleBackend = () => {}

        this.setFake400Error()

        await assert.doesThrowAsync(
            async () => await this.instance.connect(),
            this.fake400Error,
            'Did not throw error!'
        )
    }

    @test()
    protected static async startBleBackendThrowsOn500() {
        //@ts-ignore
        this.instance.createBleBackend = () => {}

        this.setFake500Error()

        await assert.doesThrowAsync(
            async () => await this.instance.connect(),
            this.fake500Error,
            'Did not throw error!'
        )
    }

    @test()
    protected static async connectWaitsForOnConnectedEvent() {
        await this.connect()

        assert.isTruthy(
            this.wasConnected,
            'Did not wait for onConnected event!'
        )
    }

    @test()
    protected static async waitsAfterOnConnectedToDiscoverServices() {
        const waitAfterMs = 20
        BleDeviceController.waitAfterMs = waitAfterMs

        await this.connect()

        assert.isTruthy(
            this.callsToSetTimeout.includes(waitAfterMs),
            'Did not wait after on connected!'
        )
    }

    @test()
    protected static async writeCharacteristicCallsLibndxBinding() {
        await this.writeCharacteristic()

        assert.isEqualDeep(
            FakeLibndx.callsToWriteBleCharacteristic[0],
            {
                deviceUuid: this.uuid,
                charUuid: this.charUuid,
                value: this.charValueToWrite,
            },
            'Did not call writeBleCharacteristic as expected!'
        )
    }

    @test()
    protected static async writeCharacteristicThrowsOn400() {
        this.setFake400Error()

        await assert.doesThrowAsync(
            async () => await this.writeCharacteristic(),
            this.fake400Error,
            'Did not throw error!'
        )
    }

    @test()
    protected static async writeCharacteristicThrowsOn500() {
        this.setFake500Error()

        await assert.doesThrowAsync(
            async () => await this.writeCharacteristic(),
            this.fake500Error,
            'Did not throw error!'
        )
    }

    @test()
    protected static async callsSetBleRssiInterval() {
        await this.connect()

        const { deviceUuid, intervalMs } =
            FakeLibndx.callsToSetBleRssiInterval[0]

        assert.isEqualDeep(
            { deviceUuid, intervalMs },
            {
                deviceUuid: this.uuid,
                intervalMs: this.rssiIntervalMs,
            },
            'Did not call setBleRssiInterval as expected!'
        )
    }

    @test()
    protected static async disconnectCallsLibndxStopBleBackend() {
        await this.disconnect()

        assert.isEqualDeep(
            FakeLibndx.callsToStopBleBackend[0],
            {
                deviceUuid: this.uuid,
            },
            'Did not call stopBleBackend!'
        )
    }

    @test()
    protected static async disconnectThrowsOn400() {
        this.setFake400Error()

        await assert.doesThrowAsync(
            async () => await this.disconnect(),
            this.fake400Error,
            'Did not throw error!'
        )
    }

    @test()
    protected static async disconnectThrowsOn500() {
        this.setFake500Error()

        await assert.doesThrowAsync(
            async () => await this.disconnect(),
            this.fake500Error,
            'Did not throw error!'
        )
    }

    @test()
    protected static async disconnectResetsConnectedFlag() {
        await this.connect()
        await this.disconnect()

        assert.isFalse(
            this.instance.getConnected(),
            'Did not reset connected flag on disconnect!'
        )
    }

    @test()
    protected static async exposesPeriperalName() {
        await this.connect()

        assert.isEqual(
            this.instance.name,
            this.nativePeripheral.name,
            'Did not set peripheral name!'
        )
    }

    @test()
    protected static async returnsNAIfNameNotAvailable() {
        assert.isEqual(
            this.instance.name,
            'N/A',
            'Did not set default name to N/A!'
        )
    }

    @test()
    protected static async throwsWithUnknownErrorIfNoError() {
        this.setFake500ErrorWithoutError()

        await assert.doesThrowAsync(
            async () => await this.connect(),
            'Unknown error',
            'Did not throw error!'
        )
    }

    private static async connect() {
        const promise = this.instance.connect()

        const startCall = FakeLibndx.callsToStartBleBackend[0]
        startCall?.onConnected(this.nativePeripheral)

        await promise
    }

    private static async connectWithDiscovery(instance: SpyBleController) {
        const promise = instance.connect()

        FakeLibndx.callsToDiscoverBleUuid[0]?.onDiscovered(this.discoveredUuid)

        await this.waitForCall(() => FakeLibndx.callsToStartBleBackend[0])

        FakeLibndx.callsToStartBleBackend[0]?.onConnected(this.nativePeripheral)

        await promise
    }

    private static async waitForCall<T>(getCall: () => T) {
        await new Promise<void>((resolve) => {
            const check = () => {
                if (getCall()) {
                    resolve()
                } else {
                    setTimeout(check, 0)
                }
            }
            check()
        })
    }

    private static async writeCharacteristic() {
        await this.instance.writeCharacteristic(
            this.charUuid,
            this.charValueToWrite
        )
    }

    private static async disconnect() {
        await this.instance.disconnect()
    }

    private static setFake400Error() {
        FakeLibndx.fakeResult = {
            status: 400,
            error: this.fakeError,
        }
    }

    private static setFake500Error() {
        FakeLibndx.fakeResult = {
            status: 500,
            error: this.fakeError,
        }
    }

    private static setFake500ErrorWithoutError() {
        FakeLibndx.fakeResult = {
            status: 500,
        }
    }

    private static async BleController(
        options?: Partial<BleControllerOptions>
    ) {
        return (await BleDeviceController.Create({
            deviceUuid: this.uuid,
            charCallbacks: this.charCallbacks,
            onConnected: this.onConnected,
            rssiIntervalMs: this.rssiIntervalMs,
            ...options,
        })) as SpyBleController
    }

    private static async BleControllerWithPrefix() {
        return (await BleDeviceController.Create({
            deviceNamePrefix: this.namePrefix,
            charCallbacks: this.charCallbacks,
            onConnected: this.onConnected,
            rssiIntervalMs: this.rssiIntervalMs,
        } as unknown as BleControllerOptions)) as SpyBleController
    }
}
